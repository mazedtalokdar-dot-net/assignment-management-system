using Assignment__Submisstion_Manegment_System_API.Data;
using Assignment__Submisstion_Manegment_System_API.Models;
using Microsoft.EntityFrameworkCore;

namespace Assignment__Submisstion_Manegment_System_API.Repositories
{
    public class AdminRepository : IAdminRepository
    {
        private readonly ApplicationDbContext _context;

        public AdminRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        // --- Classes & Courses ---
        public async Task<IEnumerable<ClassCourse>> GetAllClassesAsync()
        {
            return await _context.ClassCourses.ToListAsync();
        }

        public async Task<ClassCourse?> GetClassByIdAsync(string id)
        {
            return await _context.ClassCourses.FirstOrDefaultAsync(c => c.Id == id);
        }

        public async Task CreateClassAsync(ClassCourse classCourse)
        {
            await _context.ClassCourses.AddAsync(classCourse);
            await _context.SaveChangesAsync();
        }

        // --- Subjects ---
        public async Task<IEnumerable<Subject>> GetAllSubjectsAsync()
        {
            return await _context.Subjects.ToListAsync();
        }

        public async Task<Subject?> GetSubjectByIdAsync(string id)
        {
            return await _context.Subjects.FirstOrDefaultAsync(s => s.Id == id);
        }

        public async Task CreateSubjectAsync(Subject subject)
        {
            await _context.Subjects.AddAsync(subject);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateSubjectAsync(Subject subject)
        {
            _context.Subjects.Update(subject);
            await _context.SaveChangesAsync();
        }

        // --- Settings ---
        public async Task<IEnumerable<ApplicationSetting>> GetAllSettingsAsync()
        {
            return await _context.ApplicationSettings.ToListAsync();
        }

        public async Task UpdateSettingAsync(ApplicationSetting setting)
        {
            // If the setting already exists, update it. Otherwise, create a new one.
            var existingSetting = await _context.ApplicationSettings.FirstOrDefaultAsync(s => s.Key == setting.Key);
            if (existingSetting != null)
            {
                existingSetting.Value = setting.Value;
                _context.ApplicationSettings.Update(existingSetting);
            }
            else
            {
                await _context.ApplicationSettings.AddAsync(setting);
            }

            await _context.SaveChangesAsync();
        }
    }
}