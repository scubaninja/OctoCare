using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OctoCare.Api.Data;
using OctoCare.Api.Dtos;
using OctoCare.Api.Models;
using OctoCare.Api.Services;

namespace OctoCare.Api.Controllers;

[ApiController]
[Route("api/assistant")]
public class AiAssistantController(AppDbContext dbContext, IAiService aiService) : ControllerBase
{
    [HttpPost("ask")]
    public async Task<ActionResult<object>> Ask([FromBody] AiAssistantRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Question))
        {
            return BadRequest("Question is required.");
        }

        var articles = await dbContext.KnowledgeBaseArticles
            .AsNoTracking()
            .OrderByDescending(article => article.HelpfulCount)
            .ToListAsync();
        var matchedArticles = articles
            .Select(article => new { Article = article, Score = ScoreArticle(article, request.Question) })
            .Where(result => result.Score > 0)
            .OrderByDescending(result => result.Score)
            .ThenByDescending(result => result.Article.HelpfulCount)
            .Take(5)
            .Select(result => result.Article)
            .ToList();

        Customer? customer = null;
        List<Case> recentCases = [];
        if (request.CustomerId.HasValue)
        {
            customer = await dbContext.Customers
                .AsNoTracking()
                .FirstOrDefaultAsync(c => c.Id == request.CustomerId.Value);
            recentCases = await dbContext.Cases
                .AsNoTracking()
                .Where(c => c.CustomerId == request.CustomerId.Value)
                .OrderByDescending(c => c.CreatedAt)
                .Take(3)
                .ToListAsync();
        }

        var context = BuildContext(matchedArticles, customer, recentCases);
        var answer = await aiService.AnswerQuestionAsync(request.Question, context);

        return Ok(new
        {
            Question = request.Question,
            Answer = answer,
            Articles = matchedArticles.Select(article => new { article.Id, article.Title, article.Category, article.Tags }),
            Customer = customer is null ? null : new { customer.Id, customer.Name, customer.Email, customer.Tier }
        });
    }

    private static int ScoreArticle(KnowledgeBaseArticle article, string query)
    {
        var score = 0;
        var normalizedQuery = query.Trim();
        var keywords = normalizedQuery.Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Where(word => word.Length > 2)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();

        if (article.Title.Contains(normalizedQuery, StringComparison.OrdinalIgnoreCase))
        {
            score += 5;
        }

        if (article.Content.Contains(normalizedQuery, StringComparison.OrdinalIgnoreCase))
        {
            score += 3;
        }

        if (article.Tags.Any(tag => tag.Contains(normalizedQuery, StringComparison.OrdinalIgnoreCase)))
        {
            score += 4;
        }

        foreach (var keyword in keywords)
        {
            if (article.Title.Contains(keyword, StringComparison.OrdinalIgnoreCase))
            {
                score += 2;
            }

            if (article.Content.Contains(keyword, StringComparison.OrdinalIgnoreCase))
            {
                score += 1;
            }

            if (article.Tags.Any(tag => tag.Contains(keyword, StringComparison.OrdinalIgnoreCase)))
            {
                score += 2;
            }
        }

        return score;
    }

    private static string BuildContext(IEnumerable<KnowledgeBaseArticle> articles, Customer? customer, IEnumerable<Case> recentCases)
    {
        var articleContext = articles.Any()
            ? string.Join(Environment.NewLine + Environment.NewLine, articles.Select(article =>
                $"Article: {article.Title}{Environment.NewLine}Category: {article.Category}{Environment.NewLine}Tags: {string.Join(", ", article.Tags)}{Environment.NewLine}Content: {article.Content}"))
            : "No relevant knowledge base articles were found.";

        var customerContext = customer is null
            ? "No customer context provided."
            : $"Customer: {customer.Name} ({customer.Email}) - Tier: {customer.Tier}";

        var caseContext = recentCases.Any()
            ? string.Join(Environment.NewLine, recentCases.Select(supportCase =>
                $"Case {supportCase.Id}: {supportCase.Subject} | Status: {supportCase.Status} | Priority: {supportCase.Priority}"))
            : "No recent cases available.";

        return $"{customerContext}{Environment.NewLine}{Environment.NewLine}Knowledge Base:{Environment.NewLine}{articleContext}{Environment.NewLine}{Environment.NewLine}Recent Cases:{Environment.NewLine}{caseContext}";
    }
}
