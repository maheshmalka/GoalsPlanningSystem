using GoalsPlanningSystem.Api.Auth;
using GoalsPlanningSystem.Api.Simulation;
using GoalsPlanningSystem.Simulation;
using Microsoft.AspNetCore.Mvc;

namespace GoalsPlanningSystem.Api.Controllers;

[ApiController]
[Route("api/plans/{planId:int}/projections")]
public class ProjectionsController(SimulationRequestBuilder requestBuilder) : ControllerBase
{
    [HttpPost]
    public async Task<ActionResult<SimulationResult>> Run(int planId)
    {
        var built = await requestBuilder.BuildAsync(planId, this.GetUserId());
        return built switch
        {
            BuildNotFound => NotFound(),
            BuildProblem p => Problem(p.Message),
            BuildSuccess s => SimulationEngine.Run(s.Request),
            _ => throw new InvalidOperationException("Unreachable")
        };
    }
}
