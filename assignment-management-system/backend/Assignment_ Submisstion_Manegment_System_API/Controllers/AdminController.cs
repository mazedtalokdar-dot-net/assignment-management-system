using Assignment__Submisstion_Manegment_System_API.Data;
using Assignment__Submisstion_Manegment_System_API.DTOs;
using Assignment__Submisstion_Manegment_System_API.Models;
using Assignment__Submisstion_Manegment_System_API.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Assignment__Submisstion_Manegment_System_API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize] // Enforce authorization
    public class AdminController : ControllerBase
    {
        private readonly IAdminRepository _adminRepo;
        private readonly ApplicationDbContext _context;

        public AdminController(IAdminRepository adminRepo, ApplicationDbContext context)
        {
            _adminRepo = adminRepo;
            _context = context;
        }

        // --- Classes & Courses ---
        
        [HttpGet("classes")]
        [Authorize(Roles = "Admin,Teacher,Student")]
        public async Task<IActionResult> GetClasses()
        {
            var classes = await _adminRepo.GetAllClassesAsync();
            return Ok(classes);
        }

        [HttpPost("classes")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CreateClass([FromBody] ClassCourseCreateDto dto)
        {
            var newClass = new ClassCourse
            {
                Name = dto.Name,
                Description = dto.Description
            };

            await _adminRepo.CreateClassAsync(newClass);
            return Ok(newClass);
        }

        // --- Subjects ---

        [HttpGet("subjects")]
        [Authorize(Roles = "Admin,Teacher,Student")]
        public async Task<IActionResult> GetSubjects()
        {
            var subjects = await _adminRepo.GetAllSubjectsAsync();
            return Ok(subjects);
        }

        [HttpPost("subjects")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CreateSubject([FromBody] SubjectCreateDto dto)
        {
            var newSubject = new Subject
            {
                Name = dto.Name,
                ClassCourseId = dto.ClassCourseId
            };

            await _adminRepo.CreateSubjectAsync(newSubject);
            return Ok(newSubject);
        }

        [HttpPut("subjects/{id}/assign-teacher")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> AssignTeacher(string id, [FromBody] AssignTeacherDto dto)
        {
            var subject = await _adminRepo.GetSubjectByIdAsync(id);
            if (subject == null)
            {
                return NotFound("Subject not found.");
            }

            // Verify that the provided TeacherId actually belongs to a user/teacher
            var teacherProfile = await _context.Teachers.FirstOrDefaultAsync(t => t.Id == dto.TeacherId);
            if (teacherProfile == null)
            {
                return NotFound("Teacher not found with the specified Registration ID.");
            }

            // Assign subject to teacher
            subject.AssignedTeacherId = dto.TeacherId;
            await _adminRepo.UpdateSubjectAsync(subject);

            // Keep teacher profile updated as well
            if (!teacherProfile.TeachesSubjectIds.Contains(id))
            {
                teacherProfile.TeachesSubjectIds.Add(id);
                _context.Teachers.Update(teacherProfile);
                await _context.SaveChangesAsync();
            }

            return Ok(subject);
        }

        // --- Settings ---

        [HttpGet("settings")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetSettings()
        {
            var settings = await _adminRepo.GetAllSettingsAsync();
            return Ok(settings);
        }

        [HttpPut("settings")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateSetting([FromBody] SettingUpdateDto dto)
        {
            var setting = new ApplicationSetting
            {
                Key = dto.Key,
                Value = dto.Value
            };

            await _adminRepo.UpdateSettingAsync(setting);
            return Ok(setting);
        }

        // --- Student Management (CRUD) ---

        [HttpGet("students")]
        [Authorize(Roles = "Admin,Teacher")]
        public async Task<IActionResult> GetAllStudents()
        {
            var students = await _context.Students.ToListAsync();
            return Ok(students);
        }

        [HttpPost("students")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CreateStudent([FromBody] StudentCreateDto dto)
        {
            if (dto == null) return BadRequest();

            // Validate unique registration ID
            var existingReg = await _context.Students.FirstOrDefaultAsync(s => s.Id.ToLower() == dto.Id.Trim().ToLower());
            if (existingReg != null)
            {
                return BadRequest($"A student with registration ID '{dto.Id}' already exists.");
            }

            // Validate unique email
            var existingEmail = await _context.Students.FirstOrDefaultAsync(s => s.Email.ToLower() == dto.Email.Trim().ToLower());
            if (existingEmail != null)
            {
                return BadRequest($"A student with email '{dto.Email}' already exists.");
            }

            // Validate unique ClassRoll within ClassCourseId
            var existingRoll = await _context.Students.FirstOrDefaultAsync(s => s.ClassCourseId == dto.ClassCourseId && s.ClassRoll == dto.ClassRoll);
            if (existingRoll != null)
            {
                return BadRequest($"Roll number {dto.ClassRoll} is already taken in this class course.");
            }

            var student = new Student
            {
                Id = dto.Id.Trim(),
                Name = dto.Name.Trim(),
                GuardianName = dto.GuardianName.Trim(),
                DateOfBirth = dto.DateOfBirth,
                ClassCourseId = dto.ClassCourseId,
                ClassRoll = dto.ClassRoll,
                ContactNumber = dto.ContactNumber.Trim(),
                Email = dto.Email.Trim().ToLowerInvariant()
            };

            await _context.Students.AddAsync(student);
            await _context.SaveChangesAsync();

            return Created("", student);
        }

        [HttpPut("students/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateStudent(string id, [FromBody] StudentUpdateDto dto)
        {
            if (dto == null) return BadRequest();

            var student = await _context.Students.FirstOrDefaultAsync(s => s.Id == id);
            if (student == null) return NotFound("Student not found.");

            // Validate unique ClassRoll within ClassCourseId if class or roll changes
            if (student.ClassCourseId != dto.ClassCourseId || student.ClassRoll != dto.ClassRoll)
            {
                var existingRoll = await _context.Students.FirstOrDefaultAsync(s => s.ClassCourseId == dto.ClassCourseId && s.ClassRoll == dto.ClassRoll && s.Id != id);
                if (existingRoll != null)
                {
                    return BadRequest($"Roll number {dto.ClassRoll} is already taken in this class course.");
                }
            }

            student.Name = dto.Name.Trim();
            student.GuardianName = dto.GuardianName.Trim();
            student.DateOfBirth = dto.DateOfBirth;
            student.ClassCourseId = dto.ClassCourseId;
            student.ClassRoll = dto.ClassRoll;
            student.ContactNumber = dto.ContactNumber.Trim();

            _context.Students.Update(student);

            // Update corresponding User login name if registered
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == student.Email.ToLower());
            if (user != null)
            {
                user.Name = student.Name;
                _context.Users.Update(user);
            }

            await _context.SaveChangesAsync();
            return Ok(student);
        }

        [HttpDelete("students/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteStudent(string id)
        {
            var student = await _context.Students.FirstOrDefaultAsync(s => s.Id == id);
            if (student == null) return NotFound("Student not found.");

            _context.Students.Remove(student);

            // Remove corresponding User login account
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == student.Email.ToLower());
            if (user != null)
            {
                _context.Users.Remove(user);
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Student profile deleted successfully." });
        }

        // --- Teacher Management (CRUD) ---

        [HttpGet("teachers")]
        [Authorize(Roles = "Admin,Teacher")]
        public async Task<IActionResult> GetAllTeachers()
        {
            var teachers = await _context.Teachers.ToListAsync();
            return Ok(teachers);
        }

        [HttpPost("teachers")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CreateTeacher([FromBody] TeacherCreateDto dto)
        {
            if (dto == null) return BadRequest();

            // Validate unique registration ID
            var existingReg = await _context.Teachers.FirstOrDefaultAsync(t => t.Id.ToLower() == dto.Id.Trim().ToLower());
            if (existingReg != null)
            {
                return BadRequest($"A teacher with registration ID '{dto.Id}' already exists.");
            }

            // Validate unique email
            var existingEmail = await _context.Teachers.FirstOrDefaultAsync(t => t.Email.ToLower() == dto.Email.Trim().ToLower());
            if (existingEmail != null)
            {
                return BadRequest($"A teacher with email '{dto.Email}' already exists.");
            }

            var teacher = new Teacher
            {
                Id = dto.Id.Trim(),
                Name = dto.Name.Trim(),
                DateOfBirth = dto.DateOfBirth,
                Designation = dto.Designation.Trim(),
                Email = dto.Email.Trim().ToLowerInvariant(),
                IsAdmin = dto.IsAdmin
            };

            await _context.Teachers.AddAsync(teacher);
            await _context.SaveChangesAsync();

            return Created("", teacher);
        }

        [HttpPut("teachers/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateTeacher(string id, [FromBody] TeacherUpdateDto dto)
        {
            if (dto == null) return BadRequest();

            var teacher = await _context.Teachers.FirstOrDefaultAsync(t => t.Id == id);
            if (teacher == null) return NotFound("Teacher not found.");

            teacher.Name = dto.Name.Trim();
            teacher.DateOfBirth = dto.DateOfBirth;
            teacher.Designation = dto.Designation.Trim();
            teacher.IsAdmin = dto.IsAdmin;

            _context.Teachers.Update(teacher);

            // Update corresponding User login details if registered
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == teacher.Email.ToLower());
            if (user != null)
            {
                user.Name = teacher.Name;
                user.Role = teacher.IsAdmin ? "Admin" : "Teacher";
                _context.Users.Update(user);
            }

            await _context.SaveChangesAsync();
            return Ok(teacher);
        }

        [HttpDelete("teachers/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteTeacher(string id)
        {
            var teacher = await _context.Teachers.FirstOrDefaultAsync(t => t.Id == id);
            if (teacher == null) return NotFound("Teacher not found.");

            _context.Teachers.Remove(teacher);

            // Remove corresponding User login account
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == teacher.Email.ToLower());
            if (user != null)
            {
                _context.Users.Remove(user);
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Teacher profile deleted successfully." });
        }

        // --- Assignments & Submissions (Admin Global View) ---

        [HttpGet("assignments")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAllAssignments()
        {
            var assignments = await _context.Assignments.ToListAsync();
            return Ok(assignments);
        }

        [HttpPut("assignments/{id}/toggle-late-submission")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> ToggleLateSubmission(string id, [FromBody] ToggleLateSubmissionsDto dto)
        {
            var assignment = await _context.Assignments.FindAsync(id);
            if (assignment == null)
            {
                return NotFound("Assignment not found.");
            }

            assignment.AllowLateSubmissions = dto.AllowLate;
            _context.Assignments.Update(assignment);
            await _context.SaveChangesAsync();

            return Ok(assignment);
        }

        [HttpGet("submissions")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAllSubmissions()
        {
            var submissions = await _context.Submissions.ToListAsync();
            return Ok(submissions);
        }
    }
}