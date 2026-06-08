using System.Globalization;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Npgsql;

namespace OctoCare.SlaWorker;

public sealed class SlaMonitorWorker : BackgroundService
{
    private static readonly TimeSpan PollInterval = TimeSpan.FromSeconds(60);
    private static readonly TimeSpan RiskWindow = TimeSpan.FromHours(1);
    private static readonly string[] CaseTableCandidates = ["Cases", "cases", "SupportCases"];
    private static readonly string[] AuditTableCandidates = ["CaseAuditEntries", "CaseAudits", "AuditEntries"];

    private readonly ILogger<SlaMonitorWorker> _logger;
    private readonly IConfiguration _configuration;

    public SlaMonitorWorker(ILogger<SlaMonitorWorker> logger, IConfiguration configuration)
    {
        _logger = logger;
        _configuration = configuration;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("SLA worker started.");

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
                _logger.LogError(ex, "Unhandled error while running SLA monitoring cycle.");
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

        await using var connection = new NpgsqlConnection(connectionString);
        await connection.OpenAsync(cancellationToken);

        var caseTable = await DbSchemaResolver.ResolveTableNameAsync(connection, CaseTableCandidates, cancellationToken);
        if (caseTable is null)
        {
            _logger.LogError("Unable to find a cases table for SLA monitoring.");
            return;
        }

        var caseColumns = await DbSchemaResolver.GetColumnsAsync(connection, caseTable, cancellationToken);
        var caseMap = SlaCaseColumnMap.From(caseColumns);
        if (!caseMap.CanMonitorSla)
        {
            _logger.LogError("Cases table {TableName} is missing required SLA columns.", caseTable);
            return;
        }

        var auditTable = await DbSchemaResolver.ResolveTableNameAsync(connection, AuditTableCandidates, cancellationToken);
        var auditColumns = auditTable is null
            ? []
            : await DbSchemaResolver.GetColumnsAsync(connection, auditTable, cancellationToken);
        var auditMap = AuditColumnMap.From(auditColumns);

        var openCases = await LoadOpenCasesAsync(connection, caseTable, caseMap, cancellationToken);
        var now = DateTimeOffset.UtcNow;

        var atRiskCases = openCases
            .Where(caseItem => caseItem.SlaDeadline is not null && caseItem.SlaDeadline > now && caseItem.SlaDeadline <= now.Add(RiskWindow))
            .ToList();

        var breachedCases = openCases
            .Where(caseItem => caseItem.SlaDeadline is not null && caseItem.SlaDeadline <= now)
            .ToList();

        _logger.LogInformation(
            "SLA stats: total open cases={TotalOpenCases}, at risk={AtRiskCases}, breached={BreachedCases}.",
            openCases.Count,
            atRiskCases.Count,
            breachedCases.Count);

        foreach (var caseItem in atRiskCases)
        {
            _logger.LogWarning(
                "Case {CaseId} is approaching SLA breach with deadline at {SlaDeadline:u}. Notification could be triggered.",
                caseItem.CaseId,
                caseItem.SlaDeadline);
        }

        foreach (var caseItem in breachedCases.Where(caseItem => !caseItem.SlaBreached))
        {
            try
            {
                await MarkSlaBreachedAsync(connection, caseTable, caseMap, auditTable, auditMap, caseItem, cancellationToken);
                _logger.LogWarning("Case {CaseId} breached SLA at {SlaDeadline:u}.", caseItem.CaseId, caseItem.SlaDeadline);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to mark SLA breach for case {CaseId}.", caseItem.CaseId);
            }
        }
    }

