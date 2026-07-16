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
    private static int AgeOf(DateOnly dateOfBirth)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var age = today.Year - dateOfBirth.Year;
        if (dateOfBirth > today.AddYears(-age)) age--;
        return age;
    }

    private static ClientListItemDto ToListItemDto(Client c) => new(c.Id, c.Name, AgeOf(c.DateOfBirth), c.EffectiveRiskProfile);

    private static ClientDetailDto ToDetailDto(Client c) => new(
        c.Id, c.Name, c.DateOfBirth, c.RetirementAge, c.LifeExpectancyAge, c.TaxRegime, c.TotalDeductionsAmount,
        c.RiskScore, c.RiskProfile, c.RiskProfileOverride, c.Notes);

    [HttpGet]
    public async Task<ActionResult<List<ClientListItemDto>>> GetAll()
    {
        var clients = await db.Clients.AsNoTracking().ToListAsync();
        return clients.Select(ToListItemDto).ToList();
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ClientDetailDto>> GetById(int id)
    {
        var client = await db.Clients.AsNoTracking().FirstOrDefaultAsync(c => c.Id == id);
        return client is null ? NotFound() : ToDetailDto(client);
    }

    [HttpPost]
    public async Task<ActionResult<ClientDetailDto>> Create(ClientUpsertDto dto)
    {
        var client = new Client
        {
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
        return CreatedAtAction(nameof(GetById), new { id = client.Id }, ToDetailDto(client));
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

        db.Clients.Remove(client);
        await db.SaveChangesAsync();
        return NoContent();
    }
}
