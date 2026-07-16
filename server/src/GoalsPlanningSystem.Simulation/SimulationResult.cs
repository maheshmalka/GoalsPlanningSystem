namespace GoalsPlanningSystem.Simulation;

public record YearlyProjectionBand(int Year, decimal WorstCase, decimal AverageCase, decimal BestCase);

public record YearlyCashflow(int Year, decimal Income, decimal Expense, decimal Tax, decimal NetCashflow);

public record GoalOutcome(int GoalId, string Name, double ProbabilityOfSuccessPct);

public record SimulationResult(
    IReadOnlyList<YearlyProjectionBand> ProjectionBands,
    IReadOnlyList<YearlyCashflow> DeterministicCashflow,
    double ProbabilityOfPlanSuccessPct,
    IReadOnlyList<GoalOutcome> GoalOutcomes,
    decimal? FundingRatio,
    decimal Worst3MonthLossPct);
