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

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Mapeamento de herança TPH (Table-Per-Hierarchy)
            modelBuilder.Entity<Usuario>()
                .HasDiscriminator<string>("TipoUsuario")
                .HasValue<Aluno>("Aluno")
                .HasValue<Professor>("Professor")
                .HasValue<Administrador>("Administrador");

            // Índice único para garantir e-mails não duplicados no sistema
            modelBuilder.Entity<Usuario>()
                .HasIndex(u => u.Email)
                .IsUnique();
        }
    }
}