using LectioEscolar.Api.Enums;

namespace LectioEscolar.Api.Entities
{
    public class MaterialDidatico
    {
        public int Id { get; set; }
        public string Titulo { get; set; } = string.Empty;
        public string? Descricao { get; set; }

        // Metadados Bibliográficos (específicos para Livros / Obras literárias)
        public string? Autor { get; set; }
        public int? AnoPublicacao { get; set; }

        // Metadados do Arquivo Físico
        public string NomeOriginal { get; set; } = string.Empty;
        public string NomeArquivo { get; set; } = string.Empty; // GUID físico gravado em disco
        public string ContentType { get; set; } = string.Empty;
        public long TamanhoBytes { get; set; }
        public string HashSha256 { get; set; } = string.Empty;

        // Biblioteca vs. Disciplina
        public CategoriaMaterial Categoria { get; set; }
        public bool Publico { get; set; } = false; // Acervo Geral
        public bool Ativo { get; set; } = true;

        public DateTime DataCriacao { get; set; } = DateTime.UtcNow;
        public DateTime? DataAtualizacao { get; set; }

        public int? DisciplinaId { get; set; }
        public Disciplina? Disciplina { get; set; }

        public int ProfessorId { get; set; }
        public Usuario Professor { get; set; } = null!;
    }
}