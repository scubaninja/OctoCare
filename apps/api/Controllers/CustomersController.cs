using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OctoCare.Api.Data;
using OctoCare.Api.Models;

namespace OctoCare.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CustomersController(AppDbContext dbContext) : ControllerBase
{
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<Customer>> GetCustomer(Guid id)
    {
        var customer = await dbContext.Customers
            .AsNoTracking()
            .Include(c => c.Cases.OrderByDescending(supportCase => supportCase.CreatedAt))
            .FirstOrDefaultAsync(c => c.Id == id);

        return customer is null ? NotFound() : Ok(customer);
    }

    [HttpGet("{id:guid}/cases")]
    public async Task<ActionResult<IEnumerable<Case>>> GetCustomerCases(Guid id)
    {
        var customerExists = await dbContext.Customers.AsNoTracking().AnyAsync(c => c.Id == id);
        if (!customerExists)
        {
            return NotFound();
        }

        var cases = await dbContext.Cases
            .AsNoTracking()
            .Where(c => c.CustomerId == id)
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync();

        return Ok(cases);
    }
}
