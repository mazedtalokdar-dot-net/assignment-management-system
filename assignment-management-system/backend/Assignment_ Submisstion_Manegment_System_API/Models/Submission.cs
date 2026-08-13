using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System.ComponentModel.DataAnnotations;

namespace Assignment__Submisstion_Manegment_System_API.Models
{
    public class Submission
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; } = ObjectId.GenerateNewId().ToString();

        [Required]
        [BsonRepresentation(BsonType.ObjectId)]
        public string AssignmentId { get; set; } = string.Empty;

        [Required]
        public string StudentId { get; set; } = string.Empty;

        [Required]
        public string Content { get; set; } = string.Empty; // This could be a text answer or a URL to a file

        public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;

        // Nullable because it won't have a grade when first submitted
        public int? Marks { get; set; }
        public string? Feedback { get; set; }

        public string Status { get; set; } = "Pending"; // e.g., Pending, Graded
    }
}