    private async Task<List<SlaCaseSnapshot>> LoadOpenCasesAsync(
        NpgsqlConnection connection,
        string caseTable,
        SlaCaseColumnMap map,
        CancellationToken cancellationToken)
    {
        var orderByColumn = map.SlaDeadline ?? map.Id!;
        var commandText = $"""
SELECT
    {SelectColumn(map.Id, "case_id")},
    {SelectColumn(map.Subject, "subject")},
    {SelectColumn(map.Priority, "priority")},
    {SelectColumn(map.Status, "status")},
    {SelectColumn(map.SlaDeadline, "sla_deadline", "timestamp with time zone")},
    {SelectColumn(map.SlaBreached, "sla_breached", "boolean")}
FROM {Quote(caseTable)}
WHERE lower(COALESCE({Quote(map.Status!)}, '')) NOT IN ('resolved', 'closed')
ORDER BY {Quote(orderByColumn)} NULLS LAST;
""";

        await using var command = new NpgsqlCommand(commandText, connection);

        var cases = new List<SlaCaseSnapshot>();
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            var idValue = reader.GetValue(reader.GetOrdinal("case_id"));
            cases.Add(new SlaCaseSnapshot(
                idValue,
                Convert.ToString(idValue, CultureInfo.InvariantCulture) ?? string.Empty,
                ReadString(reader, "subject"),
                ReadString(reader, "priority"),
                ReadString(reader, "status"),
                ReadDateTimeOffset(reader, "sla_deadline"),
                ReadBoolean(reader, "sla_breached")));
        }

        return cases;
    }

    private async Task MarkSlaBreachedAsync(
        NpgsqlConnection connection,
        string caseTable,
        SlaCaseColumnMap caseMap,
        string? auditTable,
        AuditColumnMap auditMap,
        SlaCaseSnapshot caseItem,
        CancellationToken cancellationToken)
    {
        await using var transaction = await connection.BeginTransactionAsync(cancellationToken);

        var updateSql = $"UPDATE {Quote(caseTable)} SET {Quote(caseMap.SlaBreached!)} = TRUE WHERE {Quote(caseMap.Id!)} = @caseId;";
        await using (var updateCommand = new NpgsqlCommand(updateSql, connection, transaction))
        {
            updateCommand.Parameters.AddWithValue("caseId", caseItem.IdValue);
            await updateCommand.ExecuteNonQueryAsync(cancellationToken);
        }

        if (!string.IsNullOrWhiteSpace(auditTable) && auditMap.CanInsert)
        {
            await InsertAuditEntryAsync(connection, transaction, auditTable, auditMap, caseItem.IdValue, "SLA breached", "SLA Worker", cancellationToken);
        }
        else
        {
            _logger.LogDebug("Skipping audit insert for case {CaseId} because no compatible audit table was found.", caseItem.CaseId);
        }

        await transaction.CommitAsync(cancellationToken);
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

    private static bool ReadBoolean(NpgsqlDataReader reader, string columnName)
    {
        var ordinal = reader.GetOrdinal(columnName);
        if (reader.IsDBNull(ordinal))
        {
            return false;
        }

        return reader.GetValue(ordinal) switch
        {
            bool value => value,
            string value when bool.TryParse(value, out var parsed) => parsed,
            short value => value != 0,
            int value => value != 0,
            long value => value != 0,
            _ => false
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
}

internal sealed record SlaCaseSnapshot(
    object IdValue,
    string CaseId,
    string? Subject,
    string? Priority,
    string? Status,
    DateTimeOffset? SlaDeadline,
    bool SlaBreached);

internal sealed record SlaCaseColumnMap(
    string? Id,
    string? Subject,
    string? Priority,
    string? Status,
    string? SlaDeadline,
    string? SlaBreached)
{
    public bool CanMonitorSla =>
        !string.IsNullOrWhiteSpace(Id)
        && !string.IsNullOrWhiteSpace(Status)
        && !string.IsNullOrWhiteSpace(SlaDeadline)
        && !string.IsNullOrWhiteSpace(SlaBreached);

    public static SlaCaseColumnMap From(IReadOnlyCollection<string> columns)
    {
        return new SlaCaseColumnMap(
            Find(columns, "Id", "CaseId", "id", "case_id"),
            Find(columns, "Subject", "subject", "Title", "title"),
            Find(columns, "Priority", "priority"),
            Find(columns, "Status", "status"),
            Find(columns, "SlaDeadline", "sla_deadline"),
            Find(columns, "SlaBreached", "sla_breached"));
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
