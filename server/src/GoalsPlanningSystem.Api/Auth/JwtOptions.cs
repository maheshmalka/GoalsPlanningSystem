namespace GoalsPlanningSystem.Api.Auth;

public class JwtOptions
{
    public const string SectionName = "Jwt";

    public string Secret { get; set; } = string.Empty;
    public string Issuer { get; set; } = "GoalsPlanningSystem";
    public string Audience { get; set; } = "GoalsPlanningSystem";
    public int AccessTokenMinutes { get; set; } = 15;
    public int RefreshTokenDays { get; set; } = 30;
}
