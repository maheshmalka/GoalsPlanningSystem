using GoalsPlanningSystem.Api.Auth;
using GoalsPlanningSystem.Api.DTOs;
using GoalsPlanningSystem.Domain.Entities;
using GoalsPlanningSystem.Infrastructure;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GoalsPlanningSystem.Api.Controllers;

[ApiController]
[Route("api/clients")]
public class ClientsController(GoalsPlanningSystemDbContext db) : ControllerBase
{
    private static ClientDetailDto ToDetailDto(Client c) => new(
        c.Id, c.Name, c.DateOfBirth, c.RetirementAge, c.LifeExpectancyAge, c.TaxRegime, c.TotalDeductionsAmount,
        c.RiskScore, c.RiskProfile, c.RiskProfileOverride, c.Notes);

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ClientDetailDto>> GetById(int id)
    {
        var userId = this.GetUserId();
        var client = await db.Clients.AsNoTracking().FirstOrDefaultAsync(c => c.Id == id && c.Plan.UserId == userId);
        return client is null ? NotFound() : ToDetailDto(client);
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<ClientDetailDto>> Update(int id, ClientUpsertDto dto)
    {
        var userId = this.GetUserId();
        var client = await db.Clients.FirstOrDefaultAsync(c => c.Id == id && c.Plan.UserId == userId);
        if (client is null) return NotFound();

        client.Name = dto.Name;
        client.DateOfBirth = dto.DateOfBirth;
        client.RetirementAge = dto.RetirementAge;
        client.LifeExpectancyAge = dto.LifeExpectancyAge;
        client.TaxRegime = dto.TaxRegime;
        client.TotalDeductionsAmount = dto.TotalDeductionsAmount;
        client.RiskProfileOverride = dto.RiskProfileOverride;
        client.Notes = dto.Notes;
        client.UpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync();
        return ToDetailDto(client);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var userId = this.GetUserId();
        var client = await db.Clients.FirstOrDefaultAsync(c => c.Id == id && c.Plan.UserId == userId);
        if (client is null) return NotFound();

        var plan = await db.Plans.Include(p => p.Clients).FirstAsync(p => p.Id == client.PlanId);
        var wasPrimary = plan.PrimaryClientId == id;

        // PrimaryClientId -> Client is Restrict (not SetNull, to avoid a cascade cycle with Client.PlanId ->
        // Plan), so it must be cleared before the referenced client row can be deleted at all.
        if (wasPrimary)
        {
            plan.PrimaryClientId = null;
            await db.SaveChangesAsync();
        }

        db.Clients.Remove(client);
        await db.SaveChangesAsync();

        if (wasPrimary)
        {
            var remaining = plan.Clients.FirstOrDefault(c => c.Id != id);
            plan.PrimaryClientId = remaining?.Id;
            plan.UpdatedAt = DateTime.UtcNow;
            await db.SaveChangesAsync();
        }

        return NoContent();
    }
}
