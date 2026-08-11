using System.ComponentModel.DataAnnotations;

namespace Assignment__Submisstion_Manegment_System_API.DTOs
{
    public class SubmissionCreateDto
    {
        [Required]
        public string AssignmentId { get; set; } = string.Empty;

        [Required]
        public string Content { get; set; } = string.Empty;
    }
}