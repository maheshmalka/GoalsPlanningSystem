using GoalsPlanningSystem.Api.DTOs;
using GoalsPlanningSystem.Domain.Entities;
using GoalsPlanningSystem.Infrastructure;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GoalsPlanningSystem.Api.Controllers;

[ApiController]
[Route("api/plans/{planId:int}/expenses")]
public class ExpensesController(GoalsPlanningSystemDbContext db) : ControllerBase
{
    private static ExpenseDto ToDto(Expense e) => new(e.Id, e.PlanId, e.Name, e.Category, e.AnnualAmount, e.StartYear, e.EndYear, e.GrowthRateOverridePct);

    [HttpGet]
    public async Task<ActionResult<List<ExpenseDto>>> GetAll(int planId)
    {
        if (!await db.Plans.AnyAsync(p => p.Id == planId)) return NotFound();
        var expenses = await db.Expenses.AsNoTracking().Where(e => e.PlanId == planId).ToListAsync();
        return expenses.Select(ToDto).ToList();
    }

    [HttpPost]
    public async Task<ActionResult<ExpenseDto>> Create(int planId, ExpenseUpsertDto dto)
    {
        if (!await db.Plans.AnyAsync(p => p.Id == planId)) return NotFound();

        var expense = new Expense
        {
            PlanId = planId, Name = dto.Name, Category = dto.Category, AnnualAmount = dto.AnnualAmount,
            StartYear = dto.StartYear, EndYear = dto.EndYear, GrowthRateOverridePct = dto.GrowthRateOverridePct
        };
        db.Expenses.Add(expense);
        await db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetAll), new { planId }, ToDto(expense));
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<ExpenseDto>> Update(int planId, int id, ExpenseUpsertDto dto)
    {
        var expense = await db.Expenses.FirstOrDefaultAsync(e => e.Id == id && e.PlanId == planId);
        if (expense is null) return NotFound();

        expense.Name = dto.Name;
        expense.Category = dto.Category;
        expense.AnnualAmount = dto.AnnualAmount;
        expense.StartYear = dto.StartYear;
        expense.EndYear = dto.EndYear;
        expense.GrowthRateOverridePct = dto.GrowthRateOverridePct;

        await db.SaveChangesAsync();
        return ToDto(expense);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int planId, int id)
    {
        var expense = await db.Expenses.FirstOrDefaultAsync(e => e.Id == id && e.PlanId == planId);
        if (expense is null) return NotFound();

        db.Expenses.Remove(expense);
        await db.SaveChangesAsync();
        return NoContent();
    }
}
