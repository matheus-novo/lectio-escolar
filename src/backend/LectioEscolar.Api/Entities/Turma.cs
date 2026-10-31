namespace LectioEscolar.Api.Entities
{
    public class Turma
    {
        public int Id { get; set; }
        public string Nome { get; set; } = string.Empty;
        public int AnoLetivo { get; set; }
        public string Turno { get; set; } = string.Empty; // Ex: Manhã, Tarde, Noite, Integral
        public bool Ativo { get; set; } = true;
        public DateTime DataCriacao { get; set; } = DateTime.UtcNow;

        // Propriedade de navegação para a relação N:N
        public ICollection<AlunoTurma> AlunosTurmas { get; set; } = new List<AlunoTurma>();
    }
}