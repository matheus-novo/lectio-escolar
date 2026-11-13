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

        private static readonly HashSet<string> ExtensoesAutorizadas = new(StringComparer.OrdinalIgnoreCase)
        {
            ".pdf", ".docx", ".doc", ".pptx", ".ppt"
        };

        public MateriaisController(AppDbContext context, IFileStorageService storageService)
        {
            _context = context;
            _storageService = storageService;
        }


        [HttpGet]
        public async Task<IActionResult> ListAll([FromQuery] MaterialFilterDto filter)
        {
            var currentUserId = ObterUsuarioIdAutenticado();
            var currentUserRole = ObterUsuarioPerfilAutenticado();

            var query = _context.MateriaisDidaticos
                .AsNoTracking()
                .Include(m => m.Professor)
                .Include(m => m.Disciplina)
                    .ThenInclude(d => d!.Turma)
                .AsQueryable();

            // Regra de Visibilidade: Alunos só visualizam materiais ativos que sejam do Acervo Público
            // OU vinculados a disciplinas das turmas em que estão matriculados
            if (currentUserRole == "Aluno")
            {
                query = query.Where(m => m.Ativo && (
                    m.Publico ||
                    (m.Disciplina != null && _context.AlunosTurmas.Any(at => at.AlunoId == currentUserId && at.TurmaId == m.Disciplina.TurmaId))
                ));
            }
            else
            {
                if (filter.Ativo.HasValue)
                {
                    query = query.Where(m => m.Ativo == filter.Ativo.Value);
                }
                else
                {
                    query = query.Where(m => m.Ativo);
                }
            }

            // Busca textual combinada: Título, Descrição ou Autor da obra
            if (!string.IsNullOrWhiteSpace(filter.Search))
            {
                var termo = filter.Search.Trim().ToLower();
                query = query.Where(m =>
                    m.Titulo.ToLower().Contains(termo) ||
                    (m.Descricao != null && m.Descricao.ToLower().Contains(termo)) ||
                    (m.Autor != null && m.Autor.ToLower().Contains(termo)));
            }

            // Filtro específico por Autor da obra
            if (!string.IsNullOrWhiteSpace(filter.Autor))
            {
                var autorTermo = filter.Autor.Trim().ToLower();
                query = query.Where(m => m.Autor != null && m.Autor.ToLower().Contains(autorTermo));
            }

            // Filtro por Ano de Publicação
            if (filter.AnoPublicacao.HasValue)
            {
                query = query.Where(m => m.AnoPublicacao == filter.AnoPublicacao.Value);
            }

            // Filtro por Disciplina
            if (filter.DisciplinaId.HasValue)
            {
                query = query.Where(m => m.DisciplinaId == filter.DisciplinaId.Value);
            }

            // Filtro por Turma
            if (filter.TurmaId.HasValue)
            {
                query = query.Where(m => m.Disciplina != null && m.Disciplina.TurmaId == filter.TurmaId.Value);
            }

            // Filtro por Professor que enviou o material
            if (filter.ProfessorId.HasValue)
            {
                query = query.Where(m => m.ProfessorId == filter.ProfessorId.Value);
            }

            // Filtro por Categoria (Livro, Apostila, Slide, etc.)
            if (filter.Categoria.HasValue)
            {
                query = query.Where(m => m.Categoria == filter.Categoria.Value);
            }

            // Filtro por Acervo Público vs. Restrito a Disciplina
            if (filter.Publico.HasValue)
            {
                query = query.Where(m => m.Publico == filter.Publico.Value);
            }

            // Filtro por Data Inicial de Envio
            if (filter.DataInicio.HasValue)
            {
                var dataInicioUtc = DateTime.SpecifyKind(filter.DataInicio.Value.Date, DateTimeKind.Utc);
                query = query.Where(m => m.DataCriacao >= dataInicioUtc);
            }

            // Filtro por Data Final de Envio
            if (filter.DataFim.HasValue)
            {
                var dataFimUtc = DateTime.SpecifyKind(filter.DataFim.Value.Date.AddDays(1).AddTicks(-1), DateTimeKind.Utc);
                query = query.Where(m => m.DataCriacao <= dataFimUtc);
            }

            var materiais = await query
                .OrderByDescending(m => m.DataCriacao)
                .Select(m => new MaterialResponseDto
                {
                    Id = m.Id,
                    Titulo = m.Titulo,
                    Descricao = m.Descricao,
                    Autor = m.Autor,
                    AnoPublicacao = m.AnoPublicacao,
                    NomeOriginal = m.NomeOriginal,
                    TamanhoBytes = m.TamanhoBytes,
                    ContentType = m.ContentType,
                    HashSha256 = m.HashSha256,
                    Categoria = m.Categoria,
                    Publico = m.Publico,
                    Ativo = m.Ativo,
                    DataCriacao = m.DataCriacao,
                    DisciplinaId = m.DisciplinaId,
                    NomeDisciplina = m.Disciplina != null ? m.Disciplina.Nome : null,
                    TurmaId = m.Disciplina != null ? m.Disciplina.TurmaId : null,
                    NomeTurma = m.Disciplina != null && m.Disciplina.Turma != null ? m.Disciplina.Turma.Nome : null,
                    ProfessorId = m.ProfessorId,
                    NomeProfessor = m.Professor.Nome
                })
                .ToListAsync();

            return Ok(materiais);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var material = await _context.MateriaisDidaticos
                .AsNoTracking()
                .Include(m => m.Professor)
                .Include(m => m.Disciplina)
                    .ThenInclude(d => d!.Turma)
                .FirstOrDefaultAsync(m => m.Id == id);

            if (material == null)
                return NotFound(new { mensagem = "Material didático não encontrado." });

            var currentUserId = ObterUsuarioIdAutenticado();
            var currentUserRole = ObterUsuarioPerfilAutenticado();

            if (!material.Ativo && currentUserRole == "Aluno")
                return NotFound(new { mensagem = "Material didático não encontrado ou indisponível." });

            if (!await UsuarioPodeAcessarMaterialAsync(material, currentUserId, currentUserRole))
            {
                return Forbid();
            }

            var response = new MaterialResponseDto
            {
                Id = material.Id,
                Titulo = material.Titulo,
                Descricao = material.Descricao,
                Autor = material.Autor,
                AnoPublicacao = material.AnoPublicacao,
                NomeOriginal = material.NomeOriginal,
                TamanhoBytes = material.TamanhoBytes,
                ContentType = material.ContentType,
                HashSha256 = material.HashSha256,
                Categoria = material.Categoria,
                Publico = material.Publico,
                Ativo = material.Ativo,
                DataCriacao = material.DataCriacao,
                DisciplinaId = material.DisciplinaId,
                NomeDisciplina = material.Disciplina?.Nome,
                TurmaId = material.Disciplina?.TurmaId,
                NomeTurma = material.Disciplina?.Turma?.Nome,
                ProfessorId = material.ProfessorId,
                NomeProfessor = material.Professor.Nome
            };

            return Ok(response);
        }


        [HttpGet("{id}/download")]
        public async Task<IActionResult> Download(int id)
        {
            var material = await _context.MateriaisDidaticos
                .AsNoTracking()
                .Include(m => m.Disciplina)
                .FirstOrDefaultAsync(m => m.Id == id);

            if (material == null || !material.Ativo)
                return NotFound(new { mensagem = "Material não encontrado ou indisponível." });

            var currentUserId = ObterUsuarioIdAutenticado();
            var currentUserRole = ObterUsuarioPerfilAutenticado();

            if (!await UsuarioPodeAcessarMaterialAsync(material, currentUserId, currentUserRole))
            {
                return Forbid();
            }

            if (!_storageService.FileExists(material.NomeArquivo))
                return NotFound(new { mensagem = "O arquivo físico não foi localizado no armazenamento do servidor." });

            var caminhoFisico = _storageService.GetPhysicalPath(material.NomeArquivo);

            return PhysicalFile(caminhoFisico, material.ContentType, material.NomeOriginal);
        }


        [HttpGet("{id}/preview")]
        public async Task<IActionResult> Preview(int id)
        {
            var material = await _context.MateriaisDidaticos
                .AsNoTracking()
                .Include(m => m.Disciplina)
                .FirstOrDefaultAsync(m => m.Id == id);

            if (material == null || !material.Ativo)
                return NotFound(new { mensagem = "Material não encontrado ou indisponível." });

            var currentUserId = ObterUsuarioIdAutenticado();
            var currentUserRole = ObterUsuarioPerfilAutenticado();

            if (!await UsuarioPodeAcessarMaterialAsync(material, currentUserId, currentUserRole))
            {
                return Forbid();
            }

            var extensao = Path.GetExtension(material.NomeOriginal);
            if (!string.Equals(extensao, ".pdf", StringComparison.OrdinalIgnoreCase) &&
                !string.Equals(material.ContentType, "application/pdf", StringComparison.OrdinalIgnoreCase))
            {
                return BadRequest(new { mensagem = "A pré-visualização em tela é suportada exclusivamente para documentos em formato PDF." });
            }

            if (!_storageService.FileExists(material.NomeArquivo))
                return NotFound(new { mensagem = "O arquivo físico não foi localizado no armazenamento do servidor." });

            var caminhoFisico = _storageService.GetPhysicalPath(material.NomeArquivo);

            Response.Headers.Append("Content-Disposition", $"inline; filename=\"{Uri.EscapeDataString(material.NomeOriginal)}\"");

            return PhysicalFile(caminhoFisico, "application/pdf", enableRangeProcessing: true);
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

            if (!dto.Publico && dto.DisciplinaId.HasValue && currentUserRole == "Professor")
            {
                var disciplina = await _context.Disciplinas.FindAsync(dto.DisciplinaId.Value);
                if (disciplina != null && disciplina.ProfessorId != currentUserId)
                {
                    return Forbid();
                }
            }

            string fileHash;
            using (var sha256 = SHA256.Create())
            using (var stream = dto.Arquivo.OpenReadStream())
            {
                var hashBytes = await sha256.ComputeHashAsync(stream);
                fileHash = Convert.ToHexString(hashBytes);
            }

            var materialExistente = await _context.MateriaisDidaticos
                .AsNoTracking()
                .FirstOrDefaultAsync(m => m.HashSha256 == fileHash);

            if (materialExistente != null)
            {
                var statusTexto = materialExistente.Ativo ? "ativo" : "inativo/arquivado";
                return Conflict(new
                {
                    mensagem = $"Este arquivo já está cadastrado no acervo sob o título '{materialExistente.Titulo}' (status: {statusTexto}). Envio duplicado cancelado.",
                    materialIdExistente = materialExistente.Id,
                    ativo = materialExistente.Ativo
                });
            }

            var nomeArquivoFisico = await _storageService.SaveFileAsync(dto.Arquivo);

            var material = new MaterialDidatico
            {
                Titulo = dto.Titulo,
                Descricao = dto.Descricao,
                Autor = string.IsNullOrWhiteSpace(dto.Autor) ? null : dto.Autor.Trim(),
                AnoPublicacao = dto.AnoPublicacao,
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
            material.Autor = string.IsNullOrWhiteSpace(dto.Autor) ? null : dto.Autor.Trim();
            material.AnoPublicacao = dto.AnoPublicacao;
            material.Categoria = dto.Categoria;
            material.Publico = dto.Publico;
            material.DisciplinaId = dto.Publico ? null : dto.DisciplinaId;
            material.Ativo = dto.Ativo;
            material.DataAtualizacao = DateTime.UtcNow;

            _context.MateriaisDidaticos.Update(material);
            await _context.SaveChangesAsync();

            return Ok(new { mensagem = "Dados do material atualizados com sucesso!" });
        }

        [HttpPatch("{id}/deactivate")]
        [Authorize(Roles = "Professor,Administrador")]
        public async Task<IActionResult> Deactivate(int id)
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

            material.Ativo = false;
            material.DataAtualizacao = DateTime.UtcNow;

            _context.MateriaisDidaticos.Update(material);
            await _context.SaveChangesAsync();

            return Ok(new { mensagem = "Material didático desativado com sucesso!" });
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

            await _storageService.DeleteFileAsync(material.NomeArquivo);

            _context.MateriaisDidaticos.Remove(material);
            await _context.SaveChangesAsync();

            return Ok(new { mensagem = "Material e arquivo físico removidos com sucesso!" });
        }

        // --- Métodos Auxiliares de Segurança e Autorização ---

        private async Task<bool> UsuarioPodeAcessarMaterialAsync(MaterialDidatico material, int userId, string userRole)
        {
            if (userRole == "Administrador" || userRole == "Professor")
                return true;

            if (material.Publico)
                return true;

            if (material.DisciplinaId.HasValue && material.Disciplina != null)
            {
                return await _context.AlunosTurmas.AnyAsync(at =>
                    at.AlunoId == userId &&
                    at.TurmaId == material.Disciplina.TurmaId);
            }

            return false;
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