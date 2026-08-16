using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Assignment__Submisstion_Manegment_System_API.Models;
using BCrypt.Net;
using MongoDB.Driver;
using MongoDB.Bson;

namespace Assignment__Submisstion_Manegment_System_API.Data
{
    public static class DbInitializer
    {
        public static async Task SeedAsync(ApplicationDbContext context)
        {
            Console.WriteLine("[DbInitializer] Starting programmatic database cleanup and seeding...");

            // Generate User IDs beforehand to preserve referential integrity
            var userAdminId = ObjectId.GenerateNewId().ToString();
            var userTeacherJaberId = ObjectId.GenerateNewId().ToString();
            var userStudent1Id = ObjectId.GenerateNewId().ToString();
            var userStudent2Id = ObjectId.GenerateNewId().ToString();

            // 1. Purge the database to guarantee clean type/format matching
            try
            {
                var client = new MongoClient("mongodb://localhost:27017");
                await client.DropDatabaseAsync("AssignmentManagementDb");
                Console.WriteLine("[DbInitializer] Database 'AssignmentManagementDb' dropped successfully.");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[DbInitializer] Warning: Database purge failed (will attempt standard seeding): {ex.Message}");
            }

            // Ensure collections are seeded programmatically
            // 2. Class Courses
            var class6Id = ObjectId.GenerateNewId().ToString();
            var class7Id = ObjectId.GenerateNewId().ToString();

            var classes = new List<ClassCourse>
            {
                new ClassCourse { Id = class6Id, Name = "Class 6", Description = "Sixth Grade Secondary Education" },
                new ClassCourse { Id = class7Id, Name = "Class 7", Description = "Seventh Grade Secondary Education" }
            };
            await context.ClassCourses.AddRangeAsync(classes);
            await context.SaveChangesAsync();

            // 3. Teachers
            var teacherJaberId = "REG-T-1001";
            var adminTeacherId = "REG-T-9999";

            var teachers = new List<Teacher>
            {
                new Teacher
                {
                    Id = teacherJaberId,
                    Name = "Jaber Ahmed",
                    DateOfBirth = new DateTime(1985, 5, 12),
                    Designation = "Senior Lecturer",
                    Email = "teacher@example.com",
                    IsAdmin = false,
                    TeachesSubjectIds = new List<string>() // Will be populated when subjects are created
                },
                new Teacher
                {
                    Id = adminTeacherId,
                    Name = "Administrator",
                    DateOfBirth = new DateTime(1975, 1, 1),
                    Designation = "Principal / Admin Officer",
                    Email = "admin@example.com",
                    IsAdmin = true,
                    TeachesSubjectIds = new List<string>()
                }
            };
            await context.Teachers.AddRangeAsync(teachers);
            await context.SaveChangesAsync();

            // 4. Students
            var studentId1 = "REG-S-1001";
            var studentId2 = "REG-S-1002";

            var students = new List<Student>
            {
                new Student
                {
                    Id = studentId1,
                    Name = "Rahim Islam",
                    GuardianName = "Kariul Islam",
                    DateOfBirth = new DateTime(2012, 8, 20),
                    ClassCourseId = class6Id,
                    ClassRoll = 1,
                    ContactNumber = "+8801711122233",
                    Email = "student@example.com"
                },
                new Student
                {
                    Id = studentId2,
                    Name = "Sadia Amin",
                    GuardianName = "Ruhul Amin",
                    DateOfBirth = new DateTime(2011, 11, 5),
                    ClassCourseId = class7Id,
                    ClassRoll = 2,
                    ContactNumber = "+8801822233344",
                    Email = "student2@example.com"
                }
            };
            await context.Students.AddRangeAsync(students);
            await context.SaveChangesAsync();

            // 5. Users (Auth Roster with BCrypt secure hashed passwords)
            var users = new List<User>
            {
                new User
                {
                    Id = userAdminId,
                    Name = "Administrator",
                    Email = "admin@example.com",
                    Role = "Admin",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Password123")
                },
                new User
                {
                    Id = userTeacherJaberId,
                    Name = "Jaber Ahmed",
                    Email = "teacher@example.com",
                    Role = "Teacher",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Password123")
                },
                new User
                {
                    Id = userStudent1Id,
                    Name = "Rahim Islam",
                    Email = "student@example.com",
                    Role = "Student",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Password123")
                },
                new User
                {
                    Id = userStudent2Id,
                    Name = "Sadia Amin",
                    Email = "student2@example.com",
                    Role = "Student",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Password123")
                }
            };
            await context.Users.AddRangeAsync(users);
            await context.SaveChangesAsync();

            // 6. Subjects (Class 6 Math/English, Class 7 Science)
            var subjectMathId = ObjectId.GenerateNewId().ToString();
            var subjectEnglishId = ObjectId.GenerateNewId().ToString();
            var subjectScienceId = ObjectId.GenerateNewId().ToString();

            var subjects = new List<Subject>
            {
                new Subject
                {
                    Id = subjectMathId,
                    Name = "Mathematics",
                    ClassCourseId = class6Id,
                    AssignedTeacherId = teacherJaberId
                },
                new Subject
                {
                    Id = subjectEnglishId,
                    Name = "English Literature",
                    ClassCourseId = class6Id,
                    AssignedTeacherId = teacherJaberId
                },
                new Subject
                {
                    Id = subjectScienceId,
                    Name = "General Science",
                    ClassCourseId = class7Id,
                    AssignedTeacherId = teacherJaberId
                }
            };
            await context.Subjects.AddRangeAsync(subjects);
            await context.SaveChangesAsync();

            // Populate taught subjects list on Teacher profile
            var teacherProfile = await context.Teachers.FindAsync(teacherJaberId);
            if (teacherProfile != null)
            {
                teacherProfile.TeachesSubjectIds.AddRange(new[] { subjectMathId, subjectEnglishId, subjectScienceId });
                context.Teachers.Update(teacherProfile);
                await context.SaveChangesAsync();
            }

            // 7. Assignments
            var assignment1Id = ObjectId.GenerateNewId().ToString();
            var assignment2Id = ObjectId.GenerateNewId().ToString();

            var assignments = new List<Assignment>
            {
                new Assignment
                {
                    Id = assignment1Id,
                    Title = "Algebra Equations Assignment",
                    Description = "Solve the equations in Chapter 3 exercises 1 to 10. Write clean steps.",
                    DueDate = DateTime.UtcNow.AddDays(7),
                    ClassCourseId = class6Id,
                    SubjectId = subjectMathId,
                    MaxMarks = 100,
                    Status = "Published",
                    TeacherId = userTeacherJaberId,
                    AllowLateSubmissions = false,
                    CreatedAt = DateTime.UtcNow.AddDays(-2)
                },
                new Assignment
                {
                    Id = assignment2Id,
                    Title = "Photosynthesis Report",
                    Description = "Write a 500-word essay explaining the process of photosynthesis and chloroplast cells.",
                    DueDate = DateTime.UtcNow.AddDays(-1), // Passed deadline
                    ClassCourseId = class7Id,
                    SubjectId = subjectScienceId,
                    MaxMarks = 50,
                    Status = "Published",
                    TeacherId = userTeacherJaberId,
                    AllowLateSubmissions = true,
                    CreatedAt = DateTime.UtcNow.AddDays(-5)
                }
            };
            await context.Assignments.AddRangeAsync(assignments);
            await context.SaveChangesAsync();

            // 8. Submissions
            var submissions = new List<Submission>
            {
                new Submission
                {
                    Id = ObjectId.GenerateNewId().ToString(),
                    AssignmentId = assignment1Id,
                    StudentId = userStudent1Id,
                    Content = "My Algebra solution link: github.com/rahim-maths/algebra-solution",
                    SubmittedAt = DateTime.UtcNow.AddDays(-1),
                    Status = "Graded",
                    Marks = 95,
                    Feedback = "Excellent algebraic logic and steps!"
                },
                new Submission
                {
                    Id = ObjectId.GenerateNewId().ToString(),
                    AssignmentId = assignment2Id,
                    StudentId = userStudent2Id,
                    Content = "Plants extract light via chlorophyll inside cell chloroplasts...",
                    SubmittedAt = DateTime.UtcNow.AddDays(-2),
                    Status = "Pending",
                    Marks = null,
                    Feedback = null
                }
            };
            await context.Submissions.AddRangeAsync(submissions);
            await context.SaveChangesAsync();

            // 9. Application Settings (Late Submissions toggle setting)
            var settings = new List<ApplicationSetting>
            {
                new ApplicationSetting
                {
                    Id = ObjectId.GenerateNewId().ToString(),
                    Key = "AllowLateSubmissions",
                    Value = "false"
                }
            };
            await context.ApplicationSettings.AddRangeAsync(settings);
            await context.SaveChangesAsync();

            Console.WriteLine("[DbInitializer] Seeding complete! Database is clean and ready.");
        }
    }
}
