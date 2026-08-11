using Assignment__Submisstion_Manegment_System_API.Models;

namespace Assignment__Submisstion_Manegment_System_API.Repositories
{
    public interface IAssignmentRepository
    {
        Task<IEnumerable<Assignment>> GetAllAsync();
        Task<Assignment?> GetByIdAsync(string id);
        Task<IEnumerable<Assignment>> GetByClassCourseIdAsync(string classCourseId);
        Task CreateAsync(Assignment assignment);
        Task UpdateAsync(Assignment assignment);
        Task DeleteAsync(string id);
    }
}
