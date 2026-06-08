using System.Net.Http.Json;
using System.Text.Json;

namespace OctoCare.Api.Services;

public class AiService(HttpClient httpClient, IConfiguration configuration) : IAiService
{
    private const string ApiVersion = "2024-02-15-preview";

    public Task<string> SummarizeCaseAsync(string subject, string description, string messages)
    {
        var systemPrompt = """
            You are a support case summarization assistant for OctoCare.
            Given a customer support case with its messages and metadata, produce a clear,
            concise summary that helps a support agent quickly understand the issue.

            Include:
            - What the customer's problem is
            - Any relevant order or account details mentioned
            - What the customer has already tried
            - The emotional tone of the customer

            Keep the summary under 3 sentences.
            """;

        var userPrompt = $"""
            Subject: {subject}
            Description: {description}

            Messages:
            {messages}
            """;

        return CompleteAsync(systemPrompt, userPrompt, BuildFallbackSummary(subject, description, messages), 0.3m, 300);
    }

    public Task<string> ClassifyPriorityAsync(string subject, string category, string customerTier, string message)
    {
        var systemPrompt = """
            You are a priority classification assistant for OctoCare.
            Given a customer support case, classify its priority as one of:
            - Critical: Service completely down, data loss, security breach
            - High: Major feature broken, significant business impact
            - Medium: Feature partially working, workaround available
            - Low: Minor issue, cosmetic, general question

            Respond with only the priority level and a one-sentence justification.
            """;

        var userPrompt = $"""
            Subject: {subject}
            Category: {category}
            Customer Tier: {customerTier}
            Message: {message}
            """;

        return CompleteAsync(systemPrompt, userPrompt, BuildFallbackPriority(subject, category, customerTier, message), 0.1m, 100);
    }

    public Task<string> SuggestNextActionAsync(string caseId, string status, string priority, string category, string slaRemaining, string summary, string lastAction, string lastMessage)
    {
        var systemPrompt = """
            You are a support workflow assistant for OctoCare.
            Given a support case with its current status and history, suggest the single
            best next action for the support agent.

            Consider:
            - Has the customer provided enough information?
            - Is there a relevant knowledge base article?
            - Should this be escalated?
            - Is a specific team or specialist needed?
            - Are we approaching an SLA breach?

            Provide a clear, actionable recommendation in 1-2 sentences.
            """;

        var userPrompt = $"""
            Case ID: {caseId}
            Status: {status}
            Priority: {priority}
            Category: {category}
            SLA Remaining: {slaRemaining}
            Summary: {summary}
            Last Agent Action: {lastAction}
            Last Customer Message: {lastMessage}
            """;

        return CompleteAsync(systemPrompt, userPrompt, BuildFallbackAction(status, priority, category, slaRemaining, summary, lastMessage), 0.4m, 200);
    }

    public Task<string> AnswerQuestionAsync(string question, string context)
    {
        var systemPrompt = """
            You are OctoCare's customer-facing support assistant.
            Answer the customer's question using only the provided support context.
            If the answer is not supported by the context, say that you do not have enough information
            and recommend contacting a support agent. Keep the answer concise and practical.
            """;

        var userPrompt = $"""
            Question: {question}

            Context:
            {context}
            """;

        return CompleteAsync(systemPrompt, userPrompt, BuildFallbackAnswer(question, context), 0.2m, 250);
    }

