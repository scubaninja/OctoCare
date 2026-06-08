using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OctoCare.Api.Data;
using OctoCare.Api.Dtos;
using OctoCare.Api.Models;
using OctoCare.Api.Services;

namespace OctoCare.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CasesController(AppDbContext dbContext, IAiService aiService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Case>>> GetCases([FromQuery] string? status, [FromQuery] string? priority, [FromQuery] string? assignedAgent)
    {
        var query = dbContext.Cases
            .AsNoTracking()
            .Include(c => c.Customer)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(status))
        {
            if (!Enum.TryParse<CaseStatus>(status, true, out var parsedStatus))
            {
                return BadRequest($"Invalid status '{status}'.");
            }

            query = query.Where(c => c.Status == parsedStatus);
        }

        if (!string.IsNullOrWhiteSpace(priority))
        {
            if (!Enum.TryParse<CasePriority>(priority, true, out var parsedPriority))
            {
                return BadRequest($"Invalid priority '{priority}'.");
            }

            query = query.Where(c => c.Priority == parsedPriority);
        }

        if (!string.IsNullOrWhiteSpace(assignedAgent))
        {
            query = query.Where(c => c.AssignedAgentId == assignedAgent);
        }

        var cases = await query
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync();

        return Ok(cases);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<Case>> GetCase(Guid id)
    {
        var supportCase = await dbContext.Cases
            .AsNoTracking()
            .Include(c => c.Customer)
            .Include(c => c.Comments.OrderBy(comment => comment.CreatedAt))
            .Include(c => c.Attachments)
            .Include(c => c.AuditHistory.OrderByDescending(entry => entry.Timestamp))
            .FirstOrDefaultAsync(c => c.Id == id);

        return supportCase is null ? NotFound() : Ok(supportCase);
    }

    [HttpPost]
    public async Task<ActionResult<Case>> CreateCase([FromBody] CreateCaseRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Subject) || string.IsNullOrWhiteSpace(request.Description))
        {
            return BadRequest("Subject and description are required.");
        }

        var customer = await dbContext.Customers.FirstOrDefaultAsync(c => c.Id == request.CustomerId);
        if (customer is null)
        {
            return BadRequest("Customer was not found.");
        }

        var category = ParseCategory(request.Category, out var categoryError);
        if (categoryError is not null)
        {
            return BadRequest(categoryError);
        }

        var priorityResponse = await aiService.ClassifyPriorityAsync(request.Subject, category.ToString(), customer.Tier.ToString(), request.Description);
        var priority = ParsePriorityFromResponse(priorityResponse);
        var supportCase = new Case
        {
            Subject = request.Subject.Trim(),
            Description = request.Description.Trim(),
            CustomerId = request.CustomerId,
            Category = category,
            Priority = priority,
            SlaDeadline = DateTime.UtcNow.Add(GetSlaWindow(priority)),
            SlaBreached = false
        };

        dbContext.Cases.Add(supportCase);
        dbContext.CaseAuditEntries.Add(new CaseAuditEntry
        {
            CaseId = supportCase.Id,
            Action = "CaseCreated",
            PerformedBy = "system",
            NewValue = $"Status={supportCase.Status}; Priority={supportCase.Priority}; Category={supportCase.Category}"
        });

        await dbContext.SaveChangesAsync();

        return CreatedAtAction(nameof(GetCase), new { id = supportCase.Id }, supportCase);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<Case>> UpdateCase(Guid id, [FromBody] UpdateCaseRequest request)
    {
        var supportCase = await dbContext.Cases
            .Include(c => c.AuditHistory)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (supportCase is null)
        {
            return NotFound();
        }

        var updatesMade = false;

        if (!string.IsNullOrWhiteSpace(request.Status))
        {
            if (!Enum.TryParse<CaseStatus>(request.Status, true, out var newStatus))
            {
                return BadRequest($"Invalid status '{request.Status}'.");
            }

            if (supportCase.Status != newStatus)
            {
                AddAuditEntry(supportCase, "StatusUpdated", supportCase.Status.ToString(), newStatus.ToString());
                supportCase.Status = newStatus;
                supportCase.ResolvedAt = newStatus is CaseStatus.Resolved or CaseStatus.Closed ? DateTime.UtcNow : null;
                updatesMade = true;
            }
        }

        if (!string.IsNullOrWhiteSpace(request.Priority))
        {
            if (!Enum.TryParse<CasePriority>(request.Priority, true, out var newPriority))
            {
                return BadRequest($"Invalid priority '{request.Priority}'.");
            }

            if (supportCase.Priority != newPriority)
            {
                AddAuditEntry(supportCase, "PriorityUpdated", supportCase.Priority.ToString(), newPriority.ToString());
                supportCase.Priority = newPriority;
                var updatedDeadline = supportCase.CreatedAt.Add(GetSlaWindow(newPriority));
                supportCase.SlaDeadline = updatedDeadline < supportCase.SlaDeadline ? updatedDeadline : supportCase.SlaDeadline;
                updatesMade = true;
            }
        }

        if (!string.IsNullOrWhiteSpace(request.Category))
        {
            var category = ParseCategory(request.Category, out var categoryError);
            if (categoryError is not null)
            {
                return BadRequest(categoryError);
            }

            if (supportCase.Category != category)
            {
                AddAuditEntry(supportCase, "CategoryUpdated", supportCase.Category.ToString(), category.ToString());
                supportCase.Category = category;
                updatesMade = true;
            }
        }

        if (request.AssignedAgentId != supportCase.AssignedAgentId)
        {
            AddAuditEntry(supportCase, "AssignmentUpdated", supportCase.AssignedAgentId, request.AssignedAgentId);
            supportCase.AssignedAgentId = string.IsNullOrWhiteSpace(request.AssignedAgentId) ? null : request.AssignedAgentId.Trim();
            updatesMade = true;
        }

        if (!updatesMade)
        {
            return Ok(supportCase);
        }

        supportCase.UpdatedAt = DateTime.UtcNow;
        supportCase.SlaBreached = DateTime.UtcNow > supportCase.SlaDeadline && supportCase.Status is not CaseStatus.Resolved and not CaseStatus.Closed;
        await dbContext.SaveChangesAsync();

        return Ok(supportCase);
    }

    [HttpPost("{id:guid}/comments")]
    public async Task<ActionResult<CaseComment>> AddComment(Guid id, [FromBody] AddCommentRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Author) || string.IsNullOrWhiteSpace(request.Content))
        {
            return BadRequest("Author and content are required.");
        }

        var supportCase = await dbContext.Cases.FirstOrDefaultAsync(c => c.Id == id);
        if (supportCase is null)
        {
            return NotFound();
        }

        var comment = new CaseComment
        {
            CaseId = supportCase.Id,
            Author = request.Author.Trim(),
            Content = request.Content.Trim(),
            IsInternal = request.IsInternal
        };

        supportCase.UpdatedAt = DateTime.UtcNow;
        dbContext.CaseComments.Add(comment);
        dbContext.CaseAuditEntries.Add(new CaseAuditEntry
        {
            CaseId = supportCase.Id,
            Action = request.IsInternal ? "InternalCommentAdded" : "CommentAdded",
            PerformedBy = request.Author.Trim(),
            NewValue = request.Content.Trim()
        });

        await dbContext.SaveChangesAsync();
        return Ok(comment);
    }

    [HttpPost("{id:guid}/escalate")]
    public async Task<ActionResult<Case>> EscalateCase(Guid id)
    {
        var supportCase = await dbContext.Cases.FirstOrDefaultAsync(c => c.Id == id);
        if (supportCase is null)
        {
            return NotFound();
        }

        var previousStatus = supportCase.Status;
        var previousPriority = supportCase.Priority;
        supportCase.Status = CaseStatus.Escalated;
        supportCase.Priority = previousPriority switch
        {
            CasePriority.Low => CasePriority.Medium,
            CasePriority.Medium => CasePriority.High,
            _ => CasePriority.Critical
        };
        var escalatedDeadline = supportCase.CreatedAt.Add(GetSlaWindow(supportCase.Priority));
        supportCase.SlaDeadline = escalatedDeadline < supportCase.SlaDeadline ? escalatedDeadline : supportCase.SlaDeadline;
        supportCase.SlaBreached = DateTime.UtcNow > supportCase.SlaDeadline;
        supportCase.UpdatedAt = DateTime.UtcNow;

        AddAuditEntry(supportCase, "StatusUpdated", previousStatus.ToString(), supportCase.Status.ToString());
        AddAuditEntry(supportCase, "PriorityUpdated", previousPriority.ToString(), supportCase.Priority.ToString());
        AddAuditEntry(supportCase, "CaseEscalated", previousPriority.ToString(), supportCase.Priority.ToString(), "system");

        await dbContext.SaveChangesAsync();
        return Ok(supportCase);
    }

    [HttpGet("{id:guid}/summary")]
    public async Task<ActionResult<object>> GetSummary(Guid id)
    {
        var supportCase = await dbContext.Cases
            .Include(c => c.Customer)
            .Include(c => c.Comments.OrderBy(comment => comment.CreatedAt))
            .Include(c => c.AuditHistory.OrderByDescending(entry => entry.Timestamp))
            .FirstOrDefaultAsync(c => c.Id == id);

        if (supportCase is null)
        {
            return NotFound();
        }

        var messages = string.Join(Environment.NewLine, supportCase.Comments.Select(comment => $"[{comment.CreatedAt:u}] {comment.Author}: {comment.Content}"));
        var summary = await aiService.SummarizeCaseAsync(supportCase.Subject, supportCase.Description, messages);
        var slaRemaining = supportCase.SlaDeadline <= DateTime.UtcNow
            ? "breached"
            : $"{(supportCase.SlaDeadline - DateTime.UtcNow).TotalHours:F1} hours";
        var lastAction = supportCase.AuditHistory.FirstOrDefault()?.Action ?? "None";
        var lastCustomerMessage = supportCase.Comments.LastOrDefault(comment => !comment.IsInternal)?.Content ?? supportCase.Description;
        var suggestedAction = await aiService.SuggestNextActionAsync(
            supportCase.Id.ToString(),
            supportCase.Status.ToString(),
            supportCase.Priority.ToString(),
            supportCase.Category.ToString(),
            slaRemaining,
            summary,
            lastAction,
            lastCustomerMessage);

        supportCase.AiSummary = summary;
        supportCase.AiSuggestedAction = suggestedAction;
        supportCase.UpdatedAt = DateTime.UtcNow;
        await dbContext.SaveChangesAsync();

        return Ok(new
        {
            supportCase.Id,
            Summary = summary,
            SuggestedAction = suggestedAction
        });
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteCase(Guid id)
    {
        var supportCase = await dbContext.Cases.FirstOrDefaultAsync(c => c.Id == id);
        if (supportCase is null)
        {
            return NotFound();
        }

        dbContext.Cases.Remove(supportCase);
        await dbContext.SaveChangesAsync();
        return NoContent();
    }

    private static TimeSpan GetSlaWindow(CasePriority priority) => priority switch
    {
        CasePriority.Critical => TimeSpan.FromHours(4),
        CasePriority.High => TimeSpan.FromHours(8),
        CasePriority.Medium => TimeSpan.FromHours(24),
        _ => TimeSpan.FromHours(72)
    };

    private static CaseCategory ParseCategory(string? category, out string? error)
    {
        error = null;
        if (string.IsNullOrWhiteSpace(category))
        {
            return CaseCategory.General;
        }

        if (Enum.TryParse<CaseCategory>(category, true, out var parsedCategory))
        {
            return parsedCategory;
        }

        error = $"Invalid category '{category}'.";
        return CaseCategory.General;
    }

    private static CasePriority ParsePriorityFromResponse(string response)
    {
        var token = response.Split(new[] { ' ', ':', '-', ',' }, StringSplitOptions.RemoveEmptyEntries).FirstOrDefault();
        return Enum.TryParse<CasePriority>(token, true, out var priority) ? priority : CasePriority.Medium;
    }

    private void AddAuditEntry(Case supportCase, string action, string? oldValue, string? newValue, string performedBy = "system")
    {
        dbContext.CaseAuditEntries.Add(new CaseAuditEntry
        {
            CaseId = supportCase.Id,
            Action = action,
            PerformedBy = performedBy,
            OldValue = oldValue,
            NewValue = newValue
        });
    }
}
