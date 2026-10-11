using LectioEscolar.Api.Enums;

namespace LectioEscolar.Api.Dtos;

public class ResponseUsuarioDto
{
    public int Id { get; set; }
    public string Nome { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public PerfilUsuario Perfil { get; set; }
    public bool Ativo { get; set; }
    public string? Matricula { get; set; }
    public string? RegistroFuncional { get; set; }
}
