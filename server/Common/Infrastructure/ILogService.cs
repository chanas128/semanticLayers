using System;
using System.Threading.Tasks;
using System.Runtime.CompilerServices;

namespace HomToMadad.Common.Infrastructure
{
    public interface ILogService
    {
        Task LogErrorAsync(
            Exception ex,
            string? message = null,
            [CallerMemberName] string? functionName = null);

        Task LogInfoAsync(
            string message,
            [CallerMemberName] string? functionName = null);
    }
}