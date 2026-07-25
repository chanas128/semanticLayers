using HomToMadad.Common.Infrastructure;
using HomToMadad.Data.Data;

namespace HomToMadad.Data
{
    public class UnitOfWork : IDisposable
    {
        private readonly Context _context;
        private readonly ICurrentUserService _currentUser;

        public UnitOfWork(Context context, ICurrentUserService currentUser)
        {
            _context = context;
            _currentUser = currentUser;
        }

        public async Task<int> SaveChangesAsync() => await _context.SaveChangesAsync();

        public void Dispose() => _context.Dispose();
    }
}
