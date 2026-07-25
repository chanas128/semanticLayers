using HomToMadad.Common.Models;
using HomToMadad.Common.Entities;
using HomToMadad.Data.Repositories;
using Microsoft.Data.SqlClient;

namespace HomToMadad.Services.SemanticLayer
{
    public class DynamicQueryService
    {
        private readonly ConnectionsRepo _connRepo;

        public DynamicQueryService(ConnectionsRepo connRepo) => _connRepo = connRepo;

        public async Task<QueryResultDTO> ExecuteAsync(QueryRequestDTO request)
        {
            var conn = await _connRepo.GetByIdAsync(request.ConnectionId)
                       ?? throw new Exception($"Connection {request.ConnectionId} not found.");

            var (sql, parameters) = BuildQuery(request);

            var connStr = DatabaseMetadataService.BuildConnectionString(conn);
            using var sqlConn = new SqlConnection(connStr);
            await sqlConn.OpenAsync();

            using var cmd = new SqlCommand(sql, sqlConn) { CommandTimeout = 30 };
            foreach (var p in parameters)
                cmd.Parameters.Add(p);

            var result = new QueryResultDTO
            {
                Columns = request.SelectedColumns,
                GeneratedSql = sql
            };

            using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                var row = new List<object?>();
                for (int i = 0; i < reader.FieldCount; i++)
                    row.Add(reader.IsDBNull(i) ? null : reader.GetValue(i));
                result.Rows.Add(row);
            }

            result.TotalRows = result.Rows.Count;
            return result;
        }

        private static (string sql, List<SqlParameter> parameters) BuildQuery(QueryRequestDTO req)
        {
            // Validate table and column names (whitelist: letters, digits, underscore)
            ValidateName(req.TableName);
            foreach (var col in req.SelectedColumns) ValidateName(col);

            var cols = string.Join(", ", req.SelectedColumns.Select(c => $"[{c}]"));
            var sql = $"SELECT TOP ({req.MaxRows}) {cols} FROM [{req.TableName}]";

            var parameters = new List<SqlParameter>();
            var whereClauses = new List<string>();

            for (int i = 0; i < req.Filters.Count; i++)
            {
                var f = req.Filters[i];
                ValidateName(f.Column);
                var paramName = $"@p{i}";

                switch (f.Operator.ToUpper())
                {
                    case "BETWEEN":
                        var paramTo = $"@p{i}to";
                        whereClauses.Add($"[{f.Column}] BETWEEN {paramName} AND {paramTo}");
                        parameters.Add(new SqlParameter(paramName, f.Value));
                        parameters.Add(new SqlParameter(paramTo, f.ValueTo ?? f.Value));
                        break;
                    case "LIKE":
                        whereClauses.Add($"[{f.Column}] LIKE {paramName}");
                        parameters.Add(new SqlParameter(paramName, $"%{f.Value}%"));
                        break;
                    default:
                        // =, >, <, >=, <=
                        var op = f.Operator switch
                        {
                            ">" => ">", "<" => "<", ">=" => ">=", "<=" => "<=",
                            _ => "="
                        };
                        whereClauses.Add($"[{f.Column}] {op} {paramName}");
                        parameters.Add(new SqlParameter(paramName, f.Value));
                        break;
                }
            }

            if (whereClauses.Count > 0)
                sql += " WHERE " + string.Join(" AND ", whereClauses);

            return (sql, parameters);
        }

        private static void ValidateName(string name)
        {
            if (string.IsNullOrWhiteSpace(name))
                throw new ArgumentException("Table/column name cannot be empty.");

            // Only allow safe characters
            if (!System.Text.RegularExpressions.Regex.IsMatch(name, @"^[a-zA-Z_\u0590-\u05FF][a-zA-Z0-9_\u0590-\u05FF]*$"))
                throw new ArgumentException($"Invalid name: '{name}'");
        }
    }
}
