using Assignment__Submisstion_Manegment_System_API.Data;
using Assignment__Submisstion_Manegment_System_API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Assignment__Submisstion_Manegment_System_API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UsersController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public UsersController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/Users
        [HttpGet]
        [Authorize(Roles = "Teacher,Admin")]
        public async Task<IActionResult> GetAllUsers()
        {
            // Assuming your DbContext variable is named _context
            var users = await _context.Users.ToListAsync();

            // We select only non-sensitive data so we don't accidentally send password hashes to the frontend!
            var safeUsers = users.Select(u => new
            {
                u.Id,
                u.Name,
                u.Email,
                u.Role
            });

            return Ok(safeUsers);
        }
        // POST: api/users
        [HttpPost]
        public async Task<ActionResult<User>> CreateUser(User user)
        {
            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            // Returns a 201 Created response
            return CreatedAtAction(nameof(GetAllUsers), new { id = user.Id }, user);
        }
    }
}