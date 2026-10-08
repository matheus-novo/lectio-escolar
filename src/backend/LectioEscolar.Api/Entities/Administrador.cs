using LectioEscolar.Api.Enums;

namespace LectioEscolar.Api.Entities
{
    public class Administrador : Usuario
    {
        public Administrador()
        {
            Perfil = PerfilUsuario.Administrador;
        }
    }
}