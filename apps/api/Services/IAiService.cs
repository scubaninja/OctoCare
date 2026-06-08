namespace OctoCare.Api.Services;

public interface IAiService
{
    Task<string> SummarizeCaseAsync(string subject, string description, string messages);
    Task<string> ClassifyPriorityAsync(string subject, string category, string customerTier, string message);
    Task<string> SuggestNextActionAsync(string caseId, string status, string priority, string category, string slaRemaining, string summary, string lastAction, string lastMessage);
    Task<string> AnswerQuestionAsync(string question, string context);
}
