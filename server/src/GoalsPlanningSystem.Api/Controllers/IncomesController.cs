using GoalsPlanningSystem.Api.Auth;
using GoalsPlanningSystem.Api.DTOs;
using GoalsPlanningSystem.Domain.Entities;
using GoalsPlanningSystem.Infrastructure;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GoalsPlanningSystem.Api.Controllers;

[ApiController]
[Route("api/clients/{clientId:int}/incomes")]
public class IncomesController(GoalsPlanningSystemDbContext db) : ControllerBase
{
    private static IncomeDto ToDto(Income i) => new(i.Id, i.ClientId, i.Name, i.IncomeType, i.AnnualAmount, i.StartYear, i.EndYear, i.AnnualGrowthRatePct);

    [HttpGet]
    public async Task<ActionResult<List<IncomeDto>>> GetAll(int clientId)
    {
        if (!await db.IsClientOwnedByUserAsync(clientId, this.GetUserId())) return NotFound();
        var incomes = await db.Incomes.AsNoTracking().Where(i => i.ClientId == clientId).ToListAsync();
        return incomes.Select(ToDto).ToList();
    }

    [HttpPost]
    public async Task<ActionResult<IncomeDto>> Create(int clientId, IncomeUpsertDto dto)
    {
        if (!await db.IsClientOwnedByUserAsync(clientId, this.GetUserId())) return NotFound();

        var income = new Income
        {
            ClientId = clientId, Name = dto.Name, IncomeType = dto.IncomeType, AnnualAmount = dto.AnnualAmount,
            StartYear = dto.StartYear, EndYear = dto.EndYear, AnnualGrowthRatePct = dto.AnnualGrowthRatePct
        };
        db.Incomes.Add(income);
        await db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetAll), new { clientId }, ToDto(income));
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<IncomeDto>> Update(int clientId, int id, IncomeUpsertDto dto)
    {
        var userId = this.GetUserId();
        var income = await db.Incomes.FirstOrDefaultAsync(i => i.Id == id && i.ClientId == clientId && i.Client.Plan.UserId == userId);
        if (income is null) return NotFound();

        income.Name = dto.Name;
        income.IncomeType = dto.IncomeType;
        income.AnnualAmount = dto.AnnualAmount;
        income.StartYear = dto.StartYear;
        income.EndYear = dto.EndYear;
        income.AnnualGrowthRatePct = dto.AnnualGrowthRatePct;

        await db.SaveChangesAsync();
        return ToDto(income);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int clientId, int id)
    {
        var userId = this.GetUserId();
        var income = await db.Incomes.FirstOrDefaultAsync(i => i.Id == id && i.ClientId == clientId && i.Client.Plan.UserId == userId);
        if (income is null) return NotFound();

        db.Incomes.Remove(income);
        await db.SaveChangesAsync();
        return NoContent();
    }
}
