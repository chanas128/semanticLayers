using HomToMadad.Common.Entities;
using HomToMadad.Data.Data;
using Microsoft.EntityFrameworkCore;

namespace HomToMadad.Data.Repositories
{
    public class SemanticLayerRepo
    {
        private readonly Context _ctx;
        public SemanticLayerRepo(Context ctx) => _ctx = ctx;

        public async Task<SemanticLayerEO?> GetByConnectionIdAsync(int connectionId) =>
            await _ctx.SLSemanticLayers
                      .Include(s => s.Connection)
                      .FirstOrDefaultAsync(s => s.ConnectionId == connectionId);

        public async Task<SemanticLayerEO?> GetByIdAsync(int id) =>
            await _ctx.SLSemanticLayers.FindAsync(id);

        public async Task<SemanticLayerEO> UpsertAsync(int connectionId, string layerJson, string? createdBy = null)
        {
            var existing = await GetByConnectionIdAsync(connectionId);
            if (existing is null)
            {
                existing = new SemanticLayerEO
                {
                    ConnectionId = connectionId,
                    LayerJson    = layerJson,
                    CreatedAt    = DateTime.UtcNow,
                    UpdatedAt    = DateTime.UtcNow,
                    CreatedBy    = createdBy
                };
                _ctx.SLSemanticLayers.Add(existing);
            }
            else
            {
                existing.LayerJson  = layerJson;
                existing.UpdatedAt  = DateTime.UtcNow;
                _ctx.SLSemanticLayers.Update(existing);
            }
            await _ctx.SaveChangesAsync();
            return existing;
        }
    }
}
