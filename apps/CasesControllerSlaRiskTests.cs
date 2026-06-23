using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Moq;
using OctoCare.Api.Controllers;
using OctoCare.Api.Data;
using OctoCare.Api.Models;
using OctoCare.Api.Services;
using Xunit;

namespace OctoCare.Api.Tests;

public class CasesControllerSlaRiskTests : IDisposable
{
    private readonly AppDbContext _dbContext;
    private readonly Mock<IAiService> _aiServiceMock;
    private readonly CasesController _controller;
    private readonly DateTime _now = DateTime.UtcNow;

    public CasesControllerSlaRiskTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _dbContext = new AppDbContext(options);
        _aiServiceMock = new Mock<IAiService>();
        _controller = new CasesController(_dbContext, _aiServiceMock.Object);

        SeedTestData();
    }

    /// <summary>
    /// Seed four cases that each sit in a distinct SLA risk band, plus one already-breached case.
    ///
    /// All use a 24-hour SLA window (Medium priority pattern) for easy reasoning:
    ///   Low risk    – deadline 20 h away (created 4 h ago)  → ~83 % remaining
    ///   Medium risk – deadline 8 h away  (created 16 h ago) → ~33 % remaining
    ///   High risk   – deadline 4 h away  (created 20 h ago) → ~17 % remaining
    ///   Breached    – deadline already passed                → SlaBreached = true
    /// </summary>
    private void SeedTestData()
    {
        var customer = new Customer
        {
            Id = Guid.NewGuid(),
            Name = "Test Customer",
            Email = "test@example.com",
            Tier = CustomerTier.Standard
        };
        _dbContext.Customers.Add(customer);

        _dbContext.Cases.AddRange(
            new Case
            {
                Id = Guid.NewGuid(),
                Subject = "Low risk case",
                Description = "Low",
                CustomerId = customer.Id,
                Status = CaseStatus.Open,
                Priority = CasePriority.Medium,
                CreatedAt = _now.AddHours(-4),
                SlaDeadline = _now.AddHours(20),
                SlaBreached = false
            },
            new Case
            {
                Id = Guid.NewGuid(),
                Subject = "Medium risk case",
                Description = "Medium",
                CustomerId = customer.Id,
                Status = CaseStatus.Open,
                Priority = CasePriority.Medium,
                CreatedAt = _now.AddHours(-16),
                SlaDeadline = _now.AddHours(8),
                SlaBreached = false
            },
            new Case
            {
                Id = Guid.NewGuid(),
                Subject = "High risk case",
                Description = "High",
                CustomerId = customer.Id,
                Status = CaseStatus.Open,
                Priority = CasePriority.Medium,
                CreatedAt = _now.AddHours(-20),
                SlaDeadline = _now.AddHours(4),
                SlaBreached = false
            },
            new Case
            {
                Id = Guid.NewGuid(),
                Subject = "Breached case",
                Description = "Breached",
                CustomerId = customer.Id,
                Status = CaseStatus.Open,
                Priority = CasePriority.High,
                CreatedAt = _now.AddHours(-30),
                SlaDeadline = _now.AddHours(-2),
                SlaBreached = true
            }
        );

        _dbContext.SaveChanges();
    }

    // ----- GetCases endpoint tests -----

    [Fact]
    public async Task GetCases_WithNoSlaRiskFilter_ReturnsAllCases()
    {
        var result = await _controller.GetCases(null, null, null, null);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var cases = Assert.IsAssignableFrom<IEnumerable<Case>>(ok.Value);
        Assert.Equal(4, cases.Count());
    }

    [Fact]
    public async Task GetCases_WithSlaRiskLow_ReturnsOnlyLowRiskCases()
    {
        var result = await _controller.GetCases(null, null, null, "low");

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var cases = Assert.IsAssignableFrom<IEnumerable<Case>>(ok.Value).ToList();
        Assert.Single(cases);
        Assert.Equal("Low risk case", cases[0].Subject);
    }

    [Fact]
    public async Task GetCases_WithSlaRiskMedium_ReturnsOnlyMediumRiskCases()
    {
        var result = await _controller.GetCases(null, null, null, "medium");

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var cases = Assert.IsAssignableFrom<IEnumerable<Case>>(ok.Value).ToList();
        Assert.Single(cases);
        Assert.Equal("Medium risk case", cases[0].Subject);
    }

    [Fact]
    public async Task GetCases_WithSlaRiskHigh_ReturnsHighRiskAndBreachedCases()
    {
        var result = await _controller.GetCases(null, null, null, "high");

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var cases = Assert.IsAssignableFrom<IEnumerable<Case>>(ok.Value).ToList();
        Assert.Equal(2, cases.Count);
        Assert.Contains(cases, c => c.Subject == "High risk case");
        Assert.Contains(cases, c => c.Subject == "Breached case");
    }

    [Fact]
    public async Task GetCases_WithSlaRiskCaseInsensitive_ReturnsResults()
    {
        var upper = await _controller.GetCases(null, null, null, "HIGH");
        var lower = await _controller.GetCases(null, null, null, "high");
        var mixed = await _controller.GetCases(null, null, null, "High");

        var upperCount = Assert.IsAssignableFrom<IEnumerable<Case>>(Assert.IsType<OkObjectResult>(upper.Result).Value).Count();
        var lowerCount = Assert.IsAssignableFrom<IEnumerable<Case>>(Assert.IsType<OkObjectResult>(lower.Result).Value).Count();
        var mixedCount = Assert.IsAssignableFrom<IEnumerable<Case>>(Assert.IsType<OkObjectResult>(mixed.Result).Value).Count();

        Assert.Equal(lowerCount, upperCount);
        Assert.Equal(lowerCount, mixedCount);
    }

    [Fact]
    public async Task GetCases_WithInvalidSlaRisk_ReturnsBadRequest()
    {
        var result = await _controller.GetCases(null, null, null, "critical");

        var bad = Assert.IsType<BadRequestObjectResult>(result.Result);
        var message = Assert.IsType<string>(bad.Value);
        Assert.Contains("slaRisk", message, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("low", message, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("medium", message, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("high", message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task GetCases_SlaRiskCombinedWithPriorityFilter_ReturnsIntersection()
    {
        // Only the breached case has Priority=High; the other high-risk case has Priority=Medium
        var result = await _controller.GetCases(null, "high", null, "high");

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var cases = Assert.IsAssignableFrom<IEnumerable<Case>>(ok.Value).ToList();
        Assert.Single(cases);
        Assert.Equal("Breached case", cases[0].Subject);
    }

    [Fact]
    public async Task GetCases_SlaRiskCombinedWithStatusFilter_ReturnsIntersection()
    {
        // All seeded cases have Status=Open so the intersection equals the slaRisk-only result
        var result = await _controller.GetCases("open", null, null, "low");

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var cases = Assert.IsAssignableFrom<IEnumerable<Case>>(ok.Value).ToList();
        Assert.Single(cases);
        Assert.Equal("Low risk case", cases[0].Subject);
    }

    // ----- Unit tests for ComputeSlaRisk helper -----

    [Fact]
    public void ComputeSlaRisk_WhenSlaBreachedFlagIsTrue_ReturnsHigh()
    {
        var c = MakeCase(createdHoursAgo: 48, deadlineHoursFromNow: 1, breached: true);
        Assert.Equal(SlaRisk.High, CasesController.ComputeSlaRisk(c, _now));
    }

    [Fact]
    public void ComputeSlaRisk_WhenDeadlineAlreadyPassed_ReturnsHigh()
    {
        var c = MakeCase(createdHoursAgo: 25, deadlineHoursFromNow: -1, breached: false);
        Assert.Equal(SlaRisk.High, CasesController.ComputeSlaRisk(c, _now));
    }

    [Fact]
    public void ComputeSlaRisk_WhenMoreThanHalfWindowRemaining_ReturnsLow()
    {
        // 24 h window, 20 h remaining → 83 % remaining
        var c = MakeCase(createdHoursAgo: 4, deadlineHoursFromNow: 20, breached: false);
        Assert.Equal(SlaRisk.Low, CasesController.ComputeSlaRisk(c, _now));
    }

    [Fact]
    public void ComputeSlaRisk_WhenBetween25And50PercentRemaining_ReturnsMedium()
    {
        // 24 h window, 8 h remaining → 33 % remaining
        var c = MakeCase(createdHoursAgo: 16, deadlineHoursFromNow: 8, breached: false);
        Assert.Equal(SlaRisk.Medium, CasesController.ComputeSlaRisk(c, _now));
    }

    [Fact]
    public void ComputeSlaRisk_WhenLessThan25PercentRemaining_ReturnsHigh()
    {
        // 24 h window, 4 h remaining → 17 % remaining
        var c = MakeCase(createdHoursAgo: 20, deadlineHoursFromNow: 4, breached: false);
        Assert.Equal(SlaRisk.High, CasesController.ComputeSlaRisk(c, _now));
    }

    [Fact]
    public void ComputeSlaRisk_AtExactHalfwayBoundary_ReturnsMedium()
    {
        // Exactly 50 % remaining — boundary sits in Medium (> 0.25 but NOT > 0.5)
        var c = MakeCase(createdHoursAgo: 12, deadlineHoursFromNow: 12, breached: false);
        Assert.Equal(SlaRisk.Medium, CasesController.ComputeSlaRisk(c, _now));
    }

    [Fact]
    public void ComputeSlaRisk_AtExact25PercentBoundary_ReturnsHigh()
    {
        // Exactly 25 % remaining — boundary sits in High (NOT > 0.25)
        var c = MakeCase(createdHoursAgo: 18, deadlineHoursFromNow: 6, breached: false);
        Assert.Equal(SlaRisk.High, CasesController.ComputeSlaRisk(c, _now));
    }

    // ----- Helpers -----

    private Case MakeCase(double createdHoursAgo, double deadlineHoursFromNow, bool breached) =>
        new()
        {
            CreatedAt = _now.AddHours(-createdHoursAgo),
            SlaDeadline = _now.AddHours(deadlineHoursFromNow),
            SlaBreached = breached,
            CustomerId = Guid.NewGuid(),
            Customer = null!
        };

    public void Dispose() => _dbContext.Dispose();
}
