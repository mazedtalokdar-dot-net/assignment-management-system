using Assignment__Submisstion_Manegment_System_API.Data;
using Assignment__Submisstion_Manegment_System_API.Models;
using Microsoft.EntityFrameworkCore;

namespace Assignment__Submisstion_Manegment_System_API.Repositories
{
    public class SubmissionRepository : ISubmissionRepository
    {
        private readonly ApplicationDbContext _context;

        public SubmissionRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Submission>> GetByAssignmentIdAsync(string assignmentId)
        {
            // Fetch all submissions tied to a specific assignment
            return await _context.Submissions
                                 .Where(s => s.AssignmentId == assignmentId)
                                 .ToListAsync();
        }

        public async Task<Submission?> GetByIdAsync(string id)
        {
            return await _context.Submissions.FirstOrDefaultAsync(s => s.Id == id);
        }
        public async Task<IEnumerable<Submission>> GetByStudentIdAsync(string studentId)
        {
            return await _context.Submissions
                                 .Where(s => s.StudentId == studentId)
                                 .ToListAsync();
        }

        public async Task CreateAsync(Submission submission)
        {
            await _context.Submissions.AddAsync(submission);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(Submission submission)
        {
            _context.Submissions.Update(submission);
            await _context.SaveChangesAsync();
        }
    }
}