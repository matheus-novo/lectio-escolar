using LectioEscolar.Api.Enums;

namespace LectioEscolar.Api.Dtos
{
    public class UpdateMaterialDto
    {
        public string Titulo { get; set; } = string.Empty;
        public string? Descricao { get; set; }
        public CategoriaMaterial Categoria { get; set; }
        public bool Publico { get; set; }
        public int? DisciplinaId { get; set; }
    }
}