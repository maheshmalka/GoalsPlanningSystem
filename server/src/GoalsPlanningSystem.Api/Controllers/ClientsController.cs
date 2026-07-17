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
        var client = await db.Clients.AsNoTracking().FirstOrDefaultAsync(c => c.Id == id);
        return client is null ? NotFound() : ToDetailDto(client);
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<ClientDetailDto>> Update(int id, ClientUpsertDto dto)
    {
        var client = await db.Clients.FirstOrDefaultAsync(c => c.Id == id);
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
        var client = await db.Clients.FirstOrDefaultAsync(c => c.Id == id);
        if (client is null) return NotFound();

        var plan = await db.Plans.Include(p => p.Clients).FirstAsync(p => p.Id == client.PlanId);

        // Captured before Remove()/SaveChanges(): the PrimaryClientId -> Client relationship is configured
        // SetNull, so EF nulls plan.PrimaryClientId in memory as part of saving the delete itself, before
        // this method ever gets to check it.
        var wasPrimary = plan.PrimaryClientId == id;

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
