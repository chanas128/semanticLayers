using HomToMadad.Common.Models;
using HomToMadad.Common.Entities;
using Microsoft.Data.SqlClient;

namespace HomToMadad.Services.SemanticLayer
{
    public class DatabaseMetadataService
    {
        public async Task<SemanticLayerDefinition> ScanAsync(ConnectionEO conn)
        {
            var connStr = BuildConnectionString(conn);
            using var sqlConn = new SqlConnection(connStr);
            await sqlConn.OpenAsync();

            var tables = await ReadTablesAsync(sqlConn);
            var relationships = await ReadForeignKeysAsync(sqlConn);

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
            using var sqlConn = new SqlConnection(connStr);
            await sqlConn.OpenAsync();

            foreach (var table in layer.Tables)
            {
                foreach (var col in table.Columns)
                {
                    if (!IsProfilableType(col.DataType)) continue;
                    try
                    {
                        var sql = $"SELECT CAST(MIN([{col.Name}]) AS NVARCHAR(200))," +
                                  $"CAST(MAX([{col.Name}]) AS NVARCHAR(200))," +
                                  $"COUNT(DISTINCT [{col.Name}]) FROM [{table.Name}]";

                        using var cmd = new SqlCommand(sql, sqlConn) { CommandTimeout = 30 };
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
                using var sqlConn = new SqlConnection(connStr);
                await sqlConn.OpenAsync();
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
            var b = new SqlConnectionStringBuilder
            {
                DataSource = conn.ServerName,
                InitialCatalog = conn.DatabaseName,
                TrustServerCertificate = true,
                ConnectTimeout = 15
            };
            if (conn.AuthType == "Windows")
                b.IntegratedSecurity = true;
            else
            {
                b.UserID = conn.Username ?? "";
                b.Password = conn.PasswordHash ?? "";
            }
            return b.ConnectionString;
        }

        private static async Task<List<SLTable>> ReadTablesAsync(SqlConnection conn)
        {
            const string sql = @"
SELECT t.name AS TableName, c.name AS ColumnName, tp.name AS DataType,
       c.is_nullable AS IsNullable,
       CASE WHEN pk.column_id IS NOT NULL THEN 1 ELSE 0 END AS IsPK,
       CASE WHEN fk.parent_column_id IS NOT NULL THEN 1 ELSE 0 END AS IsFK
FROM sys.tables t
JOIN sys.columns c ON c.object_id = t.object_id
JOIN sys.types tp ON tp.user_type_id = c.user_type_id
LEFT JOIN (
    SELECT ic.object_id, ic.column_id FROM sys.index_columns ic
    JOIN sys.indexes i ON i.object_id = ic.object_id AND i.index_id = ic.index_id
    WHERE i.is_primary_key = 1
) pk ON pk.object_id = c.object_id AND pk.column_id = c.column_id
LEFT JOIN (
    SELECT fkc.parent_object_id, fkc.parent_column_id
    FROM sys.foreign_key_columns fkc
) fk ON fk.parent_object_id = c.object_id AND fk.parent_column_id = c.column_id
WHERE t.is_ms_shipped = 0
ORDER BY t.name, c.column_id";

            var map = new Dictionary<string, SLTable>(StringComparer.OrdinalIgnoreCase);
            using var cmd = new SqlCommand(sql, conn);
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

        private static async Task<List<SLRelationship>> ReadForeignKeysAsync(SqlConnection conn)
        {
            const string sql = @"
SELECT tp.name AS FromTable, cp.name AS FromColumn,
       tr.name AS ToTable,   cr.name AS ToColumn
FROM sys.foreign_key_columns fkc
JOIN sys.tables  tp ON tp.object_id = fkc.parent_object_id
JOIN sys.columns cp ON cp.object_id = fkc.parent_object_id AND cp.column_id = fkc.parent_column_id
JOIN sys.tables  tr ON tr.object_id = fkc.referenced_object_id
JOIN sys.columns cr ON cr.object_id = fkc.referenced_object_id AND cr.column_id = fkc.referenced_column_id
WHERE tp.is_ms_shipped = 0
ORDER BY tp.name, cp.name";

            var list = new List<SLRelationship>();
            using var cmd = new SqlCommand(sql, conn);
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
            dt is "int" or "bigint" or "smallint" or "tinyint"
               or "decimal" or "numeric" or "money" or "smallmoney"
               or "float" or "real"
               or "date" or "datetime" or "datetime2" or "smalldatetime";
    }
}
