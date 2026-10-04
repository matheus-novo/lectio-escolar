var builder = WebApplication.CreateBuilder(args);

// Adiciona os serviços de Controllers e Swagger (Swashbuckle)
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Configura o pipeline de requisições HTTP para desenvolvimento
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(); // Ativa a interface gráfica do Swagger
}

app.UseAuthorization();

app.MapControllers();

app.Run();