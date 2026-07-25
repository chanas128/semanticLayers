using HomToMadad.API.DTO;
using HomToMadad.Common.Entities;
using HomToMadad.Data.Repositories;
using HomToMadad.Services.SemanticLayer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HomToMadad.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [AllowAnonymous]
    public class ConnectionsController : ControllerBase
    {
        private readonly ConnectionsRepo _repo;
        private readonly DatabaseMetadataService _metaSvc;

        public ConnectionsController(ConnectionsRepo repo, DatabaseMetadataService metaSvc)
        {
            _repo = repo;
            _metaSvc = metaSvc;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var list = await _repo.GetAllAsync();
            return Ok(list.Select(c => new ConnectionDTO
            {
                Id = c.Id,
                Name = c.Name,
                ServerName = c.ServerName,
                DatabaseName = c.DatabaseName,
                AuthType = c.AuthType,
                Username = c.Username,
                IsActive = c.IsActive,
                CreatedAt = c.CreatedAt,
                LastTestedAt = c.LastTestedAt,
                LastTestResult = c.LastTestResult
            }));
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> Get(int id)
        {
            var c = await _repo.GetByIdAsync(id);
            if (c is null) return NotFound();
            return Ok(new ConnectionDTO
            {
                Id = c.Id, Name = c.Name, ServerName = c.ServerName,
                DatabaseName = c.DatabaseName, AuthType = c.AuthType,
                Username = c.Username, IsActive = c.IsActive,
                CreatedAt = c.CreatedAt, LastTestedAt = c.LastTestedAt,
                LastTestResult = c.LastTestResult
            });
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] ConnectionDTO dto)
        {
            var entity = new ConnectionEO
            {
                Name = dto.Name,
                ServerName = dto.ServerName,
                DatabaseName = dto.DatabaseName,
                AuthType = dto.AuthType,
                Username = dto.Username,
                PasswordHash = dto.Password // stored as-is for demo; production would hash
            };

            // Test connectivity
            var (ok, msg) = await _metaSvc.TestConnectionAsync(entity);
            entity.LastTestedAt = DateTime.UtcNow;
            entity.LastTestResult = ok ? "OK" : msg;

            var created = await _repo.CreateAsync(entity);
            return CreatedAtAction(nameof(Get), new { id = created.Id }, new ConnectionDTO
            {
                Id = created.Id, Name = created.Name,
                ServerName = created.ServerName, DatabaseName = created.DatabaseName,
                AuthType = created.AuthType, Username = created.Username,
                IsActive = created.IsActive, CreatedAt = created.CreatedAt,
                LastTestedAt = created.LastTestedAt, LastTestResult = created.LastTestResult
            });
        }

        [HttpPost("{id}/test")]
        public async Task<IActionResult> Test(int id)
        {
            var entity = await _repo.GetByIdAsync(id);
            if (entity is null) return NotFound();

            var (ok, msg) = await _metaSvc.TestConnectionAsync(entity);
            entity.LastTestedAt = DateTime.UtcNow;
            entity.LastTestResult = ok ? "OK" : msg;
            await _repo.UpdateAsync(entity);

            return Ok(new TestConnectionResultDTO { Success = ok, Message = msg });
        }

        [HttpPost("{id}/scan")]
        public async Task<IActionResult> Scan(int id,
            [FromServices] SemanticLayerService slSvc)
        {
            var layer = await slSvc.BuildAndSaveAsync(id);
            return Ok(layer);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            await _repo.DeleteAsync(id);
            return NoContent();
        }
    }
}
