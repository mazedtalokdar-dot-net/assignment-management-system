using Assignment__Submisstion_Manegment_System_API.Data;
using Assignment__Submisstion_Manegment_System_API.DTOs;
using Assignment__Submisstion_Manegment_System_API.Models;
using Assignment__Submisstion_Manegment_System_API.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Assignment__Submisstion_Manegment_System_API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class AssignmentsController : ControllerBase
    {
        private readonly IAssignmentRepository _repository;
        private readonly ApplicationDbContext _context;

        public AssignmentsController(IAssignmentRepository repository, ApplicationDbContext context)
        {
            _repository = repository;
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var assignments = await _repository.GetAllAsync();
            return Ok(assignments);
        }

        [HttpPost]
        [Authorize(Roles = "Teacher,Admin")]
        public async Task<IActionResult> Create([FromBody] AssignmentCreateDto dto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var userRole = User.FindFirstValue(ClaimTypes.Role);
            if (userRole == "Teacher")
            {
                var user = await _context.Users.FindAsync(userId);
                if (user == null) return Unauthorized();

                var teacherProfile = await _context.Teachers.FirstOrDefaultAsync(t => t.Email.ToLower() == user.Email.ToLower());
                if (teacherProfile == null)
                {
                    return Forbid("Teacher profile not found.");
                }

                var subject = await _context.Subjects.FindAsync(dto.SubjectId);
                if (subject == null)
                {
                    return NotFound("Subject not found.");
                }

                if (subject.AssignedTeacherId != teacherProfile.Id)
                {
                    return Forbid("You can only create assignments for subjects assigned to you.");
                }
            }

            var assignment = new Assignment
            {
                Title = dto.Title,
                Description = dto.Description,
                DueDate = dto.DueDate,
                ClassCourseId = dto.ClassCourseId,
                SubjectId = dto.SubjectId,
                MaxMarks = dto.MaxMarks,
                Status = dto.Status, // Published or Draft
                TeacherId = userId,
                AllowLateSubmissions = false, // Default to false when created by teacher
                CreatedAt = DateTime.UtcNow
            };

            await _repository.CreateAsync(assignment);
            return Ok(assignment);
        }

        // NEW: Update an assignment (e.g., change from Draft to Published)
        [HttpPut("{id}")]
        [Authorize(Roles = "Teacher,Admin")]
        public async Task<IActionResult> Update(string id, [FromBody] AssignmentUpdateDto dto)
        {
            var assignment = await _repository.GetByIdAsync(id);
            if (assignment == null) return NotFound("Assignment not found.");

            // Optional: Ensure the teacher updating it is the one who created it
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (User.FindFirstValue(ClaimTypes.Role) == "Teacher")
            {
                if (assignment.TeacherId != userId)
                {
                    return Forbid("You can only update your own assignments.");
                }

                var user = await _context.Users.FindAsync(userId);
                if (user == null) return Unauthorized();

                var teacherProfile = await _context.Teachers.FirstOrDefaultAsync(t => t.Email.ToLower() == user.Email.ToLower());
                if (teacherProfile == null)
                {
                    return Forbid("Teacher profile not found.");
                }

                var subject = await _context.Subjects.FindAsync(assignment.SubjectId);
                if (subject == null)
                {
                    return NotFound("Subject not found.");
                }

                if (subject.AssignedTeacherId != teacherProfile.Id)
                {
                    return Forbid("You can only update assignments for subjects assigned to you.");
                }
            }

            assignment.Title = dto.Title;
            assignment.Description = dto.Description;
            assignment.DueDate = dto.DueDate;
            assignment.MaxMarks = dto.MaxMarks;
            assignment.Status = dto.Status;

            await _repository.UpdateAsync(assignment);
            return Ok(assignment);
        }
        // GET: api/Assignments/{id}
        // View assignment details and deadline
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(string id)
        {
            var assignment = await _repository.GetByIdAsync(id);
            if (assignment == null) return NotFound("Assignment not found.");

            return Ok(assignment);
        }

        // GET: api/Assignments/class/{classCourseId}
        // View assignments assigned to their class/course
        [HttpGet("class/{classCourseId}")]
        public async Task<IActionResult> GetByClass(string classCourseId)
        {
            var assignments = await _repository.GetByClassCourseIdAsync(classCourseId);
            return Ok(assignments);
        }

        // NEW: Delete an assignment
        [HttpDelete("{id}")]
        [Authorize(Roles = "Teacher,Admin")]
        public async Task<IActionResult> Delete(string id)
        {
            var assignment = await _repository.GetByIdAsync(id);
            if (assignment == null) return NotFound("Assignment not found.");

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (User.FindFirstValue(ClaimTypes.Role) == "Teacher" && assignment.TeacherId != userId)
            {
                return Forbid("You can only delete your own assignments.");
            }

            await _repository.DeleteAsync(id);
            return Ok(new { message = "Assignment deleted successfully." });
        }
    }
}