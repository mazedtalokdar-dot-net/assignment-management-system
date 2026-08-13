using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System.ComponentModel.DataAnnotations;

namespace Assignment__Submisstion_Manegment_System_API.Models
{
    public class Assignment
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; } = ObjectId.GenerateNewId().ToString();

        [Required]
        public string Title { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;

        [Required]
        public DateTime DueDate { get; set; }

        [Required]
        [BsonRepresentation(BsonType.ObjectId)]
        public string ClassCourseId { get; set; } = string.Empty;

        [Required]
        [BsonRepresentation(BsonType.ObjectId)]
        public string SubjectId { get; set; } = string.Empty;

        [Required]
        public int MaxMarks { get; set; }

        // Can be "Draft" or "Published"
        [Required]
        public string Status { get; set; } = "Draft";

        public string TeacherId { get; set; } = string.Empty;

        public bool AllowLateSubmissions { get; set; } = false;
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}