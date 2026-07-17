using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;

namespace GoalsPlanningSystem.Api.Auth;

public static class CurrentUserExtensions
{
    public static int GetUserId(this ControllerBase controller) =>
        int.Parse(controller.User.FindFirstValue(ClaimTypes.NameIdentifier)!);
}
