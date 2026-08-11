using Assignment__Submisstion_Manegment_System_API.Models;

namespace Assignment__Submisstion_Manegment_System_API.Repositories
{
    public interface IAdminRepository
    {
        // Class/Course Management
        Task<IEnumerable<ClassCourse>> GetAllClassesAsync();
        Task<ClassCourse?> GetClassByIdAsync(string id);
        Task CreateClassAsync(ClassCourse classCourse);

        // Subject & Teacher Assignment Management
        Task<IEnumerable<Subject>> GetAllSubjectsAsync();
        Task<Subject?> GetSubjectByIdAsync(string id);
        Task CreateSubjectAsync(Subject subject);
        Task UpdateSubjectAsync(Subject subject);

        // Application Settings Management
        Task<IEnumerable<ApplicationSetting>> GetAllSettingsAsync();
        Task UpdateSettingAsync(ApplicationSetting setting);
    }
}