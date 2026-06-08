using Microsoft.EntityFrameworkCore;
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
            e.HasIndex(c => c.Status);
            e.HasIndex(c => c.CustomerId);
            e.HasIndex(c => c.SlaDeadline);
            e.HasOne(c => c.Customer).WithMany(cu => cu.Cases).HasForeignKey(c => c.CustomerId);
        });

        modelBuilder.Entity<CaseComment>(e =>
        {
            e.HasOne(c => c.Case).WithMany(ca => ca.Comments).HasForeignKey(c => c.CaseId);
        });

        modelBuilder.Entity<CaseAttachment>(e =>
        {
            e.HasOne(a => a.Case).WithMany(c => c.Attachments).HasForeignKey(a => a.CaseId);
        });

        modelBuilder.Entity<CaseAuditEntry>(e =>
        {
            e.HasOne(a => a.Case).WithMany(c => c.AuditHistory).HasForeignKey(a => a.CaseId);
        });

        modelBuilder.Entity<KnowledgeBaseArticle>(e =>
        {
            e.Property(a => a.Tags).HasConversion(
                v => string.Join(',', v),
                v => v.Split(',', StringSplitOptions.RemoveEmptyEntries).ToList());
        });
    }
}
