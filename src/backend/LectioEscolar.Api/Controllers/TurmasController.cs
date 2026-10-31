using LectioEscolar.Api.Data;
using LectioEscolar.Api.Dtos;
using LectioEscolar.Api.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LectioEscolar.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class TurmasController : ControllerBase
    {
        private readonly AppDbContext _context;

        public TurmasController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> ListAll([FromQuery] bool? ativo)
        {
            var query = _context.Turmas.AsNoTracking();

            if (ativo.HasValue)
            {
                query = query.Where(t => t.Ativo == ativo.Value);
            }

            var turmas = await query
                .Select(t => new TurmaResponseDto
                {
                    Id = t.Id,
                    Nome = t.Nome,
                    AnoLetivo = t.AnoLetivo,
                    Turno = t.Turno,
                    Ativo = t.Ativo,
                    TotalAlunos = t.AlunosTurmas.Count
                })
                .ToListAsync();

            return Ok(turmas);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var turma = await _context.Turmas
                .AsNoTracking()
                .Include(t => t.AlunosTurmas)
                    .ThenInclude(at => at.Aluno)
                .FirstOrDefaultAsync(t => t.Id == id);

            if (turma == null)
            {
                return NotFound(new { mensagem = "Turma não encontrada." });
            }

            var response = new
            {
                turma.Id,
                turma.Nome,
                turma.AnoLetivo,
                turma.Turno,
                turma.Ativo,
                Alunos = turma.AlunosTurmas.Select(at => new AlunoResumoDto
                {
                    Id = at.Aluno.Id,
                    Nome = at.Aluno.Nome,
                    Email = at.Aluno.Email,
                    Matricula = at.Aluno.Matricula,
                    DataMatricula = at.DataMatricula
                }).ToList()
            };

            return Ok(response);
        }

        [HttpPost]
        [Authorize(Roles = "Administrador")]
        public async Task<IActionResult> Create([FromBody] CreateTurmaDto dto)
        {
            var turma = new Turma
            {
                Nome = dto.Nome,
                AnoLetivo = dto.AnoLetivo,
                Turno = dto.Turno
            };

            _context.Turmas.Add(turma);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetById), new { id = turma.Id }, new { mensagem = "Turma criada com sucesso!", id = turma.Id });
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Administrador")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateTurmaDto dto)
        {
            var turma = await _context.Turmas.FindAsync(id);
            if (turma == null)
            {
                return NotFound(new { mensagem = "Turma não encontrada." });
            }

            turma.Nome = dto.Nome;
            turma.AnoLetivo = dto.AnoLetivo;
            turma.Turno = dto.Turno;
            turma.Ativo = dto.Ativo;

            _context.Turmas.Update(turma);
            await _context.SaveChangesAsync();

            return Ok(new { mensagem = "Turma atualizada com sucesso!" });
        }

        [HttpPatch("{id}/deactivate")]
        [Authorize(Roles = "Administrador")]
        public async Task<IActionResult> Deactivate(int id)
        {
            var turma = await _context.Turmas.FindAsync(id);
            if (turma == null)
            {
                return NotFound(new { mensagem = "Turma não encontrada." });
            }

            turma.Ativo = false;

            _context.Turmas.Update(turma);
            await _context.SaveChangesAsync();

            return Ok(new { mensagem = "Turma desativada com sucesso!" });
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Administrador")]
        public async Task<IActionResult> Delete(int id)
        {
            var turma = await _context.Turmas.FindAsync(id);
            if (turma == null)
            {
                return NotFound(new { mensagem = "Turma não encontrada." });
            }

            if (await _context.AlunosTurmas.AnyAsync(at => at.TurmaId == id))
            {
                return BadRequest(new { mensagem = "Não é possível excluir fisicamente uma turma com histórico de alunos matriculados. Opte pela desativação." });
            }

            _context.Turmas.Remove(turma);
            await _context.SaveChangesAsync();

            return Ok(new { mensagem = "Turma removida com sucesso!" });
        }
    
        // --- Endpoints de Enturmação ---

        [HttpPost("{id}/alunos")]
        [Authorize(Roles = "Administrador")]
        public async Task<IActionResult> EnrollAlunos(int id, [FromBody] EnrollAlunosDto dto)
        {
            var turma = await _context.Turmas.FindAsync(id);
            if (turma == null)
            {
                return NotFound(new { mensagem = "Turma não encontrada." });
            }

            if (dto.AlunosIds == null || !dto.AlunosIds.Any())
            {
                return BadRequest(new { mensagem = "Informe ao menos um aluno para enturmação." });
            }

            // Garante que todos os IDs passados existem e são realmente Alunos ativos
            var alunosValidos = await _context.Alunos
                .Where(a => dto.AlunosIds.Contains(a.Id) && a.Ativo)
                .Select(a => a.Id)
                .ToListAsync();

            if (alunosValidos.Count != dto.AlunosIds.Distinct().Count())
            {
                return BadRequest(new { mensagem = "Um ou mais identificadores informados não pertencem a discentes válidos ou ativos." });
            }

            // Identifica quais já estão vinculados nesta turma para não duplicar
            var alunosJaEnturmados = await _context.AlunosTurmas
                .Where(at => at.TurmaId == id && dto.AlunosIds.Contains(at.AlunoId))
                .Select(at => at.AlunoId)
                .ToListAsync();

            var novosAlunosIds = alunosValidos.Except(alunosJaEnturmados).ToList();

            if (!novosAlunosIds.Any())
            {
                return BadRequest(new { mensagem = "Todos os discentes selecionados já estão matriculados nesta turma." });
            }

            var novasEnturmacoes = novosAlunosIds.Select(alunoId => new AlunoTurma
            {
                TurmaId = id,
                AlunoId = alunoId,
                DataMatricula = DateTime.UtcNow
            });

            await _context.AlunosTurmas.AddRangeAsync(novasEnturmacoes);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                mensagem = $"{novosAlunosIds.Count} discente(s) enturmado(s) com sucesso!",
                adicionados = novosAlunosIds.Count,
                ignoradosPorJaExistirem = alunosJaEnturmados.Count
            });
        }

        [HttpDelete("{id}/alunos/{alunoId}")]
        [Authorize(Roles = "Administrador")]
        public async Task<IActionResult> UnenrollAluno(int id, int alunoId)
        {
            var vinculo = await _context.AlunosTurmas
                .FirstOrDefaultAsync(at => at.TurmaId == id && at.AlunoId == alunoId);

            if (vinculo == null)
            {
                return NotFound(new { mensagem = "Vínculo entre o discente e a turma informada não foi localizado." });
            }

            _context.AlunosTurmas.Remove(vinculo);
            await _context.SaveChangesAsync();

            return Ok(new { mensagem = "Discente desvinculado da turma com sucesso!" });
        }
    }
}