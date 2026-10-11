using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using LectioEscolar.Api.Data;
using LectioEscolar.Api.Dtos;
using LectioEscolar.Api.Entities;
using LectioEscolar.Api.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace LectioEscolar.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class UsuariosController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _configuration;

        public UsuariosController(AppDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        [HttpPost("login")]
        [AllowAnonymous] 
        public async Task<IActionResult> Login([FromBody] LoginDto dto)
        {
            var usuario = await _context.Usuarios.FirstOrDefaultAsync(u => u.Email == dto.Email);

            if (usuario == null || !BCrypt.Net.BCrypt.Verify(dto.Password, usuario.PasswordHash))
            {
                return Unauthorized(new { mensagem = "E-mail ou senha inválidos." });
            }

            if (!usuario.Ativo)
            {
                return BadRequest(new { mensagem = "Usuário desativado no sistema." });
            }

            var token = GerarTokenJwt(usuario);

            return Ok(new
            {
                token,
                usuario = new ResponseUsuarioDto
                {
                    Id = usuario.Id,
                    Nome = usuario.Nome,
                    Email = usuario.Email,
                    Perfil = usuario.Perfil,
                    Ativo = usuario.Ativo
                }
            });
        }

        [HttpPost]
        [Authorize(Roles = "Administrador")] 
        public async Task<IActionResult> Create([FromBody] CreateUsuarioDto dto)
        {
            if (await _context.Usuarios.AnyAsync(u => u.Email == dto.Email))
            {
                return BadRequest(new { mensagem = "Já existe um usuário cadastrado com este e-mail." });
            }

            string passwordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password);
            Usuario novoUsuario;

            switch (dto.Perfil)
            {
                case PerfilUsuario.Aluno:
                    novoUsuario = new Aluno
                    {
                        Nome = dto.Nome,
                        Email = dto.Email,
                        PasswordHash = passwordHash,
                        Matricula = dto.Matricula ?? string.Empty
                    };
                    break;
                case PerfilUsuario.Professor:
                    novoUsuario = new Professor
                    {
                        Nome = dto.Nome,
                        Email = dto.Email,
                        PasswordHash = passwordHash,
                        RegistroFuncional = dto.RegistroFuncional ?? string.Empty
                    };
                    break;
                case PerfilUsuario.Administrador:
                    novoUsuario = new Administrador
                    {
                        Nome = dto.Nome,
                        Email = dto.Email,
                        PasswordHash = passwordHash
                    };
                    break;
                default:
                    return BadRequest(new { mensagem = "Perfil de usuário inválido." });
            }

            _context.Usuarios.Add(novoUsuario);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(ListarPorId), new { id = novoUsuario.Id }, new { mensagem = "Usuário criado com sucesso!" });
        }

        [HttpGet]
        [Authorize(Roles = "Administrador,Professor")]
        public async Task<IActionResult> ListarTodos()
        {
            var usuarios = await _context.Usuarios.ToListAsync();

            var response = usuarios.Select(u => new ResponseUsuarioDto
            {
                Id = u.Id,
                Nome = u.Nome,
                Email = u.Email,
                Perfil = u.Perfil,
                Ativo = u.Ativo,
                Matricula = u is Aluno a ? a.Matricula : null,
                RegistroFuncional = u is Professor p ? p.RegistroFuncional : null
            }).ToList();

            return Ok(response);
        }

        [HttpGet("{id}")]
        [Authorize(Roles = "Administrador,Professor")]
        public async Task<IActionResult> ListarPorId(int id)
        {
            var usuario = await _context.Usuarios.FindAsync(id);
            if (usuario == null) return NotFound(new { mensagem = "Usuário não encontrado." });

            var response = new ResponseUsuarioDto
            {
                Id = usuario.Id,
                Nome = usuario.Nome,
                Email = usuario.Email,
                Perfil = usuario.Perfil,
                Ativo = usuario.Ativo,
                Matricula = usuario is Aluno a ? a.Matricula : null,
                RegistroFuncional = usuario is Professor p ? p.RegistroFuncional : null
            };

            return Ok(response);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Administrador")] 
        public async Task<IActionResult> Update(int id, [FromBody] UpdateUsuarioDto dto)
        {
            var usuario = await _context.Usuarios.FindAsync(id);
            if (usuario == null) return NotFound(new { mensagem = "Usuário não encontrado." });

            if (await _context.Usuarios.AnyAsync(u => u.Email == dto.Email && u.Id != id))
            {
                return BadRequest(new { mensagem = "Já existe outro usuário cadastrado com este e-mail." });
            }

            
            usuario.Email = dto.Email;

            if(dto.Nome != null) usuario.Nome = dto.Nome;

            if (usuario is Aluno aluno && dto.Matricula != null)
            {
                aluno.Matricula = dto.Matricula;
            }
            else if (usuario is Professor professor && dto.RegistroFuncional != null)
            {
                professor.RegistroFuncional = dto.RegistroFuncional;
            }

            _context.Usuarios.Update(usuario);
            await _context.SaveChangesAsync();

            return Ok(new { mensagem = "Usuário atualizado com sucesso!" });
        }

        [HttpPatch("{id}/deactivate")]
        [Authorize(Roles = "Administrador")]
        public async Task<IActionResult> Deactivate(int id)
        {
            var usuario = await _context.Usuarios.FindAsync(id);
            if (usuario == null) return NotFound(new { mensagem = "Usuário não encontrado." });

            usuario.Ativo = false;
            _context.Usuarios.Update(usuario);
            await _context.SaveChangesAsync();

            return Ok(new { mensagem = "Usuário desativado com sucesso!" });
        }

        [HttpPatch("{id}/change-password")]
        public async Task<IActionResult> ChangePassword(int id, [FromBody] ChangePasswordDto dto)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var userRoleClaim = User.FindFirst(ClaimTypes.Role)?.Value;

            if (userIdClaim != id.ToString() && userRoleClaim != "Administrador")
            {
                return Forbid();
            }

            var usuario = await _context.Usuarios.FindAsync(id);
            if (usuario == null) return NotFound(new { mensagem = "Usuário não encontrado." });

            if (!BCrypt.Net.BCrypt.Verify(dto.CurrentPassword, usuario.PasswordHash))
            {
                return BadRequest(new { mensagem = "A senha atual está incorreta." });
            }

            usuario.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);

            _context.Usuarios.Update(usuario);
            await _context.SaveChangesAsync();

            return Ok(new { mensagem = "Senha alterada com sucesso!" });
        }

        private string GerarTokenJwt(Usuario usuario)
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var secretKey = Environment.GetEnvironmentVariable("Jwt__SecretKey") 
                            ?? throw new InvalidOperationException("A variável de ambiente Jwt__SecretKey não está configurada.");
            var key = Encoding.ASCII.GetBytes(secretKey);

            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, usuario.Id.ToString()),
                new Claim(ClaimTypes.Email, usuario.Email),
                new Claim(ClaimTypes.Role, usuario.Perfil.ToString())
            };

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = DateTime.UtcNow.AddHours(8),
                Issuer = Environment.GetEnvironmentVariable("Jwt__Issuer") ?? "LectioEscolarApi",
                Audience = Environment.GetEnvironmentVariable("Jwt__Audience") ?? "LectioEscolarFrontend",
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256)
            };

            var token = tokenHandler.CreateToken(tokenDescriptor);
            return tokenHandler.WriteToken(token);
        }
    }
}