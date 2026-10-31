namespace LectioEscolar.Api.Dtos
{
    public class DisciplinaResponseDto
    {
        public int Id { get; set; }
        public string Nome { get; set; } = string.Empty;
        public string? Descricao { get; set; }
        public bool Ativo { get; set; }
        public int TurmaId { get; set; }
        public string NomeTurma { get; set; } = string.Empty;
        public int ProfessorId { get; set; }
        public string NomeProfessor { get; set; } = string.Empty;
    }
}