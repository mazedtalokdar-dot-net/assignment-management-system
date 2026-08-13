using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System.ComponentModel.DataAnnotations;

namespace Assignment__Submisstion_Manegment_System_API.Models
{
    public class Student
    {
        [BsonId]
        public string Id { get; set; } = string.Empty; // Served as Registration Number (Primary Key)

        [Required]
        public string Name { get; set; } = string.Empty;

        [Required]
        public string GuardianName { get; set; } = string.Empty;

        [Required]
        public DateTime DateOfBirth { get; set; }

        [Required]
        public string ClassCourseId { get; set; } = string.Empty; // Class student belongs to

        [Required]
        public int ClassRoll { get; set; }

        [Required]
        public string ContactNumber { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty; // Matches User.Email
    }
}
