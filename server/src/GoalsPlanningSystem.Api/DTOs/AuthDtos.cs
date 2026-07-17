namespace GoalsPlanningSystem.Api.DTOs;

public record RegisterDto(string Email, string Password, string DisplayName);
public record LoginDto(string Email, string Password);
public record GoogleLoginDto(string IdToken);
public record MicrosoftLoginDto(string AccessToken);
public record RefreshRequestDto(string RefreshToken);

public record UserDto(int Id, string Email, string DisplayName);
public record AuthResultDto(string AccessToken, DateTime AccessTokenExpiresAt, string RefreshToken, UserDto User);
