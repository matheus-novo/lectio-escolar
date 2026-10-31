namespace LectioEscolar.Api.Dtos
{
    public class AlunoResumoDto
    {
        public int Id { get; set; }
        public string Nome { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Matricula { get; set; } = string.Empty;
        public DateTime DataMatricula { get; set; }
    }
}