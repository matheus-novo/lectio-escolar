using LectioEscolar.Api.Enums;

namespace LectioEscolar.Api.Entities
{
    public abstract class Usuario
    {
        public int Id { get; set; }
        public string Nome { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;
        public PerfilUsuario Perfil { get; set; }
        public bool Ativo { get; set; } = true;
        public DateTime DataCriacao { get; set; } = DateTime.UtcNow;
    }
}