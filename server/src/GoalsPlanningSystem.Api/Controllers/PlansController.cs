using GoalsPlanningSystem.Api.DTOs;
using GoalsPlanningSystem.Domain.Entities;
using GoalsPlanningSystem.Infrastructure;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GoalsPlanningSystem.Api.Controllers;

[ApiController]
[Route("api/plans")]
public class PlansController(GoalsPlanningSystemDbContext db) : ControllerBase
{
    private const int MaxClientsPerPlan = 2;

    private static int AgeOf(DateOnly dateOfBirth)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var age = today.Year - dateOfBirth.Year;
        if (dateOfBirth > today.AddYears(-age)) age--;
        return age;
    }

    private static ClientListItemDto ToClientSummary(Client c) => new(c.Id, c.Name, AgeOf(c.DateOfBirth), c.EffectiveRiskProfile);

    private static PlanListItemDto ToListItemDto(Plan p) => new(p.Id, p.Name, p.Clients.Select(ToClientSummary).ToList());

    private static PlanDetailDto ToDetailDto(Plan p) => new(
        p.Id, p.Name, p.InflationRatePct, p.SimulationCount, p.PrimaryClientId, p.Clients.Select(ToClientSummary).ToList());

    [HttpGet]
    public async Task<ActionResult<List<PlanListItemDto>>> GetAll([FromQuery] string? search)
    {
        var query = db.Plans.AsNoTracking().Include(p => p.Clients).AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            query = query.Where(p => p.Clients.Any(c => c.Name.Contains(search)) || p.Name.Contains(search));
        }

        var plans = await query.OrderByDescending(p => p.UpdatedAt).ToListAsync();
        return plans.Select(ToListItemDto).ToList();
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<PlanDetailDto>> GetById(int id)
    {
        var plan = await db.Plans.AsNoTracking().Include(p => p.Clients).FirstOrDefaultAsync(p => p.Id == id);
        return plan is null ? NotFound() : ToDetailDto(plan);
    }

    [HttpPost]
    public async Task<ActionResult<PlanDetailDto>> Create(PlanUpsertDto dto)
    {
        var plan = new Plan { Name = dto.Name, InflationRatePct = dto.InflationRatePct, SimulationCount = dto.SimulationCount };
        db.Plans.Add(plan);
        await db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = plan.Id }, ToDetailDto(plan));
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<PlanDetailDto>> Update(int id, PlanUpsertDto dto)
    {
        var plan = await db.Plans.Include(p => p.Clients).FirstOrDefaultAsync(p => p.Id == id);
        if (plan is null) return NotFound();

        if (dto.PrimaryClientId.HasValue && plan.Clients.All(c => c.Id != dto.PrimaryClientId.Value))
        {
            return BadRequest("PrimaryClientId must be a client belonging to this plan.");
        }

        plan.Name = dto.Name;
        plan.InflationRatePct = dto.InflationRatePct;
        plan.SimulationCount = dto.SimulationCount;
        plan.PrimaryClientId = dto.PrimaryClientId;
        plan.UpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync();
        return ToDetailDto(plan);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var plan = await db.Plans.FirstOrDefaultAsync(p => p.Id == id);
        if (plan is null) return NotFound();

        db.Plans.Remove(plan);
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("{id:int}/clients")]
    public async Task<ActionResult<ClientListItemDto>> AddClient(int id, ClientUpsertDto dto)
    {
        var plan = await db.Plans.Include(p => p.Clients).FirstOrDefaultAsync(p => p.Id == id);
        if (plan is null) return NotFound();

        if (plan.Clients.Count >= MaxClientsPerPlan)
        {
            return BadRequest($"A plan can have at most {MaxClientsPerPlan} clients.");
        }

        // Captured before Add(): EF's relationship fixup updates plan.Clients in memory as soon as the
        // new client is tracked (even pre-SaveChanges), so checking Count after Add() would always see it.
        var isFirstClient = plan.Clients.Count == 0;

        var client = new Client
        {
            PlanId = id,
            Name = dto.Name,
            DateOfBirth = dto.DateOfBirth,
            RetirementAge = dto.RetirementAge,
            LifeExpectancyAge = dto.LifeExpectancyAge,
            TaxRegime = dto.TaxRegime,
            TotalDeductionsAmount = dto.TotalDeductionsAmount,
            RiskProfileOverride = dto.RiskProfileOverride,
            Notes = dto.Notes
        };
        db.Clients.Add(client);
        await db.SaveChangesAsync();

        if (isFirstClient)
        {
            plan.PrimaryClientId = client.Id;
            await db.SaveChangesAsync();
        }

        return CreatedAtAction(nameof(GetById), new { id }, ToClientSummary(client));
    }
}
