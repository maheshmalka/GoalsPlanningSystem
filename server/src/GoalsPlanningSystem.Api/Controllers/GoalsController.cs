using GoalsPlanningSystem.Api.DTOs;
using GoalsPlanningSystem.Domain.Entities;
using GoalsPlanningSystem.Infrastructure;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GoalsPlanningSystem.Api.Controllers;

[ApiController]
[Route("api/clients/{clientId:int}/goals")]
public class GoalsController(GoalsPlanningSystemDbContext db) : ControllerBase
{
    private static GoalDto ToDto(Goal g) => new(
        g.Id, g.ClientId, g.Name, g.GoalType, g.TargetAmount, g.Priority, g.StartYear, g.EndYear, g.IsRecurring,
        g.GrowthRateOverridePct, g.AccountLinks.Select(l => l.AccountId).ToList());

    [HttpGet]
    public async Task<ActionResult<List<GoalDto>>> GetAll(int clientId)
    {
        if (!await db.Clients.AnyAsync(c => c.Id == clientId)) return NotFound();
        var goals = await db.Goals.AsNoTracking().Include(g => g.AccountLinks).Where(g => g.ClientId == clientId).ToListAsync();
        return goals.Select(ToDto).ToList();
    }

    [HttpPost]
    public async Task<ActionResult<GoalDto>> Create(int clientId, GoalUpsertDto dto)
    {
        if (!await db.Clients.AnyAsync(c => c.Id == clientId)) return NotFound();

        var goal = new Goal
        {
            ClientId = clientId, Name = dto.Name, GoalType = dto.GoalType, TargetAmount = dto.TargetAmount,
            Priority = dto.Priority, StartYear = dto.StartYear, EndYear = dto.EndYear, IsRecurring = dto.IsRecurring,
            GrowthRateOverridePct = dto.GrowthRateOverridePct,
            AccountLinks = dto.LinkedAccountIds.Select(accId => new GoalAccountLink { AccountId = accId }).ToList()
        };
        db.Goals.Add(goal);
        await db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetAll), new { clientId }, ToDto(goal));
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<GoalDto>> Update(int clientId, int id, GoalUpsertDto dto)
    {
        var goal = await db.Goals.Include(g => g.AccountLinks).FirstOrDefaultAsync(g => g.Id == id && g.ClientId == clientId);
        if (goal is null) return NotFound();

        goal.Name = dto.Name;
        goal.GoalType = dto.GoalType;
        goal.TargetAmount = dto.TargetAmount;
        goal.Priority = dto.Priority;
        goal.StartYear = dto.StartYear;
        goal.EndYear = dto.EndYear;
        goal.IsRecurring = dto.IsRecurring;
        goal.GrowthRateOverridePct = dto.GrowthRateOverridePct;

        db.GoalAccountLinks.RemoveRange(goal.AccountLinks);
        goal.AccountLinks = dto.LinkedAccountIds.Select(accId => new GoalAccountLink { AccountId = accId }).ToList();

        await db.SaveChangesAsync();
        return ToDto(goal);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int clientId, int id)
    {
        var goal = await db.Goals.FirstOrDefaultAsync(g => g.Id == id && g.ClientId == clientId);
        if (goal is null) return NotFound();

        db.Goals.Remove(goal);
        await db.SaveChangesAsync();
        return NoContent();
    }
}
