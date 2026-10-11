using LectioEscolar.Api.Enums;

namespace LectioEscolar.Api.Dtos
{
    public class CreateUsuarioDto
    {
        public string Nome { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public PerfilUsuario Perfil { get; set; }
        
        // Específicos para Aluno ou Professor
        public string? Matricula { get; set; }
        public string? RegistroFuncional { get; set; }
    }
}