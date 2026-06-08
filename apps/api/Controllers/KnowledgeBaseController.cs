using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OctoCare.Api.Data;
using OctoCare.Api.Models;

namespace OctoCare.Api.Controllers;

[ApiController]
[Route("api/knowledge-base")]
public class KnowledgeBaseController(AppDbContext dbContext) : ControllerBase
{
    [HttpGet("search")]
    public async Task<ActionResult<IEnumerable<KnowledgeBaseArticle>>> Search([FromQuery] string query)
    {
        if (string.IsNullOrWhiteSpace(query))
        {
            return BadRequest("Query is required.");
        }

        var normalizedQuery = query.Trim();
        var articles = await dbContext.KnowledgeBaseArticles
            .AsNoTracking()
            .OrderByDescending(article => article.UpdatedAt)
            .ToListAsync();

        var matches = articles
            .Where(article =>
                article.Title.Contains(normalizedQuery, StringComparison.OrdinalIgnoreCase) ||
                article.Content.Contains(normalizedQuery, StringComparison.OrdinalIgnoreCase) ||
                article.Category.Contains(normalizedQuery, StringComparison.OrdinalIgnoreCase) ||
                article.Tags.Any(tag => tag.Contains(normalizedQuery, StringComparison.OrdinalIgnoreCase)))
            .ToList();

        return Ok(matches);
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<KnowledgeBaseArticle>>> GetArticles()
    {
        var articles = await dbContext.KnowledgeBaseArticles
            .AsNoTracking()
            .OrderByDescending(article => article.HelpfulCount)
            .ThenByDescending(article => article.UpdatedAt)
            .ToListAsync();

        return Ok(articles);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<KnowledgeBaseArticle>> GetArticle(Guid id)
    {
        var article = await dbContext.KnowledgeBaseArticles
            .AsNoTracking()
            .FirstOrDefaultAsync(a => a.Id == id);

        return article is null ? NotFound() : Ok(article);
    }

    [HttpPost("{id:guid}/helpful")]
    public async Task<ActionResult<KnowledgeBaseArticle>> MarkHelpful(Guid id)
    {
        var article = await dbContext.KnowledgeBaseArticles.FirstOrDefaultAsync(a => a.Id == id);
        if (article is null)
        {
            return NotFound();
        }

        article.HelpfulCount += 1;
        article.UpdatedAt = DateTime.UtcNow;
        await dbContext.SaveChangesAsync();

        return Ok(article);
    }
}
