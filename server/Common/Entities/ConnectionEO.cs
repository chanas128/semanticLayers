namespace HomToMadad.Common.Entities
{
    public class ConnectionEO
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string ServerName { get; set; } = string.Empty;
        public string DatabaseName { get; set; } = string.Empty;
        public string AuthType { get; set; } = "SqlServer"; // "SqlServer" | "Windows"
        public string? Username { get; set; }
        public string? PasswordHash { get; set; }
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.Now;
        public DateTime? LastTestedAt { get; set; }
        public string? LastTestResult { get; set; }
    }
}
