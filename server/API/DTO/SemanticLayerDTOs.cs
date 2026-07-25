// Re-export shared models for use in Controllers
global using HomToMadad.Common.Models;

namespace HomToMadad.API.DTO
{
    // ─── Connection DTOs (API-specific) ───────────────────────────
    public class ConnectionDTO
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string ServerName { get; set; } = string.Empty;
        public string DatabaseName { get; set; } = string.Empty;
        public string AuthType { get; set; } = "SqlServer";
        public string? Username { get; set; }
        public string? Password { get; set; }
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; }
        public DateTime? LastTestedAt { get; set; }
        public string? LastTestResult { get; set; }
    }

    public class TestConnectionResultDTO
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
    }
}
