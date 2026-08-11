using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System.ComponentModel.DataAnnotations;

namespace Assignment__Submisstion_Manegment_System_API.Models
{
    public class ApplicationSetting
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; } = ObjectId.GenerateNewId().ToString();

        [Required]
        public string Key { get; set; } = string.Empty; // e.g., "AllowLateSubmissions", "MaintenanceMode"

        [Required]
        public string Value { get; set; } = string.Empty; // e.g., "true", "false"
    }
}