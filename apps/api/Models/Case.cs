namespace OctoCare.Api.Models;

public enum CaseStatus { New, Open, InProgress, WaitingOnCustomer, Escalated, Resolved, Closed }
public enum CasePriority { Low, Medium, High, Critical }
public enum CaseCategory { Billing, Technical, Shipping, Account, ProductFeedback, General }

/// <summary>
/// Represents how close a case is to breaching its SLA deadline.
/// Low = more than 50 % of the SLA window remaining.
/// Medium = 25 – 50 % of the SLA window remaining.
/// High = less than 25 % of the SLA window remaining, or already breached.
/// </summary>
public enum SlaRisk { Low, Medium, High }

public class Case
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Subject { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public CaseStatus Status { get; set; } = CaseStatus.New;
    public CasePriority Priority { get; set; } = CasePriority.Medium;
    public CaseCategory Category { get; set; } = CaseCategory.General;
    public Guid CustomerId { get; set; }
    public string? AssignedAgentId { get; set; }
    public string? AiSummary { get; set; }
    public string? AiSuggestedAction { get; set; }
    public string? SentimentScore { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ResolvedAt { get; set; }
    public DateTime SlaDeadline { get; set; }
    public bool SlaBreached { get; set; }
    public Customer Customer { get; set; } = null!;
    public List<CaseComment> Comments { get; set; } = new();
    public List<CaseAttachment> Attachments { get; set; } = new();
    public List<CaseAuditEntry> AuditHistory { get; set; } = new();
}
