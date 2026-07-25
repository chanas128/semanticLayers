using HomToMadad.API.DTO;
using HomToMadad.Services.SemanticLayer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HomToMadad.API.Controllers
{
    [ApiController]
    [Route("api/semantic-layer")]
    [AllowAnonymous]
    public class SemanticLayerController : ControllerBase
    {
        private readonly SemanticLayerService _svc;

        public SemanticLayerController(SemanticLayerService svc) => _svc = svc;

        /// <summary>Get the semantic layer for a connection.</summary>
        [HttpGet("{connectionId}")]
        public async Task<IActionResult> Get(int connectionId)
        {
            var layer = await _svc.GetAsync(connectionId);
            if (layer is null) return NotFound("No semantic layer found for this connection.");
            return Ok(layer);
        }

        /// <summary>Update the semantic layer (user edits: display names, descriptions, confirmed relationships).</summary>
        [HttpPut("{connectionId}")]
        public async Task<IActionResult> Update(int connectionId, [FromBody] SemanticLayerDefinition layer)
        {
            var updated = await _svc.UpdateAsync(connectionId, layer);
            return Ok(updated);
        }

        /// <summary>Export the semantic layer as a JSON file download.</summary>
        [HttpGet("{connectionId}/export")]
        public async Task<IActionResult> Export(int connectionId)
        {
            try
            {
                var json = await _svc.ExportJsonAsync(connectionId);
                var bytes = System.Text.Encoding.UTF8.GetBytes(json);
                return File(bytes, "application/json", $"semantic-layer-{connectionId}.json");
            }
            catch (Exception ex)
            {
                return NotFound(ex.Message);
            }
        }
    }
}
