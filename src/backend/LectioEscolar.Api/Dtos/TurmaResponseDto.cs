namespace LectioEscolar.Api.Dtos
{
    public class TurmaResponseDto
    {
        public int Id { get; set; }
        public string Nome { get; set; } = string.Empty;
        public int AnoLetivo { get; set; }
        public string Turno { get; set; } = string.Empty;
        public bool Ativo { get; set; }
        public int TotalAlunos { get; set; }
    }
}