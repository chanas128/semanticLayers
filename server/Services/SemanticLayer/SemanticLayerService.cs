using System.Text.Json;
using HomToMadad.Common.Models;
using HomToMadad.Common.Entities;
using HomToMadad.Data.Repositories;

namespace HomToMadad.Services.SemanticLayer
{
    public class SemanticLayerService
    {
        private readonly ConnectionsRepo _connRepo;
        private readonly SemanticLayerRepo _slRepo;
        private readonly DatabaseMetadataService _metaSvc;

        private static readonly JsonSerializerOptions _jsonOpts = new()
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            WriteIndented = false
        };

        public SemanticLayerService(
            ConnectionsRepo connRepo,
            SemanticLayerRepo slRepo,
            DatabaseMetadataService metaSvc)
        {
            _connRepo = connRepo;
            _slRepo = slRepo;
            _metaSvc = metaSvc;
        }

        /// <summary>Scan target DB + profile + save as initial semantic layer.</summary>
        public async Task<SemanticLayerDefinition> BuildAndSaveAsync(int connectionId)
        {
            var conn = await _connRepo.GetByIdAsync(connectionId)
                       ?? throw new Exception($"Connection {connectionId} not found.");

            // 1. Scan metadata
            var layer = await _metaSvc.ScanAsync(conn);

            // 2. Profile
            await _metaSvc.ProfileAsync(layer, conn);

            // 3. Save
            var json = JsonSerializer.Serialize(layer, _jsonOpts);
            await _slRepo.UpsertAsync(connectionId, json);

            return layer;
        }

        /// <summary>Get existing saved layer for a connection.</summary>
        public async Task<SemanticLayerDefinition?> GetAsync(int connectionId)
        {
            var entity = await _slRepo.GetByConnectionIdAsync(connectionId);
            if (entity is null) return null;
            return JsonSerializer.Deserialize<SemanticLayerDefinition>(entity.LayerJson, _jsonOpts);
        }

        /// <summary>Update the layer (after user edits display names, descriptions, etc).</summary>
        public async Task<SemanticLayerDefinition> UpdateAsync(int connectionId, SemanticLayerDefinition layer)
        {
            layer.LastSyncedAt = DateTime.UtcNow;
            var json = JsonSerializer.Serialize(layer, _jsonOpts);
            await _slRepo.UpsertAsync(connectionId, json);
            return layer;
        }

        /// <summary>Export layer as JSON string (for download).</summary>
        public async Task<string> ExportJsonAsync(int connectionId)
        {
            var entity = await _slRepo.GetByConnectionIdAsync(connectionId);
            if (entity is null) throw new Exception("No semantic layer found.");
            // Pretty-print for export
            var layer = JsonSerializer.Deserialize<SemanticLayerDefinition>(entity.LayerJson, _jsonOpts);
            return JsonSerializer.Serialize(layer, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                WriteIndented = true,
                Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping
            });
        }
    }
}
