using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using OctoCare.Api.Data;
using OctoCare.Api.Services;

var builder = WebApplication.CreateBuilder(args);
var port = Environment.GetEnvironmentVariable("PORT") ?? "8080";
builder.WebHost.UseUrls($"http://0.0.0.0:{port}");

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? CreateRailwayConnectionString(builder.Configuration)
    ?? throw new InvalidOperationException("Connection string 'DefaultConnection' was not found.");
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
    ?? ["http://localhost:3000", "http://localhost:5173", "http://localhost:4200"];

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddDbContext<AppDbContext>(options => options.UseNpgsql(connectionString));
builder.Services.AddCors(options =>
{
    options.AddPolicy("WebApp", policy =>
    {
        policy.WithOrigins(allowedOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});
builder.Services.AddHttpClient<IAiService, AiService>();
builder.Services.AddHealthChecks();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors("WebApp");
app.UseAuthorization();
app.MapControllers();
app.MapHealthChecks("/health");

app.Run();

static string? CreateRailwayConnectionString(IConfiguration configuration)
{
    var host = configuration["PGHOST"];
    var database = configuration["PGDATABASE"];
    var username = configuration["PGUSER"];
    var password = configuration["PGPASSWORD"];

    if (string.IsNullOrWhiteSpace(host)
        || string.IsNullOrWhiteSpace(database)
        || string.IsNullOrWhiteSpace(username)
        || string.IsNullOrWhiteSpace(password))
    {
        return null;
    }

    var portValue = configuration["PGPORT"] ?? "5432";
    if (!int.TryParse(portValue, out var port))
    {
        throw new InvalidOperationException("The PostgreSQL port in 'PGPORT' is invalid.");
    }

    return new NpgsqlConnectionStringBuilder
    {
        Host = host,
        Port = port,
        Database = database,
        Username = username,
        Password = password
    }.ConnectionString;
}
