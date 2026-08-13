using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System.ComponentModel.DataAnnotations;
using System.Collections.Generic;

namespace Assignment__Submisstion_Manegment_System_API.Models
{
    public class Teacher
    {
        [BsonId]
        public string Id { get; set; } = string.Empty; // Served as Registration Number (Primary Key)

        [Required]
        public string Name { get; set; } = string.Empty;

        [Required]
        public DateTime DateOfBirth { get; set; }

        [Required]
        public string Designation { get; set; } = string.Empty;

        public List<string> TeachesSubjectIds { get; set; } = new List<string>(); // List of subject IDs this teacher teaches

        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty; // Matches User.Email

        public bool IsAdmin { get; set; } // If true, teacher has Admin role access too
    }
}
