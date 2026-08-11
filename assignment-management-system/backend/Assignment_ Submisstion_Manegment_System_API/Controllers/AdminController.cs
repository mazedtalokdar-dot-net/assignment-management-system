using Assignment__Submisstion_Manegment_System_API.DTOs;
using Assignment__Submisstion_Manegment_System_API.Models;
using Assignment__Submisstion_Manegment_System_API.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Assignment__Submisstion_Manegment_System_API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize] // Strictly locks this ENTIRE controller to Admins only
    public class AdminController : ControllerBase
    {
        private readonly IAdminRepository _adminRepo;

        public AdminController(IAdminRepository adminRepo)
        {
            _adminRepo = adminRepo;
        }

        // --- Classes & Courses ---
        
        [HttpGet("classes")]
        [Authorize(Roles = "Admin,Teacher, Student")]
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

            // Note: In a production app, you might also want to query the Users collection 
            // here to verify that the provided TeacherId actually belongs to a user with the "Teacher" role.
            subject.AssignedTeacherId = dto.TeacherId;

            await _adminRepo.UpdateSubjectAsync(subject);
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
    }
}