using System.Security.Claims;
using System.Security.Cryptography;
using LectioEscolar.Api.Data;
using LectioEscolar.Api.Dtos;
using LectioEscolar.Api.Entities;
using LectioEscolar.Api.Enums;
using LectioEscolar.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LectioEscolar.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class MateriaisController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IFileStorageService _storageService;

        private const long LimiteTamanhoBytes = 30 * 1024 * 1024; // 30 MB

        // Formatos autorizados conforme RN003 (Documentos e Livros Digitais)
        private static readonly HashSet<string> ExtensoesAutorizadas = new(StringComparer.OrdinalIgnoreCase)
        {
            ".pdf", ".docx", ".doc", ".pptx", ".ppt"
        };

        public MateriaisController(AppDbContext context, IFileStorageService storageService)
        {
            _context = context;
            _storageService = storageService;
        }

        [HttpPost]
        [Authorize(Roles = "Professor,Administrador")]
        [RequestSizeLimit(35 * 1024 * 1024)]
        public async Task<IActionResult> Upload([FromForm] UploadMaterialDto dto)
        {
            if (dto.Arquivo == null || dto.Arquivo.Length == 0)
                return BadRequest(new { mensagem = "O arquivo para upload é obrigatório." });

            if (dto.Arquivo.Length > LimiteTamanhoBytes)
                return BadRequest(new { mensagem = "O arquivo ultrapassa o limite máximo permitido de 30 MB." });

            var extensao = Path.GetExtension(dto.Arquivo.FileName);
            if (string.IsNullOrEmpty(extensao) || !ExtensoesAutorizadas.Contains(extensao))
            {
                return BadRequest(new { mensagem = $"Formato '{extensao}' não permitido. Formatos aceitos: PDF, DOCX e PPT." });
            }

            // Validação de Vínculo: Se não for público, obriga informar uma disciplina ativa
            if (!dto.Publico)
            {
                if (!dto.DisciplinaId.HasValue)
                {
                    return BadRequest(new { mensagem = "Para materiais restritos a turmas, é obrigatório informar uma disciplina válida." });
                }

                var disciplinaExiste = await _context.Disciplinas.AnyAsync(d => d.Id == dto.DisciplinaId.Value && d.Ativo);
                if (!disciplinaExiste)
                {
                    return BadRequest(new { mensagem = "A disciplina informada não existe ou está inativa." });
                }
            }

            var currentUserId = ObterUsuarioIdAutenticado();
            var currentUserRole = ObterUsuarioPerfilAutenticado();

            // Se for restrito a disciplina e o usuário for Professor, ele deve ser o docente responsável
            if (!dto.Publico && dto.DisciplinaId.HasValue && currentUserRole == "Professor")
            {
                var disciplina = await _context.Disciplinas.FindAsync(dto.DisciplinaId.Value);
                if (disciplina != null && disciplina.ProfessorId != currentUserId)
                {
                    return Forbid();
                }
            }

            // 1. Calcula o Hash SHA-256 do arquivo em memória
            string fileHash;
            using (var sha256 = SHA256.Create())
            using (var stream = dto.Arquivo.OpenReadStream())
            {
                var hashBytes = await sha256.ComputeHashAsync(stream);
                fileHash = Convert.ToHexString(hashBytes);
            }

            // 2. Validação contra duplicidade de acervo
            var materialExistente = await _context.MateriaisDidaticos
                .AsNoTracking()
                .FirstOrDefaultAsync(m => m.HashSha256 == fileHash && m.Ativo);

            if (materialExistente != null)
            {
                return Conflict(new
                {
                    mensagem = $"Este arquivo já está cadastrado no acervo sob o título '{materialExistente.Titulo}'. Envio duplicado cancelado.",
                    materialIdExistente = materialExistente.Id
                });
            }

            // 3. Grava o binário fisicamente no disco com GUID
            var nomeArquivoFisico = await _storageService.SaveFileAsync(dto.Arquivo);

            // 4. Salva os metadados no PostgreSQL
            var material = new MaterialDidatico
            {
                Titulo = dto.Titulo,
                Descricao = dto.Descricao,
                NomeOriginal = dto.Arquivo.FileName,
                NomeArquivo = nomeArquivoFisico,
                ContentType = dto.Arquivo.ContentType ?? "application/octet-stream",
                TamanhoBytes = dto.Arquivo.Length,
                HashSha256 = fileHash,
                Categoria = dto.Categoria,
                Publico = dto.Publico,
                DisciplinaId = dto.Publico ? null : dto.DisciplinaId,
                ProfessorId = currentUserId
            };

            _context.MateriaisDidaticos.Add(material);
            await _context.SaveChangesAsync();

            return StatusCode(StatusCodes.Status201Created, new
            {
                mensagem = dto.Publico ? "Item adicionado ao acervo público da biblioteca!" : "Material didático enviado com sucesso!",
                id = material.Id,
                hash = fileHash
            });
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Professor,Administrador")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateMaterialDto dto)
        {
            var material = await _context.MateriaisDidaticos.FindAsync(id);
            if (material == null)
                return NotFound(new { mensagem = "Material não encontrado." });

            var currentUserId = ObterUsuarioIdAutenticado();
            var currentUserRole = ObterUsuarioPerfilAutenticado();

            if (currentUserRole != "Administrador" && material.ProfessorId != currentUserId)
            {
                return Forbid();
            }

            if (!dto.Publico && dto.DisciplinaId.HasValue)
            {
                var disciplinaExiste = await _context.Disciplinas.AnyAsync(d => d.Id == dto.DisciplinaId.Value && d.Ativo);
                if (!disciplinaExiste)
                    return BadRequest(new { mensagem = "Disciplina informada não existe ou está inativa." });
            }

            material.Titulo = dto.Titulo;
            material.Descricao = dto.Descricao;
            material.Categoria = dto.Categoria;
            material.Publico = dto.Publico;
            material.DisciplinaId = dto.Publico ? null : dto.DisciplinaId;
            material.DataAtualizacao = DateTime.UtcNow;

            _context.MateriaisDidaticos.Update(material);
            await _context.SaveChangesAsync();

            return Ok(new { mensagem = "Dados do material atualizados com sucesso!" });
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Professor,Administrador")]
        public async Task<IActionResult> Delete(int id)
        {
            var material = await _context.MateriaisDidaticos.FindAsync(id);
            if (material == null)
                return NotFound(new { mensagem = "Material não encontrado." });

            var currentUserId = ObterUsuarioIdAutenticado();
            var currentUserRole = ObterUsuarioPerfilAutenticado();

            if (currentUserRole != "Administrador" && material.ProfessorId != currentUserId)
            {
                return Forbid();
            }

            // Exclusão física do arquivo em disco
            await _storageService.DeleteFileAsync(material.NomeArquivo);

            // Remoção lógica ou física do registro de metadados
            _context.MateriaisDidaticos.Remove(material);
            await _context.SaveChangesAsync();

            return Ok(new { mensagem = "Material e arquivo físico removidos com sucesso!" });
        }

        private int ObterUsuarioIdAutenticado()
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(claim, out var id) ? id : 0;
        }

        private string ObterUsuarioPerfilAutenticado()
        {
            return User.FindFirst(ClaimTypes.Role)?.Value ?? string.Empty;
        }
    }
}