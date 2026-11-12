using LectioEscolar.Api.Enums;

namespace LectioEscolar.Api.Entities
{
    public class MaterialDidatico
    {
        public int Id { get; set; }
        public string Titulo { get; set; } = string.Empty;
        public string? Descricao { get; set; }

        // Metadados do Arquivo Físico
        public string NomeOriginal { get; set; } = string.Empty;
        public string NomeArquivo { get; set; } = string.Empty;
        public string ContentType { get; set; } = string.Empty;
        public long TamanhoBytes { get; set; }
        public string HashSha256 { get; set; } = string.Empty;

        public CategoriaMaterial Categoria { get; set; }
        public bool Publico { get; set; } = false; // true = Acervo Geral da Biblioteca Pública
        public bool Ativo { get; set; } = true;

        public DateTime DataCriacao { get; set; } = DateTime.UtcNow;
        public DateTime? DataAtualizacao { get; set; }

        // Vínculo opcional com Disciplina (null se for acervo geral da escola)
        public int? DisciplinaId { get; set; }
        public Disciplina? Disciplina { get; set; }

        // Docente ou Administrador responsável pelo envio
        public int ProfessorId { get; set; }
        public Usuario Professor { get; set; } = null!;
    }
}