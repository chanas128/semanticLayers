using HomToMadad.Common.Infrastructure;
using System.Runtime.CompilerServices;

namespace HomToMadad.Services
{
    /// <summary>
    /// Minimal log service — logs to console only.
    /// In production, replace with DB-backed implementation.
    /// </summary>
    public class LogService : ILogService
    {
        public Task LogErrorAsync(Exception ex, string? message = null,
            [CallerMemberName] string? functionName = null)
        {
            Console.WriteLine($"[ERROR] {functionName}: {ex.Message} {message}");
            return Task.CompletedTask;
        }

        public Task LogInfoAsync(string message,
            [CallerMemberName] string? functionName = null)
        {
            Console.WriteLine($"[INFO] {functionName}: {message}");
            return Task.CompletedTask;
        }
    }
}
