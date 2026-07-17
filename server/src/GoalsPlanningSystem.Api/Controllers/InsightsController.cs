using GoalsPlanningSystem.Api.Auth;
using GoalsPlanningSystem.Api.DTOs;
using GoalsPlanningSystem.Api.Simulation;
using GoalsPlanningSystem.Domain.Enums;
using GoalsPlanningSystem.Simulation;
using Microsoft.AspNetCore.Mvc;

namespace GoalsPlanningSystem.Api.Controllers;

/// <summary>
/// Turns "how could this plan do better" into a ranked, quantified list: each lever below re-runs the
/// actual Monte Carlo engine with one change applied, so every claim ("+12% probability of success") is
/// a real simulation result, not a guess. A smaller simulation count is used than the main Projections
/// page (see InsightSimulationCount) purely so six-plus extra runs stay fast; treat these as directional,
/// and re-check the exact figures on the Projections page after actually applying a change.
/// </summary>
[ApiController]
[Route("api/plans/{planId:int}/insights")]
public class InsightsController(SimulationRequestBuilder requestBuilder) : ControllerBase
{
    private const int InsightSimulationCount = 500;

    [HttpPost]
    public async Task<ActionResult<PlanInsightsDto>> Run(int planId)
    {
        var built = await requestBuilder.BuildAsync(planId, this.GetUserId());
        if (built is BuildNotFound) return NotFound();
        if (built is BuildProblem problem) return Problem(problem.Message);

        var baseline = CapSimulationCount(((BuildSuccess)built).Request);
        var baselineResult = SimulationEngine.Run(baseline);

        var leverBuilders = new Func<(SimulationRequest Request, string Title, string Description)?>[]
        {
            () => DelayRetirement(baseline),
            () => IncreaseContributions(baseline),
            () => MoreAggressiveAllocation(baseline),
            () => ReduceWorstGoal(baseline, baselineResult),
            () => ReduceDiscretionaryExpenses(baseline),
            () => IncreaseIncome(baseline),
        };

        var insights = new List<InsightDto>();
        var nextId = 1;
        foreach (var buildLever in leverBuilders)
        {
            var lever = buildLever();
            if (lever is null) continue;

            var scenarioResult = SimulationEngine.Run(lever.Value.Request);
            insights.Add(new InsightDto(
                (nextId++).ToString(),
                lever.Value.Title,
                lever.Value.Description,
                baselineResult.ProbabilityOfPlanSuccessPct,
                scenarioResult.ProbabilityOfPlanSuccessPct,
                scenarioResult.ProbabilityOfPlanSuccessPct - baselineResult.ProbabilityOfPlanSuccessPct,
                baselineResult.FundingRatio,
                scenarioResult.FundingRatio));
        }

        return new PlanInsightsDto(
            baselineResult.ProbabilityOfPlanSuccessPct,
            baselineResult.FundingRatio,
            insights.OrderByDescending(i => i.ProbabilityDeltaPct).ToList());
    }

    private static SimulationRequest CapSimulationCount(SimulationRequest request) =>
        request with { Settings = request.Settings with { SimulationCount = Math.Min(request.Settings.SimulationCount, InsightSimulationCount) } };

    private static (SimulationRequest, string, string)? DelayRetirement(SimulationRequest baseline)
    {
        const int years = 2;
        var newRetirementAge = baseline.Client.RetirementAge + years;
        if (newRetirementAge >= baseline.Client.LifeExpectancyAge - 2) return null;

        var request = baseline with { Client = baseline.Client with { RetirementAge = newRetirementAge } };
        return (request, $"Delay retirement by {years} years",
            $"Retiring at {newRetirementAge} instead of {baseline.Client.RetirementAge} gives the portfolio more time to grow and shortens the withdrawal period.");
    }

    private static (SimulationRequest, string, string)? IncreaseContributions(SimulationRequest baseline)
    {
        if (!baseline.Accounts.Any(a => a.MonthlyContribution > 0)) return null;

        const decimal factor = 1.2m;
        var request = baseline with { Accounts = baseline.Accounts.Select(a => a with { MonthlyContribution = a.MonthlyContribution * factor }).ToList() };
        return (request, "Increase contributions by 20%",
            "Raising monthly contributions across all accounts by 20% accelerates portfolio growth during the working years.");
    }

