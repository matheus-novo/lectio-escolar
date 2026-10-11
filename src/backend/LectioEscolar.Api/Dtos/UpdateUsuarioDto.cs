namespace LectioEscolar.Api.Dtos;

public class UpdateUsuarioDto
{
    public string? Nome { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Matricula { get; set; }
    public string? RegistroFuncional { get; set; }
}
