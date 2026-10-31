using LectioEscolar.Api.Enums;

namespace LectioEscolar.Api.Entities
{
    public class Professor : Usuario
    {
        public string RegistroFuncional { get; set; } = string.Empty;

        public ICollection<Disciplina> Disciplinas { get; set; } = new List<Disciplina>();

        public Professor()
        {
            Perfil = PerfilUsuario.Professor;
        }
    }
}