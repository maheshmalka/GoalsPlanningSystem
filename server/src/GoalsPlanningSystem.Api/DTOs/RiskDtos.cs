using GoalsPlanningSystem.Domain.Enums;

namespace GoalsPlanningSystem.Api.DTOs;

public record RiskOptionDto(int Id, int DisplayOrder, string Text, int Points);

public record RiskQuestionDto(int Id, int DisplayOrder, string Text, List<RiskOptionDto> Options);

public record RiskAnswerDto(int QuestionId, int OptionId);

public record RiskResponseSubmitDto(List<RiskAnswerDto> Answers);

public record RiskResultDto(int RawScore, int MinPossibleScore, int MaxPossibleScore, decimal ScorePercentage, RiskProfile ComputedProfile, RiskProfile? Override);
