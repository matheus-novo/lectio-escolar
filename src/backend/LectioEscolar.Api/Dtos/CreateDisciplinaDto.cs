namespace LectioEscolar.Api.Dtos
{
    public class CreateDisciplinaDto
    {
        public string Nome { get; set; } = string.Empty;
        public string? Descricao { get; set; }
        public int TurmaId { get; set; }
        public int ProfessorId { get; set; }
    }
}