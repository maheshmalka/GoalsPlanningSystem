using GoalsPlanningSystem.Api.Auth;
using GoalsPlanningSystem.Api.DTOs;
using GoalsPlanningSystem.Domain.Entities;
using GoalsPlanningSystem.Infrastructure;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GoalsPlanningSystem.Api.Controllers;

[ApiController]
[Route("api/clients/{clientId:int}/accounts")]
public class AccountsController(GoalsPlanningSystemDbContext db) : ControllerBase
{
    private static AccountDto ToDto(Account a) => new(
        a.Id, a.ClientId, a.Name, a.AccountType, a.TaxTreatment, a.CurrentBalance, a.ContributionAmount,
        a.ContributionFrequency, a.EmployerMatchPct, a.NpsAnnuitizationPct, a.AssumedAnnuityRatePct,
        a.Allocations.Select(al => new AllocationDto(al.AssetClassId, al.AssetClass.Name, al.Percentage)).ToList());

    [HttpGet]
    public async Task<ActionResult<List<AccountDto>>> GetAll(int clientId)
    {
        if (!await db.IsClientOwnedByUserAsync(clientId, this.GetUserId())) return NotFound();

        var accounts = await db.Accounts.AsNoTracking()
            .Include(a => a.Allocations).ThenInclude(al => al.AssetClass)
            .Where(a => a.ClientId == clientId)
            .ToListAsync();
        return accounts.Select(ToDto).ToList();
    }

    [HttpPost]
    public async Task<ActionResult<AccountDto>> Create(int clientId, AccountUpsertDto dto)
    {
        if (!await db.IsClientOwnedByUserAsync(clientId, this.GetUserId())) return NotFound();

        var account = new Account
        {
            ClientId = clientId,
            Name = dto.Name,
            AccountType = dto.AccountType,
            CurrentBalance = dto.CurrentBalance,
            ContributionAmount = dto.ContributionAmount,
            ContributionFrequency = dto.ContributionFrequency,
            EmployerMatchPct = dto.EmployerMatchPct,
            NpsAnnuitizationPct = dto.NpsAnnuitizationPct,
            AssumedAnnuityRatePct = dto.AssumedAnnuityRatePct,
            Allocations = dto.Allocations.Select(al => new AccountAllocation { AssetClassId = al.AssetClassId, Percentage = al.Percentage }).ToList()
        };
        db.Accounts.Add(account);
        await db.SaveChangesAsync();
        await db.Entry(account).Collection(a => a.Allocations).Query().Include(al => al.AssetClass).LoadAsync();
        return CreatedAtAction(nameof(GetAll), new { clientId }, ToDto(account));
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<AccountDto>> Update(int clientId, int id, AccountUpsertDto dto)
    {
        var userId = this.GetUserId();
        var account = await db.Accounts.Include(a => a.Allocations).ThenInclude(al => al.AssetClass)
            .FirstOrDefaultAsync(a => a.Id == id && a.ClientId == clientId && a.Client.Plan.UserId == userId);
        if (account is null) return NotFound();

        account.Name = dto.Name;
        account.AccountType = dto.AccountType;
        account.CurrentBalance = dto.CurrentBalance;
        account.ContributionAmount = dto.ContributionAmount;
        account.ContributionFrequency = dto.ContributionFrequency;
        account.EmployerMatchPct = dto.EmployerMatchPct;
        account.NpsAnnuitizationPct = dto.NpsAnnuitizationPct;
        account.AssumedAnnuityRatePct = dto.AssumedAnnuityRatePct;

        db.AccountAllocations.RemoveRange(account.Allocations);
        account.Allocations = dto.Allocations.Select(al => new AccountAllocation { AssetClassId = al.AssetClassId, Percentage = al.Percentage }).ToList();

        await db.SaveChangesAsync();
        await db.Entry(account).Collection(a => a.Allocations).Query().Include(al => al.AssetClass).LoadAsync();
        return ToDto(account);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int clientId, int id)
    {
        var userId = this.GetUserId();
        var account = await db.Accounts.FirstOrDefaultAsync(a => a.Id == id && a.ClientId == clientId && a.Client.Plan.UserId == userId);
        if (account is null) return NotFound();

        // GoalAccountLink -> Account is Restrict (not Cascade), so any goal earmarks on this account
        // must be removed explicitly before the account itself can be deleted.
        var goalLinks = db.GoalAccountLinks.Where(l => l.AccountId == id);
        db.GoalAccountLinks.RemoveRange(goalLinks);

        db.Accounts.Remove(account);
        await db.SaveChangesAsync();
        return NoContent();
    }
}