    private async Task<string> CompleteAsync(string systemPrompt, string userPrompt, string fallback, decimal temperature, int maxTokens)
    {
        var endpoint = configuration["AzureOpenAI:Endpoint"];
        var apiKey = configuration["AzureOpenAI:ApiKey"];
        var deploymentName = configuration["AzureOpenAI:DeploymentName"];

        if (string.IsNullOrWhiteSpace(endpoint) || string.IsNullOrWhiteSpace(apiKey) || string.IsNullOrWhiteSpace(deploymentName))
        {
            return fallback;
        }

        var requestUri = $"{endpoint.TrimEnd('/')}/openai/deployments/{deploymentName}/chat/completions?api-version={ApiVersion}";
        using var request = new HttpRequestMessage(HttpMethod.Post, requestUri);
        request.Headers.Add("api-key", apiKey);
        request.Content = JsonContent.Create(new
        {
            messages = new object[]
            {
                new { role = "system", content = systemPrompt },
                new { role = "user", content = userPrompt }
            },
            temperature,
            max_tokens = maxTokens
        });

        try
        {
            using var response = await httpClient.SendAsync(request);
            if (!response.IsSuccessStatusCode)
            {
                return fallback;
            }

            await using var stream = await response.Content.ReadAsStreamAsync();
            using var document = await JsonDocument.ParseAsync(stream);
            var content = document.RootElement
                .GetProperty("choices")[0]
                .GetProperty("message")
                .GetProperty("content")
                .GetString();

            return string.IsNullOrWhiteSpace(content) ? fallback : content.Trim();
        }
        catch
        {
            return fallback;
        }
    }

    private static string BuildFallbackSummary(string subject, string description, string messages)
    {
        var combined = string.Join(' ', new[] { subject, description, messages }.Where(static value => !string.IsNullOrWhiteSpace(value))).Trim();
        if (combined.Length > 280)
        {
            combined = $"{combined[..277]}...";
        }

        return $"Customer issue summary: {combined}";
    }

    private static string BuildFallbackPriority(string subject, string category, string customerTier, string message)
    {
        var combined = string.Join(' ', new[] { subject, category, customerTier, message }).ToLowerInvariant();
        if (combined.Contains("security") || combined.Contains("breach") || combined.Contains("data loss") || combined.Contains("down"))
        {
            return "Critical: The issue appears to involve a complete outage, security concern, or severe data-impacting problem.";
        }

        if (combined.Contains("urgent") || combined.Contains("broken") || combined.Contains("cannot") || combined.Contains("enterprise"))
        {
            return "High: The issue likely has meaningful business impact and should be prioritized quickly.";
        }

        if (combined.Contains("question") || combined.Contains("minor") || combined.Contains("cosmetic"))
        {
            return "Low: The issue appears informational or low impact.";
        }

        return "Medium: The issue requires follow-up but does not clearly indicate a critical outage.";
    }

    private static string BuildFallbackAction(string status, string priority, string category, string slaRemaining, string summary, string lastMessage)
    {
        if (slaRemaining.Contains("breached", StringComparison.OrdinalIgnoreCase) || slaRemaining.Contains("0", StringComparison.OrdinalIgnoreCase))
        {
            return "Prioritize immediate follow-up with the customer and route the case to the appropriate specialist to address the SLA risk.";
        }

        if (status.Equals("WaitingOnCustomer", StringComparison.OrdinalIgnoreCase))
        {
            return "Send a concise follow-up asking for the missing detail needed to move the case forward.";
        }

        if (priority.Equals("Critical", StringComparison.OrdinalIgnoreCase) || category.Equals("Technical", StringComparison.OrdinalIgnoreCase))
        {
            return "Review the latest technical details and engage the specialist team if the current troubleshooting steps are exhausted.";
        }

        return string.IsNullOrWhiteSpace(lastMessage)
            ? $"Review the case summary and respond with the next troubleshooting or resolution step: {summary}".Trim()
            : "Acknowledge the customer's latest update and provide the next concrete troubleshooting or resolution step.";
    }

    private static string BuildFallbackAnswer(string question, string context)
    {
        if (string.IsNullOrWhiteSpace(context))
        {
            return "I do not have enough information to answer that right now. Please contact a support agent for additional help.";
        }

        var snippet = context.Length > 500 ? $"{context[..497]}..." : context;
        return $"Based on the available support information, here is the best answer to '{question}': {snippet}";
    }
}
