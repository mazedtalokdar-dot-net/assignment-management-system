using Assignment__Submisstion_Manegment_System_API.Data;
using Assignment__Submisstion_Manegment_System_API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;
using BCrypt.Net;
using System.Security.Claims;

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

        // GET: api/Users/me
        // Returns the current logged-in user profile, including Student/Teacher details
        [HttpGet("me")]
        [Authorize]
        public async Task<IActionResult> GetCurrentUser()
        {
            var userId = User.FindFirstValue(System.Security.Claims.ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var user = await _context.Users.FindAsync(userId);
            if (user == null) return NotFound("User account not found.");

            if (user.Role == "Student")
            {
                var studentProfile = await _context.Students.FirstOrDefaultAsync(s => s.Email.ToLower() == user.Email.ToLower());
                return Ok(new
                {
                    user.Id,
                    user.Name,
                    user.Email,
                    user.Role,
                    StudentProfile = studentProfile
                });
            }
            else if (user.Role == "Teacher" || user.Role == "Admin")
            {
                var teacherProfile = await _context.Teachers.FirstOrDefaultAsync(t => t.Email.ToLower() == user.Email.ToLower());
                return Ok(new
                {
                    user.Id,
                    user.Name,
                    user.Email,
                    user.Role,
                    TeacherProfile = teacherProfile
                });
            }

            return Ok(new
            {
                user.Id,
                user.Name,
                user.Email,
                user.Role
            });
        }

        // GET: api/Users
        // Restricted to Admin
        [HttpGet]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAllUsers()
        {
            var users = await _context.Users.ToListAsync();
            var safeUsers = users.Select(u => new
            {
                u.Id,
                u.Name,
                u.Email,
                u.Role
            });

            return Ok(safeUsers);
        }

        // POST: api/Users (Public Registration Endpoint)
        // Implements the Admin pre-registration verification flow
        [HttpPost]
        public async Task<IActionResult> RegisterUser([FromBody] RegisterPayload payload)
        {
            if (payload == null || string.IsNullOrWhiteSpace(payload.Email) || string.IsNullOrWhiteSpace(payload.PasswordHash))
            {
                return BadRequest("Invalid registration payload. Email and password are required.");
            }

            var emailNormalized = payload.Email.Trim().ToLowerInvariant();

            // 1. Check if user already exists
            var existingUser = await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == emailNormalized);
            if (existingUser != null)
            {
                return BadRequest("This email is already registered.");
            }

            string resolvedRole = "";
            string name = payload.Name;

            // 2. Check if email exists in Student collection
            var student = await _context.Students.FirstOrDefaultAsync(s => s.Email.ToLower() == emailNormalized);
            if (student != null)
            {
                resolvedRole = "Student";
                if (string.IsNullOrEmpty(name))
                {
                    name = student.Name;
                }
            }
            else
            {
                // 3. Check if email exists in Teacher collection
                var teacher = await _context.Teachers.FirstOrDefaultAsync(t => t.Email.ToLower() == emailNormalized);
                if (teacher != null)
                {
                    resolvedRole = teacher.IsAdmin ? "Admin" : "Teacher";
                    if (string.IsNullOrEmpty(name))
                    {
                        name = teacher.Name;
                    }
                }
            }

            // 4. If not found in either, reject registration
            if (string.IsNullOrEmpty(resolvedRole))
            {
                return BadRequest("Your email is not registered in the student or teacher rosters by the administration. Please contact your Admin first.");
            }

            // Hash the password using BCrypt
            var hashedPassword = BCrypt.Net.BCrypt.HashPassword(payload.PasswordHash);

            var newUser = new User
            {
                Email = payload.Email.Trim(),
                Name = name,
                Role = resolvedRole,
                PasswordHash = hashedPassword
            };

            await _context.Users.AddAsync(newUser);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Registration successful!", email = newUser.Email, role = newUser.Role });
        }
    }

    public class RegisterPayload
    {
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty; // Holds the password to be hashed
    }
}