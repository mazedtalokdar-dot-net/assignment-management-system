using System.ComponentModel.DataAnnotations;

namespace Assignment__Submisstion_Manegment_System_API.DTOs
{
    public class AssignmentCreateDto
    {
        [Required]
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        [Required]
        public DateTime DueDate { get; set; }
        [Required]
        public string ClassCourseId { get; set; } = string.Empty;
        [Required]
        public string SubjectId { get; set; } = string.Empty;
        [Required]
        public int MaxMarks { get; set; }
        [Required]
        public string Status { get; set; } = "Draft"; // Allow teacher to specify Draft or Published
    }

    public class AssignmentUpdateDto
    {
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public DateTime DueDate { get; set; }
        public int MaxMarks { get; set; }
        public string Status { get; set; } = string.Empty;
    }
}