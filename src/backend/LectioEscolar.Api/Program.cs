using LectioEscolar.Api.Data;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Adiciona os serviços de Controllers e Swagger (Swashbuckle)
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();


DotNetEnv.Env.Load();

var connectionString = $"Host={Environment.GetEnvironmentVariable("DB_HOST")};" +
                       $"Port={Environment.GetEnvironmentVariable("DB_PORT")};" +
                       $"Database={Environment.GetEnvironmentVariable("DB_NAME")};" +
                       $"Username={Environment.GetEnvironmentVariable("DB_USER")};" +
                       $"Password={Environment.GetEnvironmentVariable("DB_PASS")};";

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString));


var app = builder.Build();

// Configura o pipeline de requisições HTTP para desenvolvimento
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(); // Ativa a interface gráfica do Swagger
}

app.UseAuthorization();

app.MapControllers();


// Endpoint temporário para testar a conexão com o banco de dados
app.MapGet("/api/lectio_escolar_db", async (AppDbContext dbContext) =>
{
    bool podeConectar = await dbContext.Database.CanConnectAsync();
    return podeConectar 
        ? Results.Ok(new { status = "Sucesso", mensagem = "Conexão com o PostgreSQL estabelecida com sucesso!" })
        : Results.Problem("Não foi possível conectar ao banco de dados. Verifique o usuário, senha e porta no .env.");
});



app.Run();