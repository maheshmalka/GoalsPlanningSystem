namespace GoalsPlanningSystem.Simulation.MonteCarlo;

/// <summary>Decoupled from the EF entity so the Monte Carlo core has no Infrastructure dependency and is trivially unit-testable.</summary>
public record AssetClassAssumption(int AssetClassId, string Name, double ExpectedAnnualReturnPct, double AnnualVolatilityPct);

public record AssetClassCorrelationPair(int AssetClassAId, int AssetClassBId, double Correlation);
