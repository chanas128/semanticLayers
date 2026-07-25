using Microsoft.EntityFrameworkCore;
using HomToMadad.Data.Data;
using HomToMadad.Data.Repositories;
using HomToMadad.Data.Interceptors;
using HomToMadad.Data;
using HomToMadad.Services;
using HomToMadad.Services.SemanticLayer;
using HomToMadad.Common.Infrastructure;
using HomToMadad.API.Infrastructure;

var builder = WebApplication.CreateBuilder(args);

// Controllers + JSON (camelCase to match Angular interfaces)
builder.Services.AddControllers()
    .AddJsonOptions(opts => opts.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase);
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Anonymous Auth (for submission — documented in design doc)
builder.Services.AddAuthentication();
builder.Services.AddAuthorization();

// DbContext
builder.Services.AddScoped<AuditInterceptor>();
builder.Services.AddDbContext<Context>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("AppDbConnection")));

// Repositories
builder.Services.AddScoped<ConnectionsRepo>();
builder.Services.AddScoped<SemanticLayerRepo>();

// Services
builder.Services.AddScoped<DatabaseMetadataService>();
builder.Services.AddScoped<SemanticLayerService>();
builder.Services.AddScoped<DynamicQueryService>();
builder.Services.AddScoped<ILogService, LogService>();

// UnitOfWork
builder.Services.AddScoped<UnitOfWork>();

// Infrastructure
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();

// CORS — open for cloud deployment (Vercel frontend)
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod());
});

// Logging
builder.Logging.ClearProviders();
builder.Logging.AddConsole();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors();
app.UseMiddleware<HomToMadad.Data.Middleware.ErrorHandlingMiddleware>();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers().AllowAnonymous();
app.Run();
