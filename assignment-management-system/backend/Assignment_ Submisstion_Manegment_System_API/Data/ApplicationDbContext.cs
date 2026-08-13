using Assignment__Submisstion_Manegment_System_API.Models;
using Microsoft.EntityFrameworkCore;
using MongoDB.EntityFrameworkCore.Extensions;

namespace Assignment__Submisstion_Manegment_System_API.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        // This DbSet maps to the "Users" collection in MongoDB
        public DbSet<User> Users { get; set; }
        public DbSet<Student> Students { get; set; }
        public DbSet<Teacher> Teachers { get; set; }
        public DbSet<Assignment> Assignments { get; set; }
        public DbSet<Submission> Submissions { get; set; }
        public DbSet<ClassCourse> ClassCourses { get; set; }
        public DbSet<Subject> Subjects { get; set; }
        public DbSet<ApplicationSetting> ApplicationSettings { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Explicitly map entities to specific collection names
            modelBuilder.Entity<User>().ToCollection("users");
            modelBuilder.Entity<Student>().ToCollection("students");
            modelBuilder.Entity<Teacher>().ToCollection("teachers");
        }
    }
}
