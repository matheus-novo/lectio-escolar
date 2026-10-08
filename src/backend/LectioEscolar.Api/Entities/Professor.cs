using LectioEscolar.Api.Enums;

namespace LectioEscolar.Api.Entities
{
    public class Professor : Usuario
    {
        public string RegistroFuncional { get; set; } = string.Empty;

        public Professor()
        {
            Perfil = PerfilUsuario.Professor;
        }
    }
}