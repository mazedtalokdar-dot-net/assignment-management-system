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
}