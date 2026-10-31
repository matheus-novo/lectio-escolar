namespace LectioEscolar.Api.Dtos
{
    public class UpdateTurmaDto
    {
        public string Nome { get; set; } = string.Empty;
        public int AnoLetivo { get; set; }
        public string Turno { get; set; } = string.Empty;
        public bool Ativo { get; set; }
    }
}