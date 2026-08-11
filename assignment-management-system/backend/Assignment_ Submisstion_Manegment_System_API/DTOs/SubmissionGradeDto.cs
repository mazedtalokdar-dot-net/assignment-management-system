using System.ComponentModel.DataAnnotations;

namespace Assignment__Submisstion_Manegment_System_API.DTOs
{
    public class SubmissionGradeDto
    {
        [Required]
        public int Marks { get; set; }

        public string Feedback { get; set; } = string.Empty;

        // e.g., "Graded", "Needs Revision", "Late"
        [Required]
        public string Status { get; set; } = "Graded";
    }
}