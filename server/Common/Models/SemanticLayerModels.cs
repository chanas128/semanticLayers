namespace HomToMadad.Common.Models
{
    // ─── Semantic Layer Definition (JSON model) ──────────────────

    public class SemanticLayerDefinition
    {
        public string ConnectionId { get; set; } = string.Empty;
        public string DatabaseName { get; set; } = string.Empty;
        public DateTime LastSyncedAt { get; set; }
        public List<SLTable> Tables { get; set; } = new();
        public List<SLRelationship> Relationships { get; set; } = new();
        public List<SLCustomField>? CustomFields { get; set; }
    }

    public class SLCustomField
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Key { get; set; } = string.Empty;
    }

    public class SLTable
    {
        public string Name { get; set; } = string.Empty;
        public string DisplayName { get; set; } = string.Empty;
        public string? Description { get; set; }
        public List<SLColumn> Columns { get; set; } = new();
    }

    public class SLColumn
    {
        public string Name { get; set; } = string.Empty;
        public string DisplayName { get; set; } = string.Empty;
        public string DataType { get; set; } = string.Empty;
        public bool IsNullable { get; set; }
        public bool IsPrimaryKey { get; set; }
        public bool IsForeignKey { get; set; }
        public string? Min { get; set; }
        public string? Max { get; set; }
        public int? DistinctCount { get; set; }
        public string? BusinessDescription { get; set; }
        public string Source { get; set; } = "db";
        public Dictionary<string, string>? CustomValues { get; set; }
    }

    public class SLRelationship
    {
        public string FromTable { get; set; } = string.Empty;
        public string FromColumn { get; set; } = string.Empty;
        public string ToTable { get; set; } = string.Empty;
        public string ToColumn { get; set; } = string.Empty;
        public string Type { get; set; } = "foreignKey";
        public bool Confirmed { get; set; } = true;
    }

    // ─── Query models ────────────────────────────────────────────

    public class QueryRequestDTO
    {
        public int ConnectionId { get; set; }
        public string TableName { get; set; } = string.Empty;
        public List<string> SelectedColumns { get; set; } = new();
        public List<QueryFilterDTO> Filters { get; set; } = new();
        public int MaxRows { get; set; } = 200;
    }

    public class QueryFilterDTO
    {
        public string Column { get; set; } = string.Empty;
        public string Operator { get; set; } = "=";
        public string Value { get; set; } = string.Empty;
        public string? ValueTo { get; set; }
    }

    public class QueryResultDTO
    {
        public List<string> Columns { get; set; } = new();
        public List<List<object?>> Rows { get; set; } = new();
        public int TotalRows { get; set; }
        public string GeneratedSql { get; set; } = string.Empty;
    }
}
