namespace HomToMadad.Common.Entities
{
    public class SemanticLayerEO
    {
        public int Id { get; set; }
        public int ConnectionId { get; set; }
        public string LayerJson { get; set; } = "{}";
        public DateTime CreatedAt { get; set; } = DateTime.Now;
        public DateTime UpdatedAt { get; set; } = DateTime.Now;
        public string? CreatedBy { get; set; }

        // Navigation
        public ConnectionEO? Connection { get; set; }
    }
}
