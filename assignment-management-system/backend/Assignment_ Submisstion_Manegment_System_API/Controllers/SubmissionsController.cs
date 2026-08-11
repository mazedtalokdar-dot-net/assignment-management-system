using Assignment__Submisstion_Manegment_System_API.DTOs;
using Assignment__Submisstion_Manegment_System_API.Models;
using Assignment__Submisstion_Manegment_System_API.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Assignment__Submisstion_Manegment_System_API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize] // Requires authentication for everything inside
    public class SubmissionsController : ControllerBase
    {
        private readonly ISubmissionRepository _submissionRepo;
        private readonly IAssignmentRepository _assignmentRepo;

        // We inject both repositories so we can verify an assignment exists before submitting to it
        public SubmissionsController(ISubmissionRepository submissionRepo, IAssignmentRepository assignmentRepo)
        {
            _submissionRepo = submissionRepo;
            _assignmentRepo = assignmentRepo;
        }

        // POST: api/Submissions
        // ONLY Students can submit assignments
        [HttpPost]
        [Authorize(Roles = "Student")]
        public async Task<IActionResult> SubmitAssignment([FromBody] SubmissionCreateDto dto)
        {
            // Verify the assignment actually exists
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
        [HttpGet("assignment/{assignmentId}")]
        [Authorize(Roles = "Teacher,Admin")]
        public async Task<IActionResult> GetSubmissionsForAssignment(string assignmentId)
        {
            var submissions = await _submissionRepo.GetByAssignmentIdAsync(assignmentId);
            return Ok(submissions);
        }

        // PUT: api/Submissions/{id}/grade
        // ONLY Teachers and Admins can grade submissions
        // PUT: api/Submissions/{id}/grade
        [HttpPut("{id}/grade")]
        [Authorize(Roles = "Teacher,Admin")]
        public async Task<IActionResult> GradeSubmission(string id, [FromBody] SubmissionGradeDto dto)
        {
            var submission = await _submissionRepo.GetByIdAsync(id);
            if (submission == null)
            {
                return NotFound("Submission not found.");
            }

            submission.Marks = dto.Marks;
            submission.Feedback = dto.Feedback; // NEW: Adding feedback
            submission.Status = dto.Status;     // NEW: Allowing custom status

            await _submissionRepo.UpdateAsync(submission);

            return Ok(submission);
        }
        // GET: api/Submissions/my-submissions
        // View submission status, marks, and teacher feedback
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
        // Update a submission before the deadline
        [HttpPut("{id}")]
        [Authorize(Roles = "Student")]
        public async Task<IActionResult> UpdateSubmission(string id, [FromBody] SubmissionUpdateDto dto)
        {
            var submission = await _submissionRepo.GetByIdAsync(id);
            if (submission == null) return NotFound("Submission not found.");

            // Verify this submission belongs to the logged-in student
            var studentId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (submission.StudentId != studentId)
            {
                return Forbid("You can only update your own submissions.");
            }

            // Verify the assignment deadline hasn't passed
            var assignment = await _assignmentRepo.GetByIdAsync(submission.AssignmentId);
            if (assignment == null) return NotFound("Assignment no longer exists.");

            if (DateTime.UtcNow > assignment.DueDate)
            {
                return BadRequest("The deadline for this assignment has passed. You can no longer update your submission.");
            }

            // Update the content and timestamp
            submission.Content = dto.Content;
            submission.SubmittedAt = DateTime.UtcNow;

            // Optional: If the teacher already graded it but allowed a resubmission, reset the status to pending
            submission.Status = "Pending";
            submission.Marks = null;
            submission.Feedback = string.Empty;

            await _submissionRepo.UpdateAsync(submission);

            return Ok(submission);
        }
    }
}
