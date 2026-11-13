using LectioEscolar.Api.Enums;

namespace LectioEscolar.Api.Dtos
{
    public class MaterialFilterDto
    {
        public string? Search { get; set; }
        public string? Autor { get; set; }
        public int? AnoPublicacao { get; set; }
        public int? DisciplinaId { get; set; }
        public int? TurmaId { get; set; }
        public int? ProfessorId { get; set; }
        public CategoriaMaterial? Categoria { get; set; }
        public bool? Publico { get; set; }
        public DateTime? DataInicio { get; set; }
        public DateTime? DataFim { get; set; }
        public bool? Ativo { get; set; }
    }
}