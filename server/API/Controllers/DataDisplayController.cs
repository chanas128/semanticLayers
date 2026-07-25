using HomToMadad.API.DTO;
using HomToMadad.Services.SemanticLayer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HomToMadad.API.Controllers
{
    [ApiController]
    [Route("api/data")]
    [AllowAnonymous]
    public class DataDisplayController : ControllerBase
    {
        private readonly DynamicQueryService _querySvc;

        public DataDisplayController(DynamicQueryService querySvc) => _querySvc = querySvc;

        /// <summary>Execute a dynamic query based on user column/filter selection.</summary>
        [HttpPost("query")]
        public async Task<IActionResult> Query([FromBody] QueryRequestDTO request)
        {
            if (string.IsNullOrEmpty(request.TableName))
                return BadRequest("TableName is required.");
            if (request.SelectedColumns == null || request.SelectedColumns.Count == 0)
                return BadRequest("At least one column must be selected.");

            try
            {
                var result = await _querySvc.ExecuteAsync(request);
                return Ok(result);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Query execution failed: {ex.Message}");
            }
        }
    }
}
