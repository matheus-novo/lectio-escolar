namespace LectioEscolar.Api.Entities
{
    public class Disciplina
    {
        public int Id { get; set; }
        public string Nome { get; set; } = string.Empty;
        public string? Descricao { get; set; }
        public bool Ativo { get; set; } = true;
        public DateTime DataCriacao { get; set; } = DateTime.UtcNow;

        // Vínculo com Turma (N:1)
        public int TurmaId { get; set; }
        public Turma Turma { get; set; } = null!;

        // Vínculo com Professor (N:1)
        public int ProfessorId { get; set; }
        public Professor Professor { get; set; } = null!;
    }
}