namespace LectioEscolar.Api.Dtos
{
    public class UpdateDisciplinaDto
    {
        public string Nome { get; set; } = string.Empty;
        public string? Descricao { get; set; }
        public int TurmaId { get; set; }
        public int ProfessorId { get; set; }
        public bool Ativo { get; set; }
    }
}