    private static (SimulationRequest, string, string)? MoreAggressiveAllocation(SimulationRequest baseline)
    {
        var equityIds = baseline.AssetClasses
            .Where(a => a.Name is "Indian Equity" or "International Equity")
            .Select(a => a.AssetClassId).ToHashSet();
        if (equityIds.Count == 0) return null;

        const double shiftPp = 0.15;
        var anyShifted = false;

        var newAccounts = baseline.Accounts.Select(account =>
        {
            var currentEquity = account.AllocationWeights.Where(w => equityIds.Contains(w.Key)).Sum(w => w.Value);
            var nonEquityTotal = 1.0 - currentEquity;
            if (nonEquityTotal <= 0.0001) return account;

            var increase = Math.Min(shiftPp, nonEquityTotal);
            var scaleFactor = (nonEquityTotal - increase) / nonEquityTotal;

            var newWeights = account.AllocationWeights.ToDictionary(
                w => w.Key,
                w => equityIds.Contains(w.Key) ? w.Value : w.Value * scaleFactor);

            var existingEquityIds = equityIds.Where(newWeights.ContainsKey).ToList();
            if (existingEquityIds.Count > 0 && currentEquity > 0)
            {
                foreach (var id in existingEquityIds)
                {
                    newWeights[id] += increase * (account.AllocationWeights[id] / currentEquity);
                }
            }
            else
            {
                var targetId = equityIds.First();
                newWeights[targetId] = newWeights.GetValueOrDefault(targetId) + increase;
            }

            anyShifted = true;
            return account with { AllocationWeights = newWeights };
        }).ToList();

        if (!anyShifted) return null;

        var request = baseline with { Accounts = newAccounts };
        return (request, "Shift to a more aggressive allocation",
            "Increasing equity exposure by roughly 15 percentage points across accounts raises expected long-term returns, at the cost of more month-to-month volatility.");
    }

    private static (SimulationRequest, string, string)? ReduceWorstGoal(SimulationRequest baseline, SimulationResult baselineResult)
    {
        if (baseline.Goals.Count == 0) return null;

        var worst = baselineResult.GoalOutcomes.OrderBy(g => g.ProbabilityOfSuccessPct).FirstOrDefault();
        var goal = baseline.Goals.FirstOrDefault(g => g.GoalId == worst?.GoalId);
        if (goal is null) return null;

        const decimal reductionFactor = 0.85m;
        var newGoals = baseline.Goals
            .Select(g => g.GoalId == goal.GoalId ? g with { TargetAmount = g.TargetAmount * reductionFactor } : g)
            .ToList();

        var request = baseline with { Goals = newGoals };
        return (request, $"Scale back \"{goal.Name}\"",
            $"\"{goal.Name}\" currently has the lowest probability of being fully funded among this plan's goals. Reducing its target by 15% eases pressure on the portfolio.");
    }

    private static (SimulationRequest, string, string)? ReduceDiscretionaryExpenses(SimulationRequest baseline)
    {
        if (!baseline.Expenses.Any(e => e.Category == ExpenseCategory.Discretionary)) return null;

        const decimal factor = 0.8m;
        var newExpenses = baseline.Expenses
            .Select(e => e.Category == ExpenseCategory.Discretionary ? e with { AnnualAmount = e.AnnualAmount * factor } : e)
            .ToList();

        var request = baseline with { Expenses = newExpenses };
        return (request, "Trim discretionary spending by 20%",
            "Cutting discretionary expenses by 20% reduces the annual amount that needs to be withdrawn from the portfolio each year.");
    }

    private static (SimulationRequest, string, string)? IncreaseIncome(SimulationRequest baseline)
    {
        if (baseline.Incomes.Count == 0) return null;

        const decimal factor = 1.1m;
        var newIncomes = baseline.Incomes.Select(i => i with { AnnualAmount = i.AnnualAmount * factor }).ToList();

        var request = baseline with { Incomes = newIncomes };
        return (request, "Increase income by 10%",
            "A 10% increase in income (a raise, side income, or extra earning years) reduces how much of each year's expenses need to be funded from portfolio withdrawals.");
    }
}
