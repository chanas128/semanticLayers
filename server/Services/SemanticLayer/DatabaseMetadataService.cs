using HomToMadad.Common.Models;
using HomToMadad.Common.Entities;
using Npgsql;

namespace HomToMadad.Services.SemanticLayer
{
    public class DatabaseMetadataService
    {
        public async Task<SemanticLayerDefinition> ScanAsync(ConnectionEO conn)
        {
            var connStr = BuildConnectionString(conn);
            using var pgConn = new NpgsqlConnection(connStr);
            await pgConn.OpenAsync();

            var tables = await ReadTablesAsync(pgConn);
            var relationships = await ReadForeignKeysAsync(pgConn);

            return new SemanticLayerDefinition
            {
                ConnectionId = conn.Id.ToString(),
                DatabaseName = conn.DatabaseName,
                LastSyncedAt = DateTime.UtcNow,
                Tables = tables,
                Relationships = relationships
            };
        }

        public async Task ProfileAsync(SemanticLayerDefinition layer, ConnectionEO conn)
        {
            var connStr = BuildConnectionString(conn);
            using var pgConn = new NpgsqlConnection(connStr);
            await pgConn.OpenAsync();

            foreach (var table in layer.Tables)
            {
                foreach (var col in table.Columns)
                {
                    if (!IsProfilableType(col.DataType)) continue;
                    try
                    {
                        var sql = $"SELECT CAST(MIN(\"{col.Name}\") AS TEXT), " +
                                  $"CAST(MAX(\"{col.Name}\") AS TEXT), " +
                                  $"COUNT(DISTINCT \"{col.Name}\") FROM \"{table.Name}\"";

                        using var cmd = new NpgsqlCommand(sql, pgConn) { CommandTimeout = 30 };
                        using var reader = await cmd.ExecuteReaderAsync();
                        if (await reader.ReadAsync())
                        {
                            col.Min = reader.IsDBNull(0) ? null : reader.GetString(0);
                            col.Max = reader.IsDBNull(1) ? null : reader.GetString(1);
                            col.DistinctCount = reader.IsDBNull(2) ? null : reader.GetInt32(2);
                        }
                    }
                    catch { /* profiling failure non-fatal */ }
                }
            }
        }

        public async Task<(bool ok, string message)> TestConnectionAsync(ConnectionEO conn)
        {
            try
            {
                var connStr = BuildConnectionString(conn);
                using var pgConn = new NpgsqlConnection(connStr);
                await pgConn.OpenAsync();
                return (true, "OK");
            }
            catch (Exception ex)
            {
                return (false, ex.Message);
            }
        }

        // ─── Helpers ──────────────────────────────────────────────────

        public static string BuildConnectionString(ConnectionEO conn)
        {
            var b = new NpgsqlConnectionStringBuilder
            {
                Host = conn.ServerName,
                Database = conn.DatabaseName,
                Username = conn.Username ?? "",
                Password = conn.PasswordHash ?? "",
                SslMode = SslMode.Prefer,
                Timeout = 15,
                TrustServerCertificate = true
            };
            return b.ConnectionString;
        }

        private static async Task<List<SLTable>> ReadTablesAsync(NpgsqlConnection conn)
        {
            const string sql = @"
SELECT 
    t.table_name AS TableName,
    c.column_name AS ColumnName,
    c.data_type AS DataType,
    CASE WHEN c.is_nullable = 'YES' THEN true ELSE false END AS IsNullable,
    CASE WHEN tc.constraint_type = 'PRIMARY KEY' THEN 1 ELSE 0 END AS IsPK,
    CASE WHEN fk.column_name IS NOT NULL THEN 1 ELSE 0 END AS IsFK
FROM information_schema.tables t
JOIN information_schema.columns c 
    ON c.table_schema = t.table_schema AND c.table_name = t.table_name
LEFT JOIN (
    SELECT kcu.table_schema, kcu.table_name, kcu.column_name, tc.constraint_type
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu 
        ON kcu.constraint_name = tc.constraint_name 
        AND kcu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'PRIMARY KEY'
) tc ON tc.table_schema = t.table_schema 
    AND tc.table_name = t.table_name 
    AND tc.column_name = c.column_name
LEFT JOIN (
    SELECT DISTINCT kcu.table_schema, kcu.table_name, kcu.column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu 
        ON kcu.constraint_name = tc.constraint_name 
        AND kcu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
) fk ON fk.table_schema = t.table_schema 
    AND fk.table_name = t.table_name 
    AND fk.column_name = c.column_name
WHERE t.table_schema = 'public' AND t.table_type = 'BASE TABLE'
ORDER BY t.table_name, c.ordinal_position";

            var map = new Dictionary<string, SLTable>(StringComparer.OrdinalIgnoreCase);
            using var cmd = new NpgsqlCommand(sql, conn);
            using var reader = await cmd.ExecuteReaderAsync();

            while (await reader.ReadAsync())
            {
                var tName = reader.GetString(0);
                if (!map.TryGetValue(tName, out var tbl))
                {
                    tbl = new SLTable { Name = tName, DisplayName = tName };
                    map[tName] = tbl;
                }
                tbl.Columns.Add(new SLColumn
                {
                    Name = reader.GetString(1),
                    DisplayName = reader.GetString(1),
                    DataType = reader.GetString(2),
                    IsNullable = reader.GetBoolean(3),
                    IsPrimaryKey = reader.GetInt32(4) == 1,
                    IsForeignKey = reader.GetInt32(5) == 1,
                    Source = "db"
                });
            }
            return map.Values.ToList();
        }

        private static async Task<List<SLRelationship>> ReadForeignKeysAsync(NpgsqlConnection conn)
        {
            const string sql = @"
SELECT 
    kcu.table_name AS FromTable,
    kcu.column_name AS FromColumn,
    ccu.table_name AS ToTable,
    ccu.column_name AS ToColumn
FROM information_schema.referential_constraints rc
JOIN information_schema.key_column_usage kcu 
    ON kcu.constraint_name = rc.constraint_name 
    AND kcu.table_schema = rc.constraint_schema
JOIN information_schema.constraint_column_usage ccu 
    ON ccu.constraint_name = rc.unique_constraint_name 
    AND ccu.table_schema = rc.unique_constraint_schema
WHERE kcu.table_schema = 'public'
ORDER BY kcu.table_name, kcu.column_name";

            var list = new List<SLRelationship>();
            using var cmd = new NpgsqlCommand(sql, conn);
            using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                list.Add(new SLRelationship
                {
                    FromTable = reader.GetString(0),
                    FromColumn = reader.GetString(1),
                    ToTable = reader.GetString(2),
                    ToColumn = reader.GetString(3),
                    Type = "foreignKey",
                    Confirmed = true
                });
            }
            return list;
        }

        private static bool IsProfilableType(string dt) =>
            dt is "integer" or "bigint" or "smallint"
               or "decimal" or "numeric" or "money"
               or "double precision" or "real"
               or "date" or "timestamp without time zone" or "timestamp with time zone";
    }
}
