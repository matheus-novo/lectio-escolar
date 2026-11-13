using LectioEscolar.Api.Enums;

namespace LectioEscolar.Api.Dtos
{
    public class UploadMaterialDto
    {
        public string Titulo { get; set; } = string.Empty;
        public string? Descricao { get; set; }
        public string? Autor { get; set; }
        public int? AnoPublicacao { get; set; }
        public CategoriaMaterial Categoria { get; set; }
        public bool Publico { get; set; } = false;
        public int? DisciplinaId { get; set; }
        public IFormFile Arquivo { get; set; } = null!;
    }
}