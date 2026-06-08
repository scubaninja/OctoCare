using System.Globalization;
using System.Text;
using Azure;
using Azure.AI.OpenAI;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Npgsql;

namespace OctoCare.AiTriageWorker;

public sealed class TriageWorker : BackgroundService
{
    private static readonly TimeSpan PollInterval = TimeSpan.FromSeconds(30);
    private static readonly string[] CaseTableCandidates = ["Cases", "cases", "SupportCases"];
    private static readonly string[] AuditTableCandidates = ["CaseAuditEntries", "CaseAudits", "AuditEntries"];
    private static readonly string[] AllowedPriorities = ["Critical", "High", "Medium", "Low"];

    private readonly ILogger<TriageWorker> _logger;
    private readonly IConfiguration _configuration;

    public TriageWorker(ILogger<TriageWorker> logger, IConfiguration configuration)
    {
        _logger = logger;
        _configuration = configuration;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("AI triage worker started.");

        using var timer = new PeriodicTimer(PollInterval);

        do
        {
            try
            {
                await RunCycleAsync(stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unhandled error while running AI triage cycle.");
            }
        }
        while (await WaitForNextTickAsync(timer, stoppingToken));
    }

    private async Task RunCycleAsync(CancellationToken cancellationToken)
    {
        var connectionString = _configuration.GetConnectionString("DefaultConnection");
        if (string.IsNullOrWhiteSpace(connectionString))
        {
            _logger.LogError("ConnectionStrings:DefaultConnection is not configured.");
            return;
        }

        var openAiSettings = AzureOpenAiSettings.FromConfiguration(_configuration);
        if (!openAiSettings.IsConfigured)
        {
            _logger.LogWarning("Azure OpenAI configuration is incomplete. Skipping triage cycle.");
            return;
        }

        await using var connection = new NpgsqlConnection(connectionString);
        await connection.OpenAsync(cancellationToken);

        var caseTable = await DbSchemaResolver.ResolveTableNameAsync(connection, CaseTableCandidates, cancellationToken);
        if (caseTable is null)
        {
            _logger.LogError("Unable to find a cases table for AI triage.");
            return;
        }

        var caseColumns = await DbSchemaResolver.GetColumnsAsync(connection, caseTable, cancellationToken);
        var caseMap = CaseColumnMap.From(caseColumns);
        if (!caseMap.CanProcessTriage)
        {
            _logger.LogError("Cases table {TableName} is missing required triage columns.", caseTable);
            return;
        }

        var auditTable = await DbSchemaResolver.ResolveTableNameAsync(connection, AuditTableCandidates, cancellationToken);
        var auditColumns = auditTable is null
            ? []
            : await DbSchemaResolver.GetColumnsAsync(connection, auditTable, cancellationToken);
        var auditMap = AuditColumnMap.From(auditColumns);

        var pendingCases = await LoadPendingCasesAsync(connection, caseTable, caseMap, cancellationToken);
        if (pendingCases.Count == 0)
        {
            _logger.LogDebug("No new cases found for AI triage.");
            return;
        }

        _logger.LogInformation("Found {CaseCount} case(s) for AI triage.", pendingCases.Count);

        var openAiClient = new OpenAIClient(new Uri(openAiSettings.Endpoint!), new AzureKeyCredential(openAiSettings.ApiKey!));

        foreach (var pendingCase in pendingCases)
        {
            try
            {
                await ProcessCaseAsync(connection, openAiClient, openAiSettings, caseTable, caseMap, auditTable, auditMap, pendingCase, cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to process case {CaseId}. Continuing with remaining cases.", pendingCase.CaseId);
            }
        }
    }

    private async Task ProcessCaseAsync(
        NpgsqlConnection connection,
        OpenAIClient openAiClient,
        AzureOpenAiSettings settings,
        string caseTable,
        CaseColumnMap caseMap,
        string? auditTable,
        AuditColumnMap auditMap,
        CaseSnapshot pendingCase,
        CancellationToken cancellationToken)
    {
        var summary = await GetChatCompletionAsync(
            openAiClient,
            settings.DeploymentName,
            SummarySystemPrompt,
            BuildSummaryUserPrompt(pendingCase),
            0.3f,
            300,
            cancellationToken);

        var priorityResponse = await GetChatCompletionAsync(
            openAiClient,
            settings.DeploymentName,
            PrioritySystemPrompt,
            BuildPriorityUserPrompt(pendingCase, summary),
            0.1f,
            100,
            cancellationToken);

        var suggestedPriority = ExtractPriority(priorityResponse);
        var nextAction = await GetChatCompletionAsync(
            openAiClient,
            settings.DeploymentName,
            NextActionSystemPrompt,
            BuildNextActionUserPrompt(pendingCase, summary, suggestedPriority ?? pendingCase.Priority),
            0.4f,
            200,
            cancellationToken);

        await using var transaction = await connection.BeginTransactionAsync(cancellationToken);

        await UpdateCaseAsync(connection, transaction, caseTable, caseMap, pendingCase, summary, nextAction, suggestedPriority, cancellationToken);

        if (!string.IsNullOrWhiteSpace(auditTable) && auditMap.CanInsert)
        {
            await InsertAuditEntryAsync(connection, transaction, auditTable, auditMap, pendingCase.IdValue, "AI triage completed", "AI Triage Worker", cancellationToken);
        }
        else
        {
            _logger.LogDebug("Skipping audit insert for case {CaseId} because no compatible audit table was found.", pendingCase.CaseId);
        }

        await transaction.CommitAsync(cancellationToken);

        _logger.LogInformation(
            "Completed AI triage for case {CaseId}. Priority {OldPriority} -> {NewPriority}.",
            pendingCase.CaseId,
            pendingCase.Priority ?? "Unspecified",
            suggestedPriority ?? pendingCase.Priority ?? "Unchanged");
    }

    private async Task<List<CaseSnapshot>> LoadPendingCasesAsync(
        NpgsqlConnection connection,
        string caseTable,
        CaseColumnMap map,
        CancellationToken cancellationToken)
    {
        var orderByColumn = map.CreatedAt ?? map.Id!;
        var commandText = $"""
SELECT
    {SelectColumn(map.Id, "case_id")},
    {SelectColumn(map.Subject, "subject")},
    {SelectColumn(map.CustomerName, "customer_name")},
    {SelectColumn(map.CreatedAt, "created_at", "timestamp with time zone")},
    {SelectColumn(map.Priority, "priority")},
    {SelectColumn(map.Category, "category")},
    {SelectColumn(map.Status, "status")},
    {SelectColumn(map.SlaDeadline, "sla_deadline", "timestamp with time zone")},
    {SelectColumn(map.CustomerTier, "customer_tier")},
    {SelectColumn(map.LastAction, "last_action")},
    {SelectColumn(map.LastCustomerMessage, "last_customer_message")},
    {SelectColumn(map.Description, "description")}
FROM {Quote(caseTable)}
WHERE {Quote(map.Status!)} = @status
  AND ({Quote(map.AiSummary!)} IS NULL OR btrim({Quote(map.AiSummary!)}) = '')
ORDER BY {Quote(orderByColumn)}
LIMIT 25;
""";

        await using var command = new NpgsqlCommand(commandText, connection);
        command.Parameters.AddWithValue("status", "New");

        var cases = new List<CaseSnapshot>();
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            var idValue = reader.GetValue(reader.GetOrdinal("case_id"));
            cases.Add(new CaseSnapshot(
                idValue,
                Convert.ToString(idValue, CultureInfo.InvariantCulture) ?? string.Empty,
                ReadString(reader, "subject"),
                ReadString(reader, "customer_name"),
                ReadDateTimeOffset(reader, "created_at"),
                ReadString(reader, "priority"),
                ReadString(reader, "category"),
                ReadString(reader, "status"),
                ReadDateTimeOffset(reader, "sla_deadline"),
                ReadString(reader, "customer_tier"),
                ReadString(reader, "last_action"),
                ReadString(reader, "last_customer_message"),
                ReadString(reader, "description")));
        }

        return cases;
    }

    private async Task UpdateCaseAsync(
        NpgsqlConnection connection,
        NpgsqlTransaction transaction,
        string caseTable,
        CaseColumnMap map,
        CaseSnapshot pendingCase,
        string summary,
        string nextAction,
        string? suggestedPriority,
        CancellationToken cancellationToken)
    {
        var setClauses = new List<string>
        {
            $"{Quote(map.AiSummary!)} = @aiSummary",
            $"{Quote(map.AiSuggestedAction!)} = @aiSuggestedAction"
        };

        var updatePriority = !string.IsNullOrWhiteSpace(suggestedPriority)
            && !string.Equals(suggestedPriority, pendingCase.Priority, StringComparison.OrdinalIgnoreCase)
            && !string.IsNullOrWhiteSpace(map.Priority);

        if (updatePriority)
        {
            setClauses.Add($"{Quote(map.Priority!)} = @priority");
        }

        var commandText = $"UPDATE {Quote(caseTable)} SET {string.Join(", ", setClauses)} WHERE {Quote(map.Id!)} = @caseId;";
        await using var command = new NpgsqlCommand(commandText, connection, transaction);
        command.Parameters.AddWithValue("aiSummary", summary);
        command.Parameters.AddWithValue("aiSuggestedAction", nextAction);
        command.Parameters.AddWithValue("caseId", pendingCase.IdValue);

        if (updatePriority)
        {
            command.Parameters.AddWithValue("priority", suggestedPriority!);
        }

        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    private static async Task InsertAuditEntryAsync(
        NpgsqlConnection connection,
        NpgsqlTransaction transaction,
        string auditTable,
        AuditColumnMap map,
        object caseId,
        string message,
        string actor,
        CancellationToken cancellationToken)
    {
        var columns = new List<string> { Quote(map.CaseId!), Quote(map.Message!) };
        var values = new List<string> { "@caseId", "@message" };

        if (!string.IsNullOrWhiteSpace(map.CreatedAt))
        {
            columns.Add(Quote(map.CreatedAt!));
            values.Add("@createdAt");
        }

        if (!string.IsNullOrWhiteSpace(map.Actor))
        {
            columns.Add(Quote(map.Actor!));
            values.Add("@actor");
        }

        var commandText = $"INSERT INTO {Quote(auditTable)} ({string.Join(", ", columns)}) VALUES ({string.Join(", ", values)});";
        await using var command = new NpgsqlCommand(commandText, connection, transaction);
        command.Parameters.AddWithValue("caseId", caseId);
        command.Parameters.AddWithValue("message", message);

        if (!string.IsNullOrWhiteSpace(map.CreatedAt))
        {
            command.Parameters.AddWithValue("createdAt", DateTimeOffset.UtcNow);
        }

        if (!string.IsNullOrWhiteSpace(map.Actor))
        {
            command.Parameters.AddWithValue("actor", actor);
        }

        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    private static async Task<string> GetChatCompletionAsync(
        OpenAIClient client,
        string deploymentName,
        string systemPrompt,
        string userPrompt,
        float temperature,
        int maxTokens,
        CancellationToken cancellationToken)
    {
        var options = new ChatCompletionsOptions
        {
            DeploymentName = deploymentName,
            Temperature = temperature,
            MaxTokens = maxTokens
        };

        options.Messages.Add(new ChatRequestSystemMessage(systemPrompt));
        options.Messages.Add(new ChatRequestUserMessage(userPrompt));

        var response = await client.GetChatCompletionsAsync(options, cancellationToken);
        return response.Value.Choices.FirstOrDefault()?.Message.Content?.Trim() ?? string.Empty;
    }

    private static string BuildSummaryUserPrompt(CaseSnapshot pendingCase)
    {
        var messages = new StringBuilder();

        if (!string.IsNullOrWhiteSpace(pendingCase.Description))
        {
            messages.AppendLine(pendingCase.Description.Trim());
        }

        if (!string.IsNullOrWhiteSpace(pendingCase.LastCustomerMessage)
            && !string.Equals(pendingCase.LastCustomerMessage, pendingCase.Description, StringComparison.Ordinal))
        {
            if (messages.Length > 0)
            {
                messages.AppendLine();
            }

            messages.AppendLine(pendingCase.LastCustomerMessage.Trim());
        }

        if (messages.Length == 0)
        {
            messages.Append("No case message content was stored.");
        }

        return $"""
Case ID: {pendingCase.CaseId}
Subject: {pendingCase.Subject ?? "Unknown"}
Customer: {pendingCase.CustomerName ?? "Unknown"}
Created: {pendingCase.CreatedAt?.ToString("u") ?? "Unknown"}

Messages:
{messages}
""";
    }

    private static string BuildPriorityUserPrompt(CaseSnapshot pendingCase, string summary)
    {
        return $"""
Subject: {pendingCase.Subject ?? "Unknown"}
Category: {pendingCase.Category ?? "Unknown"}
Customer Tier: {pendingCase.CustomerTier ?? "Unknown"}
Message: {summary}
""";
    }

    private static string BuildNextActionUserPrompt(CaseSnapshot pendingCase, string summary, string? priority)
    {
        return $"""
Case ID: {pendingCase.CaseId}
Status: {pendingCase.Status ?? "Unknown"}
Priority: {priority ?? pendingCase.Priority ?? "Unknown"}
Category: {pendingCase.Category ?? "Unknown"}
SLA Remaining: {DescribeSlaRemaining(pendingCase.SlaDeadline)}
Summary: {summary}
Last Agent Action: {pendingCase.LastAction ?? "None"}
Last Customer Message: {pendingCase.LastCustomerMessage ?? pendingCase.Description ?? "Unknown"}
""";
    }

    private static string DescribeSlaRemaining(DateTimeOffset? deadline)
    {
        if (deadline is null)
        {
            return "Unknown";
        }

        var remaining = deadline.Value - DateTimeOffset.UtcNow;
        if (remaining <= TimeSpan.Zero)
        {
            return $"Breached by {Math.Abs(Math.Round(remaining.TotalMinutes))} minute(s)";
        }

        return $"{Math.Ceiling(remaining.TotalMinutes)} minute(s) remaining";
    }

    private static string? ExtractPriority(string response)
    {
        foreach (var priority in AllowedPriorities)
        {
            if (response.Contains(priority, StringComparison.OrdinalIgnoreCase))
            {
                return priority;
            }
        }

        return null;
    }

    private static string? ReadString(NpgsqlDataReader reader, string columnName)
    {
        var ordinal = reader.GetOrdinal(columnName);
        return reader.IsDBNull(ordinal) ? null : reader.GetValue(ordinal).ToString();
    }

    private static DateTimeOffset? ReadDateTimeOffset(NpgsqlDataReader reader, string columnName)
    {
        var ordinal = reader.GetOrdinal(columnName);
        if (reader.IsDBNull(ordinal))
        {
            return null;
        }

        return reader.GetValue(ordinal) switch
        {
            DateTimeOffset value => value,
            DateTime value => value.Kind == DateTimeKind.Unspecified
                ? new DateTimeOffset(DateTime.SpecifyKind(value, DateTimeKind.Utc))
                : new DateTimeOffset(value),
            _ => DateTimeOffset.TryParse(reader.GetValue(ordinal).ToString(), out var parsed) ? parsed : null
        };
    }

    private static string SelectColumn(string? columnName, string alias, string nullType = "text")
        => columnName is null ? $"NULL::{nullType} AS {alias}" : $"{Quote(columnName)} AS {alias}";

    private static string Quote(string identifier) => $"\"{identifier.Replace("\"", "\"\"")}\"";

    private static async Task<bool> WaitForNextTickAsync(PeriodicTimer timer, CancellationToken cancellationToken)
    {
        try
        {
            return await timer.WaitForNextTickAsync(cancellationToken);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            return false;
        }
    }

    private const string SummarySystemPrompt = """
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

    private const string PrioritySystemPrompt = """
You are a priority classification assistant for OctoCare.
Given a customer support case, classify its priority as one of:
- Critical: Service completely down, data loss, security breach
- High: Major feature broken, significant business impact
- Medium: Feature partially working, workaround available
- Low: Minor issue, cosmetic, general question

Respond with only the priority level and a one-sentence justification.
""";

    private const string NextActionSystemPrompt = """
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
}

internal sealed record CaseSnapshot(
    object IdValue,
    string CaseId,
    string? Subject,
    string? CustomerName,
    DateTimeOffset? CreatedAt,
    string? Priority,
    string? Category,
    string? Status,
    DateTimeOffset? SlaDeadline,
    string? CustomerTier,
    string? LastAction,
    string? LastCustomerMessage,
    string? Description);

internal sealed record CaseColumnMap(
    string? Id,
    string? Subject,
    string? CustomerName,
    string? CreatedAt,
    string? Priority,
    string? Category,
    string? Status,
    string? SlaDeadline,
    string? CustomerTier,
    string? LastAction,
    string? LastCustomerMessage,
    string? Description,
    string? AiSummary,
    string? AiSuggestedAction)
{
    public bool CanProcessTriage =>
        !string.IsNullOrWhiteSpace(Id)
        && !string.IsNullOrWhiteSpace(Status)
        && !string.IsNullOrWhiteSpace(AiSummary)
        && !string.IsNullOrWhiteSpace(AiSuggestedAction);

    public static CaseColumnMap From(IReadOnlyCollection<string> columns)
    {
        return new CaseColumnMap(
            Find(columns, "Id", "CaseId", "id", "case_id"),
            Find(columns, "Subject", "subject", "Title", "title"),
            Find(columns, "CustomerName", "customer_name", "Customer", "customer"),
            Find(columns, "CreatedAt", "created_at"),
            Find(columns, "Priority", "priority"),
            Find(columns, "Category", "category"),
            Find(columns, "Status", "status"),
            Find(columns, "SlaDeadline", "sla_deadline"),
            Find(columns, "CustomerTier", "customer_tier"),
            Find(columns, "LastAction", "last_action", "LastAgentAction", "last_agent_action"),
            Find(columns, "LastCustomerMessage", "last_customer_message"),
            Find(columns, "Description", "description", "Message", "message", "Messages", "messages", "Details", "details"),
            Find(columns, "AiSummary", "ai_summary"),
            Find(columns, "AiSuggestedAction", "ai_suggested_action"));
    }

    private static string? Find(IEnumerable<string> columns, params string[] candidates)
        => columns.FirstOrDefault(column => candidates.Any(candidate => string.Equals(column, candidate, StringComparison.OrdinalIgnoreCase)));
}

internal sealed record AuditColumnMap(string? CaseId, string? Message, string? CreatedAt, string? Actor)
{
    public bool CanInsert => !string.IsNullOrWhiteSpace(CaseId) && !string.IsNullOrWhiteSpace(Message);

