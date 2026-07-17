using GoalsPlanningSystem.Api.Auth;
using GoalsPlanningSystem.Api.DTOs;
using GoalsPlanningSystem.Domain;
using GoalsPlanningSystem.Domain.Entities;
using GoalsPlanningSystem.Infrastructure;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GoalsPlanningSystem.Api.Controllers;

[ApiController]
[Route("api")]
public class RiskQuestionnaireController(GoalsPlanningSystemDbContext db) : ControllerBase
{
    [HttpGet("risk-questionnaire/questions")]
    public async Task<ActionResult<List<RiskQuestionDto>>> GetQuestions()
    {
        var questions = await db.RiskQuestions.AsNoTracking()
            .Include(q => q.Options)
            .OrderBy(q => q.DisplayOrder)
            .ToListAsync();

        return questions.Select(q => new RiskQuestionDto(
            q.Id, q.DisplayOrder, q.Text,
            q.Options.OrderBy(o => o.DisplayOrder).Select(o => new RiskOptionDto(o.Id, o.DisplayOrder, o.Text, o.Points)).ToList())).ToList();
    }

    [HttpGet("clients/{clientId:int}/risk-questionnaire")]
    public async Task<ActionResult<RiskResultDto>> GetResult(int clientId)
    {
        var userId = this.GetUserId();
        var client = await db.Clients.AsNoTracking().FirstOrDefaultAsync(c => c.Id == clientId && c.Plan.UserId == userId);
        if (client is null) return NotFound();

        var (min, max) = await GetScoreBoundsAsync();
        var percentage = client.RiskScore.HasValue ? ScorePercentage(client.RiskScore.Value, min, max) : 0m;

        return new RiskResultDto(
            client.RiskScore ?? 0, min, max, percentage,
            client.RiskProfile ?? RiskProfileCalculator.FromScorePercentage(percentage),
            client.RiskProfileOverride);
    }

    [HttpPut("clients/{clientId:int}/risk-questionnaire")]
    public async Task<ActionResult<RiskResultDto>> Submit(int clientId, RiskResponseSubmitDto dto)
    {
        var userId = this.GetUserId();
        var client = await db.Clients.FirstOrDefaultAsync(c => c.Id == clientId && c.Plan.UserId == userId);
        if (client is null) return NotFound();

        var optionsById = await db.RiskQuestionOptions.AsNoTracking().ToDictionaryAsync(o => o.Id);

        var existing = db.RiskQuestionnaireResponses.Where(r => r.ClientId == clientId);
        db.RiskQuestionnaireResponses.RemoveRange(existing);

        var rawScore = 0;
        foreach (var answer in dto.Answers)
        {
            if (!optionsById.TryGetValue(answer.OptionId, out var option) || option.RiskQuestionId != answer.QuestionId)
            {
                return BadRequest($"Option {answer.OptionId} does not belong to question {answer.QuestionId}.");
            }

            rawScore += option.Points;
            db.RiskQuestionnaireResponses.Add(new RiskQuestionnaireResponse
            {
                ClientId = clientId, RiskQuestionId = answer.QuestionId, RiskQuestionOptionId = answer.OptionId
            });
        }

        var (min, max) = await GetScoreBoundsAsync();
        var percentage = ScorePercentage(rawScore, min, max);
        var computedProfile = RiskProfileCalculator.FromScorePercentage(percentage);

        client.RiskScore = rawScore;
        client.RiskProfile = computedProfile;
        client.UpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync();
        return new RiskResultDto(rawScore, min, max, percentage, computedProfile, client.RiskProfileOverride);
    }

    private async Task<(int Min, int Max)> GetScoreBoundsAsync()
    {
        var questions = await db.RiskQuestions.AsNoTracking().Include(q => q.Options).ToListAsync();
        var min = questions.Sum(q => q.Options.Count > 0 ? q.Options.Min(o => o.Points) : 0);
        var max = questions.Sum(q => q.Options.Count > 0 ? q.Options.Max(o => o.Points) : 0);
        return (min, max);
    }

    private static decimal ScorePercentage(int score, int min, int max) =>
        max > min ? Math.Clamp(100m * (score - min) / (max - min), 0m, 100m) : 0m;
}
