using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace HomToMadad.Common.Infrastructure
{
    public interface ICurrentUserService
    {
        string? GetCurrentUserName();
    }
}
