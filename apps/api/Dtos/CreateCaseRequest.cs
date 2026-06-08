namespace OctoCare.Api.Dtos;

public record CreateCaseRequest(string Subject, string Description, Guid CustomerId, string? Category);
public record UpdateCaseRequest(string? Status, string? Priority, string? Category, string? AssignedAgentId);
public record AddCommentRequest(string Author, string Content, bool IsInternal);
public record SearchKnowledgeBaseRequest(string Query);
public record AiAssistantRequest(string Question, Guid? CustomerId);
