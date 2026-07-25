using HomToMadad.Common.Infrastructure;

namespace HomToMadad.API.Infrastructure
{
    /// <summary>
    /// Returns "Anonymous" for demo/submission — no Windows Auth.
    /// </summary>
    public class CurrentUserService : ICurrentUserService
    {
        private readonly IHttpContextAccessor _httpContext;

        public CurrentUserService(IHttpContextAccessor httpContext)
        {
            _httpContext = httpContext;
        }

        public string? GetCurrentUserName()
        {
            return _httpContext.HttpContext?.User?.Identity?.Name ?? "Anonymous";
        }
    }
}
