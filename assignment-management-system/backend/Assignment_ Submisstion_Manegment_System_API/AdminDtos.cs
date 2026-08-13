using System.ComponentModel.DataAnnotations;

namespace Assignment__Submisstion_Manegment_System_API.DTOs
{
    public class ClassCourseCreateDto
    {
        [Required]
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
    }

    public class SubjectCreateDto
    {
        [Required]
        public string Name { get; set; } = string.Empty;

        [Required]
        public string ClassCourseId { get; set; } = string.Empty;
    }

    public class AssignTeacherDto
    {
        [Required]
        public string TeacherId { get; set; } = string.Empty;
    }

    public class SettingUpdateDto
    {
        [Required]
        public string Key { get; set; } = string.Empty;

        [Required]
        public string Value { get; set; } = string.Empty;
    }

    public class StudentCreateDto
    {
        [Required]
        public string Id { get; set; } = string.Empty; // Registration Number
        
        [Required]
        public string Name { get; set; } = string.Empty;
        
        [Required]
        public string GuardianName { get; set; } = string.Empty;
        
        [Required]
        public DateTime DateOfBirth { get; set; }
        
        [Required]
        public string ClassCourseId { get; set; } = string.Empty;
        
        [Required]
        public int ClassRoll { get; set; }
        
        [Required]
        public string ContactNumber { get; set; } = string.Empty;
        
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;
    }

    public class StudentUpdateDto
    {
        [Required]
        public string Name { get; set; } = string.Empty;
        
        [Required]
        public string GuardianName { get; set; } = string.Empty;
        
        [Required]
        public DateTime DateOfBirth { get; set; }
        
        [Required]
        public string ClassCourseId { get; set; } = string.Empty;
        
        [Required]
        public int ClassRoll { get; set; }
        
        [Required]
        public string ContactNumber { get; set; } = string.Empty;
    }

    public class TeacherCreateDto
    {
        [Required]
        public string Id { get; set; } = string.Empty; // Registration Number
        
        [Required]
        public string Name { get; set; } = string.Empty;
        
        [Required]
        public DateTime DateOfBirth { get; set; }
        
        [Required]
        public string Designation { get; set; } = string.Empty;
        
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;
        
        public bool IsAdmin { get; set; }
    }

    public class TeacherUpdateDto
    {
        [Required]
        public string Name { get; set; } = string.Empty;
        
        [Required]
        public DateTime DateOfBirth { get; set; }
        
        [Required]
        public string Designation { get; set; } = string.Empty;
        
        public bool IsAdmin { get; set; }
    }

    public class ToggleLateSubmissionsDto
    {
        [Required]
        public bool AllowLate { get; set; }
    }
}