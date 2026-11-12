using LectioEscolar.Api.Enums;

namespace LectioEscolar.Api.Dtos
{
    public class UploadMaterialDto
    {
        public string Titulo { get; set; } = string.Empty;
        public string? Descricao { get; set; }
        public CategoriaMaterial Categoria { get; set; }
        public bool Publico { get; set; } = false; // Se for acervo geral, marcar true
        public int? DisciplinaId { get; set; } // Obrigatório apenas se Publico for false
        public IFormFile Arquivo { get; set; } = null!;
    }
}