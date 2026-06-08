namespace OctoCare.Api.Models;

public enum CustomerTier { Standard, Premium, Enterprise }

public class Customer
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public CustomerTier Tier { get; set; } = CustomerTier.Standard;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public List<Case> Cases { get; set; } = new();
}
