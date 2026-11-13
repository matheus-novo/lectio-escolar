using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LectioEscolar.Api.Migrations
{
    /// <inheritdoc />
    public partial class AdicionarMetadadosBibliograficosMaterial : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "AnoPublicacao",
                table: "MateriaisDidaticos",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Autor",
                table: "MateriaisDidaticos",
                type: "character varying(150)",
                maxLength: 150,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AnoPublicacao",
                table: "MateriaisDidaticos");

            migrationBuilder.DropColumn(
                name: "Autor",
                table: "MateriaisDidaticos");
        }
    }
}
