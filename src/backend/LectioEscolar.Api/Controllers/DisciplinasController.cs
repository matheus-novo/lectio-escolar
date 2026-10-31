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
    public class DisciplinasController : ControllerBase
    {
        private readonly AppDbContext _context;

        public DisciplinasController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> ListAll(
            [FromQuery] int? turmaId,
            [FromQuery] int? professorId,
            [FromQuery] bool? ativo)
        {
            var query = _context.Disciplinas
                .AsNoTracking()
                .Include(d => d.Turma)
                .Include(d => d.Professor)
                .AsQueryable();

            if (turmaId.HasValue)
            {
                query = query.Where(d => d.TurmaId == turmaId.Value);
            }

            if (professorId.HasValue)
            {
                query = query.Where(d => d.ProfessorId == professorId.Value);
            }

            if (ativo.HasValue)
            {
                query = query.Where(d => d.Ativo == ativo.Value);
            }

            var disciplinas = await query
                .Select(d => new DisciplinaResponseDto
                {
                    Id = d.Id,
                    Nome = d.Nome,
                    Descricao = d.Descricao,
                    Ativo = d.Ativo,
                    TurmaId = d.TurmaId,
                    NomeTurma = d.Turma.Nome,
                    ProfessorId = d.ProfessorId,
                    NomeProfessor = d.Professor.Nome
                })
                .ToListAsync();

            return Ok(disciplinas);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var disciplina = await _context.Disciplinas
                .AsNoTracking()
                .Include(d => d.Turma)
                .Include(d => d.Professor)
                .FirstOrDefaultAsync(d => d.Id == id);

            if (disciplina == null)
            {
                return NotFound(new { mensagem = "Disciplina não encontrada." });
            }

            var response = new DisciplinaResponseDto
            {
                Id = disciplina.Id,
                Nome = disciplina.Nome,
                Descricao = disciplina.Descricao,
                Ativo = disciplina.Ativo,
                TurmaId = disciplina.TurmaId,
                NomeTurma = disciplina.Turma.Nome,
                ProfessorId = disciplina.ProfessorId,
                NomeProfessor = disciplina.Professor.Nome
            };

            return Ok(response);
        }

        [HttpPost]
        [Authorize(Roles = "Administrador")]
        public async Task<IActionResult> Create([FromBody] CreateDisciplinaDto dto)
        {
            // Valida existência da Turma
            var turmaExiste = await _context.Turmas.AnyAsync(t => t.Id == dto.TurmaId && t.Ativo);
            if (!turmaExiste)
            {
                return BadRequest(new { mensagem = "A turma informada não existe ou está desativada." });
            }

            // Valida existência do Professor
            var professorExiste = await _context.Professores.AnyAsync(p => p.Id == dto.ProfessorId && p.Ativo);
            if (!professorExiste)
            {
                return BadRequest(new { mensagem = "O professor informado não existe ou está desativado." });
            }

            var disciplina = new Disciplina
            {
                Nome = dto.Nome,
                Descricao = dto.Descricao,
                TurmaId = dto.TurmaId,
                ProfessorId = dto.ProfessorId
            };

            _context.Disciplinas.Add(disciplina);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetById), new { id = disciplina.Id }, new { mensagem = "Disciplina criada com sucesso!", id = disciplina.Id });
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Administrador")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateDisciplinaDto dto)
        {
            var disciplina = await _context.Disciplinas.FindAsync(id);
            if (disciplina == null)
            {
                return NotFound(new { mensagem = "Disciplina não encontrada." });
            }

            // Valida a nova Turma
            var turmaExiste = await _context.Turmas.AnyAsync(t => t.Id == dto.TurmaId && t.Ativo);
            if (!turmaExiste)
            {
                return BadRequest(new { mensagem = "A turma informada não existe ou está desativada." });
            }

            // Valida o novo Professor
            var professorExiste = await _context.Professores.AnyAsync(p => p.Id == dto.ProfessorId && p.Ativo);
            if (!professorExiste)
            {
                return BadRequest(new { mensagem = "O professor informado não existe ou está desativado." });
            }

            disciplina.Nome = dto.Nome;
            disciplina.Descricao = dto.Descricao;
            disciplina.TurmaId = dto.TurmaId;
            disciplina.ProfessorId = dto.ProfessorId;
            disciplina.Ativo = dto.Ativo;

            _context.Disciplinas.Update(disciplina);
            await _context.SaveChangesAsync();

            return Ok(new { mensagem = "Disciplina atualizada com sucesso!" });
        }

        [HttpPatch("{id}/deactivate")]
        [Authorize(Roles = "Administrador")]
        public async Task<IActionResult> Deactivate(int id)
        {
            var disciplina = await _context.Disciplinas.FindAsync(id);
            if (disciplina == null)
            {
                return NotFound(new { mensagem = "Disciplina não encontrada." });
            }

            disciplina.Ativo = false;
            _context.Disciplinas.Update(disciplina);
            await _context.SaveChangesAsync();

            return Ok(new { mensagem = "Disciplina desativada com sucesso!" });
        }
    }
}