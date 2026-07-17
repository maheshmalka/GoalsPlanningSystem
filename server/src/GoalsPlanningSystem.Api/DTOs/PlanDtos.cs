namespace GoalsPlanningSystem.Api.DTOs;

public record PlanListItemDto(int Id, string Name, List<ClientListItemDto> Clients);

public record PlanDetailDto(
    int Id,
    string Name,
    decimal InflationRatePct,
    int SimulationCount,
    int? PrimaryClientId,
    List<ClientListItemDto> Clients);

public record PlanUpsertDto(string Name, decimal InflationRatePct, int SimulationCount, int? PrimaryClientId);
