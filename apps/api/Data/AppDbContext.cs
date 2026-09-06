using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using OctoCare.Api.Models;

namespace OctoCare.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Case> Cases => Set<Case>();
    public DbSet<Customer> Customers => Set<Customer>();
    public DbSet<CaseComment> CaseComments => Set<CaseComment>();
    public DbSet<CaseAttachment> CaseAttachments => Set<CaseAttachment>();
    public DbSet<CaseAuditEntry> CaseAuditEntries => Set<CaseAuditEntry>();
    public DbSet<KnowledgeBaseArticle> KnowledgeBaseArticles => Set<KnowledgeBaseArticle>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Case>(e =>
        {
            e.ToTable("cases");
            e.HasIndex(c => c.Status);
            e.HasIndex(c => c.CustomerId);
            e.HasIndex(c => c.SlaDeadline);
            e.HasOne(c => c.Customer).WithMany(cu => cu.Cases).HasForeignKey(c => c.CustomerId);
            e.Property(c => c.Status).HasConversion(new ValueConverter<CaseStatus, string>(
                value => CaseStatusToDatabase(value),
                value => CaseStatusFromDatabase(value)));
            e.Property(c => c.Priority).HasConversion(new ValueConverter<CasePriority, string>(
                value => CasePriorityToDatabase(value),
                value => CasePriorityFromDatabase(value)));
            e.Property(c => c.Category).HasConversion(new ValueConverter<CaseCategory, string>(
                value => CaseCategoryToDatabase(value),
                value => CaseCategoryFromDatabase(value)));
        });

        modelBuilder.Entity<Customer>(e =>
        {
            e.ToTable("customers");
            e.Property(c => c.Tier).HasConversion(new ValueConverter<CustomerTier, string>(
                value => value.ToString().ToLowerInvariant(),
                value => Enum.Parse<CustomerTier>(value, true)));
        });

        modelBuilder.Entity<CaseComment>(e =>
        {
            e.ToTable("case_comments");
            e.HasOne(c => c.Case).WithMany(ca => ca.Comments).HasForeignKey(c => c.CaseId);
        });

        modelBuilder.Entity<CaseAttachment>(e =>
        {
            e.ToTable("case_attachments");
            e.HasOne(a => a.Case).WithMany(c => c.Attachments).HasForeignKey(a => a.CaseId);
        });

        modelBuilder.Entity<CaseAuditEntry>(e =>
        {
            e.ToTable("case_audit_entries");
            e.HasOne(a => a.Case).WithMany(c => c.AuditHistory).HasForeignKey(a => a.CaseId);
        });

        modelBuilder.Entity<KnowledgeBaseArticle>(e =>
        {
            e.ToTable("knowledge_base_articles");
            e.Property(a => a.Tags).HasConversion(
                v => string.Join(',', v),
                v => v.Split(',', StringSplitOptions.RemoveEmptyEntries).ToList());
        });

        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            foreach (var property in entityType.GetProperties())
            {
                property.SetColumnName(ToSnakeCase(property.Name));
            }
        }
    }

    private static string ToSnakeCase(string value) =>
        string.Concat(value.Select((character, index) =>
            index > 0 && char.IsUpper(character)
                ? $"_{char.ToLowerInvariant(character)}"
                : char.ToLowerInvariant(character).ToString()));

    private static string CaseStatusToDatabase(CaseStatus value) => value switch
    {
        CaseStatus.InProgress => "in_progress",
        CaseStatus.PendingCustomer or CaseStatus.WaitingOnCustomer => "pending_customer",
        _ => value.ToString().ToLowerInvariant()
    };

    private static CaseStatus CaseStatusFromDatabase(string value) => value.ToLowerInvariant() switch
    {
        "in_progress" => CaseStatus.InProgress,
        "pending_customer" => CaseStatus.PendingCustomer,
        _ => Enum.Parse<CaseStatus>(value, true)
    };

    private static string CasePriorityToDatabase(CasePriority value) => value.ToString().ToLowerInvariant();

    private static CasePriority CasePriorityFromDatabase(string value) => Enum.Parse<CasePriority>(value, true);

    private static string CaseCategoryToDatabase(CaseCategory value) => value switch
    {
        CaseCategory.ShippingDamage => "shipping_damage",
        CaseCategory.OrderTracking => "order_tracking",
        CaseCategory.ProductFeedback => "product_feedback",
        _ => value.ToString().ToLowerInvariant()
    };

    private static CaseCategory CaseCategoryFromDatabase(string value) => value.ToLowerInvariant() switch
    {
        "shipping_damage" => CaseCategory.ShippingDamage,
        "order_tracking" => CaseCategory.OrderTracking,
        "product_feedback" => CaseCategory.ProductFeedback,
        _ => Enum.Parse<CaseCategory>(value, true)
    };
}
