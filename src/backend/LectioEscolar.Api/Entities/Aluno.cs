using LectioEscolar.Api.Enums;

namespace LectioEscolar.Api.Entities
{
    public class Aluno : Usuario
    {
        public string Matricula { get; set; } = string.Empty;

        public Aluno()
        {
            Perfil = PerfilUsuario.Aluno;
        }
    }
}