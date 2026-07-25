using HomToMadad.Common.Entities;
using HomToMadad.Data.Interceptors;
using Microsoft.EntityFrameworkCore;

namespace HomToMadad.Data.Data
{
    public partial class Context : DbContext
    {
        private readonly AuditInterceptor _auditInterceptor;

        public Context() { }

        public Context(DbContextOptions<Context> options, AuditInterceptor auditInterceptor)
            : base(options)
        {
            _auditInterceptor = auditInterceptor;
        }

        // ─── Semantic Layer ───────────────────────────────────────
        public virtual DbSet<ConnectionEO> SLConnections { get; set; } = null!;
        public virtual DbSet<SemanticLayerEO> SLSemanticLayers { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // SL_Connections table mapping
            modelBuilder.Entity<ConnectionEO>(entity =>
            {
                entity.ToTable("SL_Connections");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name).HasMaxLength(100).IsRequired();
                entity.Property(e => e.ServerName).HasMaxLength(200).IsRequired();
                entity.Property(e => e.DatabaseName).HasMaxLength(100).IsRequired();
                entity.Property(e => e.AuthType).HasMaxLength(20).HasDefaultValue("SqlServer");
                entity.Property(e => e.Username).HasMaxLength(100);
                entity.Property(e => e.PasswordHash).HasMaxLength(500);
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETDATE()");
                entity.Property(e => e.LastTestResult).HasMaxLength(500);
            });

            // SL_SemanticLayers table mapping
            modelBuilder.Entity<SemanticLayerEO>(entity =>
            {
                entity.ToTable("SL_SemanticLayers");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.LayerJson).IsRequired();
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETDATE()");
                entity.Property(e => e.UpdatedAt).HasDefaultValueSql("GETDATE()");
                entity.Property(e => e.CreatedBy).HasMaxLength(100);

                entity.HasOne(e => e.Connection)
                      .WithMany()
                      .HasForeignKey(e => e.ConnectionId);

                entity.HasIndex(e => e.ConnectionId).IsUnique();
            });
        }
    }
}
