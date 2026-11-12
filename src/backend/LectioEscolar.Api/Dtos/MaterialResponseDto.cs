using LectioEscolar.Api.Enums;

namespace LectioEscolar.Api.Dtos
{
    public class MaterialResponseDto
    {
        public int Id { get; set; }
        public string Titulo { get; set; } = string.Empty;
        public string? Descricao { get; set; }
        public string NomeOriginal { get; set; } = string.Empty;
        public long TamanhoBytes { get; set; }
        public string ContentType { get; set; } = string.Empty;
        public string HashSha256 { get; set; } = string.Empty;
        public CategoriaMaterial Categoria { get; set; }
        public bool Publico { get; set; }
        public bool Ativo { get; set; }
        public DateTime DataCriacao { get; set; }
        public int? DisciplinaId { get; set; }
        public string? NomeDisciplina { get; set; }
        public int ProfessorId { get; set; }
        public string NomeProfessor { get; set; } = string.Empty;
    }
}