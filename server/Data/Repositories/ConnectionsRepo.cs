using HomToMadad.Common.Entities;
using HomToMadad.Data.Data;
using Microsoft.EntityFrameworkCore;

namespace HomToMadad.Data.Repositories
{
    public class ConnectionsRepo
    {
        private readonly Context _ctx;
        public ConnectionsRepo(Context ctx) => _ctx = ctx;

        public async Task<List<ConnectionEO>> GetAllAsync() =>
            await _ctx.SLConnections.Where(c => c.IsActive).ToListAsync();

        public async Task<ConnectionEO?> GetByIdAsync(int id) =>
            await _ctx.SLConnections.FindAsync(id);

        public async Task<ConnectionEO> CreateAsync(ConnectionEO conn)
        {
            _ctx.SLConnections.Add(conn);
            await _ctx.SaveChangesAsync();
            return conn;
        }

        public async Task UpdateAsync(ConnectionEO conn)
        {
            _ctx.SLConnections.Update(conn);
            await _ctx.SaveChangesAsync();
        }

        public async Task DeleteAsync(int id)
        {
            var conn = await GetByIdAsync(id);
            if (conn is null) return;
            conn.IsActive = false;          // soft delete
            await _ctx.SaveChangesAsync();
        }
    }
}
