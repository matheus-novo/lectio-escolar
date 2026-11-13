using LectioEscolar.Api.Entities;
using Microsoft.EntityFrameworkCore;

namespace LectioEscolar.Api.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        public DbSet<Usuario> Usuarios { get; set; }
        public DbSet<Aluno> Alunos { get; set; }
        public DbSet<Professor> Professores { get; set; }
        public DbSet<Administrador> Administradores { get; set; }
        public DbSet<Turma> Turmas { get; set; }
        public DbSet<AlunoTurma> AlunosTurmas { get; set; }
        public DbSet<Disciplina> Disciplinas { get; set; }
        public DbSet<MaterialDidatico> MateriaisDidaticos { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Mapeamento TPH de Usuários
            modelBuilder.Entity<Usuario>()
                .HasDiscriminator<string>("TipoUsuario")
                .HasValue<Aluno>("Aluno")
                .HasValue<Professor>("Professor")
                .HasValue<Administrador>("Administrador");

            modelBuilder.Entity<Usuario>()
                .HasIndex(u => u.Email)
                .IsUnique();

            // Mapeamento da associativa AlunoTurma
            modelBuilder.Entity<AlunoTurma>()
                .HasKey(at => new { at.AlunoId, at.TurmaId });

            modelBuilder.Entity<AlunoTurma>()
                .HasOne(at => at.Aluno)
                .WithMany(a => a.AlunosTurmas)
                .HasForeignKey(at => at.AlunoId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<AlunoTurma>()
                .HasOne(at => at.Turma)
                .WithMany(t => t.AlunosTurmas)
                .HasForeignKey(at => at.TurmaId)
                .OnDelete(DeleteBehavior.Cascade);

            // Mapeamento de Disciplina com Turma e Professor
            modelBuilder.Entity<Disciplina>()
                .HasOne(d => d.Turma)
                .WithMany(t => t.Disciplinas)
                .HasForeignKey(d => d.TurmaId)
                .OnDelete(DeleteBehavior.Restrict); // Evita exclusão acidental da turma se houver matérias

            modelBuilder.Entity<Disciplina>()
                .HasOne(d => d.Professor)
                .WithMany(p => p.Disciplinas)
                .HasForeignKey(d => d.ProfessorId)
                .OnDelete(DeleteBehavior.Restrict); // Evita exclusão acidental do professor responsável

            modelBuilder.Entity<MaterialDidatico>(entity =>
            {
                entity.HasKey(m => m.Id);

                entity.Property(m => m.Titulo).IsRequired().HasMaxLength(150);
                entity.Property(m => m.Autor).HasMaxLength(150);
                entity.Property(m => m.NomeOriginal).IsRequired().HasMaxLength(255);
                entity.Property(m => m.NomeArquivo).IsRequired().HasMaxLength(255);
                entity.Property(m => m.ContentType).IsRequired().HasMaxLength(100);
                entity.Property(m => m.HashSha256).IsRequired().HasMaxLength(64);

                // Índice para busca rápida de duplicatas por hash
                entity.HasIndex(m => m.HashSha256);

                // Chave estrangeira anulável com trava Restrict
                entity.HasOne(m => m.Disciplina)
                    .WithMany(d => d.Materiais)
                    .HasForeignKey(m => m.DisciplinaId)
                    .IsRequired(false)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(m => m.Professor)
                    .WithMany()
                    .HasForeignKey(m => m.ProfessorId)
                    .OnDelete(DeleteBehavior.Restrict);
            });
        }
    }
}