using Assignment__Submisstion_Manegment_System_API.Models;

namespace Assignment__Submisstion_Manegment_System_API.Repositories
{
    public interface ISubmissionRepository
    {
        Task<IEnumerable<Submission>> GetByAssignmentIdAsync(string assignmentId);
        Task<Submission?> GetByIdAsync(string id);
        Task<IEnumerable<Submission>> GetByStudentIdAsync(string studentId);
        Task CreateAsync(Submission submission);
        Task UpdateAsync(Submission submission);
    }
}