using LectioEscolar.Api.Enums;

namespace LectioEscolar.Api.Entities
{
    public class Aluno : Usuario
    {
        public string Matricula { get; set; } = string.Empty;

        public ICollection<AlunoTurma> AlunosTurmas { get; set; } = new List<AlunoTurma>();

        public Aluno()
        {
            Perfil = PerfilUsuario.Aluno;
        }
    }
}