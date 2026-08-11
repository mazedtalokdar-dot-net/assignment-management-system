using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System.ComponentModel.DataAnnotations;

namespace Assignment__Submisstion_Manegment_System_API.Models
{
    public class Subject
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; } = ObjectId.GenerateNewId().ToString();

        [Required]
        public string Name { get; set; } = string.Empty;

        [Required]
        [BsonRepresentation(BsonType.ObjectId)]
        public string ClassCourseId { get; set; } = string.Empty;

        // Nullable because a subject might be created before a teacher is assigned
        [BsonRepresentation(BsonType.ObjectId)]
        public string? AssignedTeacherId { get; set; }
    }
}