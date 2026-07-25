using HomToMadad.Common.Infrastructure;
using Microsoft.EntityFrameworkCore.Diagnostics;

namespace HomToMadad.Data.Interceptors
{
    /// <summary>
    /// Audit interceptor — currently no-op.
    /// The original implementation logged to ZzLogUpdate/ZzLogInsertDelete tables
    /// which were part of the legacy system. Can be re-implemented when needed.
    /// </summary>
    public class AuditInterceptor : SaveChangesInterceptor
    {
        private readonly ICurrentUserService _currentUserService;

        public AuditInterceptor(ICurrentUserService currentUserService)
        {
            _currentUserService = currentUserService;
        }

        // No-op — override if auditing is needed in the future
    }
}