    public static AuditColumnMap From(IReadOnlyCollection<string> columns)
    {
        return new AuditColumnMap(
            Find(columns, "CaseId", "case_id"),
            Find(columns, "Message", "message", "Entry", "entry", "Description", "description"),
            Find(columns, "CreatedAt", "created_at", "OccurredAt", "occurred_at"),
            Find(columns, "Actor", "actor", "CreatedBy", "created_by", "Source", "source"));
    }

    private static string? Find(IEnumerable<string> columns, params string[] candidates)
        => columns.FirstOrDefault(column => candidates.Any(candidate => string.Equals(column, candidate, StringComparison.OrdinalIgnoreCase)));
}

internal sealed class AzureOpenAiSettings
{
    public string? Endpoint { get; init; }

    public string? ApiKey { get; init; }

    public string DeploymentName { get; init; } = "gpt-4o";

    public bool IsConfigured => !string.IsNullOrWhiteSpace(Endpoint) && !string.IsNullOrWhiteSpace(ApiKey);

    public static AzureOpenAiSettings FromConfiguration(IConfiguration configuration)
    {
        var section = configuration.GetSection("AzureOpenAI");
        return new AzureOpenAiSettings
        {
            Endpoint = section["Endpoint"],
            ApiKey = section["ApiKey"],
            DeploymentName = section["DeploymentName"] ?? "gpt-4o"
        };
    }
}

internal static class DbSchemaResolver
{
    public static async Task<string?> ResolveTableNameAsync(
        NpgsqlConnection connection,
        IEnumerable<string> candidates,
        CancellationToken cancellationToken)
    {
        const string sql = "SELECT table_name FROM information_schema.tables WHERE table_schema = current_schema();";
        await using var command = new NpgsqlCommand(sql, connection);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);

        var tables = new List<string>();
        while (await reader.ReadAsync(cancellationToken))
        {
            tables.Add(reader.GetString(0));
        }

        return tables.FirstOrDefault(table => candidates.Any(candidate => string.Equals(table, candidate, StringComparison.OrdinalIgnoreCase)));
    }

    public static async Task<IReadOnlyCollection<string>> GetColumnsAsync(
        NpgsqlConnection connection,
        string tableName,
        CancellationToken cancellationToken)
    {
        const string sql = """
SELECT column_name
FROM information_schema.columns
WHERE table_schema = current_schema()
  AND table_name = @tableName;
""";

        await using var command = new NpgsqlCommand(sql, connection);
        command.Parameters.AddWithValue("tableName", tableName);

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        var columns = new List<string>();
        while (await reader.ReadAsync(cancellationToken))
        {
            columns.Add(reader.GetString(0));
        }

        return columns;
    }
}
