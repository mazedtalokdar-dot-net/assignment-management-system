using Assignment__Submisstion_Manegment_System_API.Data;
using Assignment__Submisstion_Manegment_System_API.Models;
using Microsoft.EntityFrameworkCore;

namespace Assignment__Submisstion_Manegment_System_API.Repositories
{
    public class AssignmentRepository : IAssignmentRepository
    {
        private readonly ApplicationDbContext _context;

        public AssignmentRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Assignment>> GetAllAsync()
        {
            return await _context.Assignments.ToListAsync();
        }

        public async Task<Assignment?> GetByIdAsync(string id)
        {
            return await _context.Assignments.FirstOrDefaultAsync(a => a.Id == id);
        }
        public async Task<IEnumerable<Assignment>> GetByClassCourseIdAsync(string classCourseId)
        {
            // Only return Published assignments to students
            return await _context.Assignments
                                 .Where(a => a.ClassCourseId == classCourseId && a.Status == "Published")
                                 .ToListAsync();
        }

        public async Task CreateAsync(Assignment assignment)
        {
            await _context.Assignments.AddAsync(assignment);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(Assignment assignment)
        {
            _context.Assignments.Update(assignment);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(string id)
        {
            var assignment = await GetByIdAsync(id);
            if (assignment != null)
            {
                _context.Assignments.Remove(assignment);
                await _context.SaveChangesAsync();
            }
        }
    }
}