namespace LectioEscolar.Api.Dtos
{
    public class CreateTurmaDto
    {
        public string Nome { get; set; } = string.Empty;
        public int AnoLetivo { get; set; }
        public string Turno { get; set; } = string.Empty;
    }
}