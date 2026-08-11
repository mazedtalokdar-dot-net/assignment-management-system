using System.ComponentModel.DataAnnotations;

namespace Assignment__Submisstion_Manegment_System_API.DTOs
{
    public class SubmissionUpdateDto
    {
        [Required]
        public string Content { get; set; } = string.Empty;
    }
}