using Assignment__Submisstion_Manegment_System_API.Data;
using Assignment__Submisstion_Manegment_System_API.DTOs;
using Assignment__Submisstion_Manegment_System_API.Models;
using Assignment__Submisstion_Manegment_System_API.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;

namespace Assignment__Submisstion_Manegment_System_API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class SubmissionsController : ControllerBase
    {
        private readonly ISubmissionRepository _submissionRepo;
        private readonly IAssignmentRepository _assignmentRepo;
        private readonly ApplicationDbContext _context;

        public SubmissionsController(ISubmissionRepository submissionRepo, IAssignmentRepository assignmentRepo, ApplicationDbContext context)
        {
            _submissionRepo = submissionRepo;
            _assignmentRepo = assignmentRepo;
            _context = context;
        }

        // POST: api/Submissions
        // ONLY Students can submit assignments
        [HttpPost]
        [Authorize(Roles = "Student")]
        public async Task<IActionResult> SubmitAssignment([FromBody] SubmissionCreateDto dto)
        {
            var assignment = await _assignmentRepo.GetByIdAsync(dto.AssignmentId);
            if (assignment == null)
            {
                return NotFound("Assignment not found.");
            }

            var studentId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(studentId))
            {
                return Unauthorized("Student ID not found in token.");
            }

            // Verify the assignment deadline based on assignment setting
            if (!assignment.AllowLateSubmissions && DateTime.UtcNow > assignment.DueDate)
            {
                return BadRequest("The deadline for this assignment has passed and late submissions are disabled.");
            }

            // Check if student has already submitted
            var existingSub = await _submissionRepo.GetByStudentIdAsync(studentId);
            var subForThisAssignment = System.Linq.Enumerable.FirstOrDefault(existingSub, s => s.AssignmentId == dto.AssignmentId);
            if (subForThisAssignment != null)
            {
                return BadRequest("You have already submitted this assignment. Use update instead.");
            }

            var submission = new Submission
            {
                AssignmentId = dto.AssignmentId,
                StudentId = studentId,
                Content = dto.Content,
                SubmittedAt = DateTime.UtcNow,
                Status = "Pending"
            };

            await _submissionRepo.CreateAsync(submission);
            return Ok(submission);
        }

        // GET: api/Submissions/assignment/{assignmentId}
        // ONLY Teachers and Admins can view submissions for an assignment
        // Enriched with Student profile details (Name, ClassRoll, Registration)
        [HttpGet("assignment/{assignmentId}")]
        [Authorize(Roles = "Teacher,Admin")]
        public async Task<IActionResult> GetSubmissionsForAssignment(string assignmentId)
        {
            var submissions = await _submissionRepo.GetByAssignmentIdAsync(assignmentId);

            var enrichedSubmissions = new List<object>();
            foreach (var sub in submissions)
            {
                var user = await _context.Users.FindAsync(sub.StudentId);
                Student? student = null;
                if (user != null)
                {
                    student = await _context.Students.FirstOrDefaultAsync(s => s.Email.ToLower() == user.Email.ToLower());
                }

                enrichedSubmissions.Add(new
                {
                    sub.Id,
                    sub.AssignmentId,
                    sub.StudentId,
                    sub.Content,
                    sub.SubmittedAt,
                    sub.Status,
                    sub.Marks,
                    sub.Feedback,
                    StudentName = student?.Name ?? user?.Name ?? "Unknown Student",
                    StudentRoll = student?.ClassRoll.ToString() ?? "N/A",
                    StudentRegNo = student?.Id ?? "N/A",
                    StudentContact = student?.ContactNumber ?? "N/A"
                });
            }

            return Ok(enrichedSubmissions);
        }

        // PUT: api/Submissions/{id}/grade
        // ONLY Teachers and Admins can grade submissions
        [HttpPut("{id}/grade")]
        [Authorize(Roles = "Teacher,Admin")]
        public async Task<IActionResult> GradeSubmission(string id, [FromBody] SubmissionGradeDto dto)
        {
            var submission = await _submissionRepo.GetByIdAsync(id);
            if (submission == null)
            {
                return NotFound("Submission not found.");
            }

            var assignment = await _assignmentRepo.GetByIdAsync(submission.AssignmentId);
            if (assignment == null)
            {
                return NotFound("Associated assignment not found.");
            }

            if (dto.Marks > assignment.MaxMarks)
            {
                return BadRequest($"Marks cannot exceed the maximum marks of {assignment.MaxMarks} for this assignment.");
            }

            submission.Marks = dto.Marks;
            submission.Feedback = dto.Feedback;
            submission.Status = dto.Status;

            await _submissionRepo.UpdateAsync(submission);
            return Ok(submission);
        }

        // GET: api/Submissions/my-submissions
        [HttpGet("my-submissions")]
        [Authorize(Roles = "Student")]
        public async Task<IActionResult> GetMySubmissions()
        {
            var studentId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(studentId)) return Unauthorized();

            var submissions = await _submissionRepo.GetByStudentIdAsync(studentId);
            return Ok(submissions);
        }

        // PUT: api/Submissions/{id}
        // Update a submission (before deadline, or always if allowed by Admin)
        [HttpPut("{id}")]
        [Authorize(Roles = "Student")]
        public async Task<IActionResult> UpdateSubmission(string id, [FromBody] SubmissionUpdateDto dto)
        {
            var submission = await _submissionRepo.GetByIdAsync(id);
            if (submission == null) return NotFound("Submission not found.");

            var studentId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (submission.StudentId != studentId)
            {
                return Forbid("You can only update your own submissions.");
            }

            var assignment = await _assignmentRepo.GetByIdAsync(submission.AssignmentId);
            if (assignment == null) return NotFound("Assignment no longer exists.");

            // Prevent updating graded submissions
            if (submission.Status == "Graded")
            {
                return BadRequest("This submission has already been graded and cannot be updated.");
            }

            // Check if late submissions are allowed for this assignment
            if (!assignment.AllowLateSubmissions && DateTime.UtcNow > assignment.DueDate)
            {
                return BadRequest("The deadline for this assignment has passed and late submissions are disabled. You can no longer update your submission.");
            }

            submission.Content = dto.Content;
            submission.SubmittedAt = DateTime.UtcNow;

            // Reset grading status on resubmission
            submission.Status = "Pending";
            submission.Marks = null;
            submission.Feedback = string.Empty;

            await _submissionRepo.UpdateAsync(submission);
            return Ok(submission);
        }
    }
}
