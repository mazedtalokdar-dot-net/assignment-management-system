using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Moq;
using Xunit;
using Assignment__Submisstion_Manegment_System_API.Controllers;
using Assignment__Submisstion_Manegment_System_API.Data;
using Assignment__Submisstion_Manegment_System_API.DTOs;
using Assignment__Submisstion_Manegment_System_API.Models;
using Assignment__Submisstion_Manegment_System_API.Repositories;

namespace AssignmentManagement.Tests
{
    public class SubmissionsControllerTests
    {
        private readonly DbContextOptions<ApplicationDbContext> _dbOptions;

        public SubmissionsControllerTests()
        {
            // Set up a unique in-memory database name for each test run
            _dbOptions = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;
        }

        private ApplicationDbContext GetContext() => new ApplicationDbContext(_dbOptions);

        private ClaimsPrincipal CreateMockUser(string userId, string role, string email)
        {
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, userId),
                new Claim(ClaimTypes.Role, role),
                new Claim(ClaimTypes.Email, email)
            };
            var identity = new ClaimsIdentity(claims, "TestAuth");
            return new ClaimsPrincipal(identity);
        }

        [Fact]
        public async Task SubmitAssignment_WithPassedDeadline_ReturnsBadRequest_IfAllowLateIsFalse()
        {
            // Arrange
            using var context = GetContext();

            var mockSubRepo = new Mock<ISubmissionRepository>();
            var mockAssignRepo = new Mock<IAssignmentRepository>();

            var assignmentId = "assignment-123";
            var overdueDate = DateTime.UtcNow.AddHours(-1); // Passed deadline
            
            mockAssignRepo.Setup(r => r.GetByIdAsync(assignmentId))
                .ReturnsAsync(new Assignment
                {
                    Id = assignmentId,
                    Title = "Test Overdue Assignment",
                    DueDate = overdueDate,
                    AllowLateSubmissions = false
                });

            var controller = new SubmissionsController(mockSubRepo.Object, mockAssignRepo.Object, context);
            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = CreateMockUser("student-123", "Student", "student@example.com")
                }
            };

            var dto = new SubmissionCreateDto
            {
                AssignmentId = assignmentId,
                Content = "My submission content"
            };

            // Act
            var result = await controller.SubmitAssignment(dto);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
            Assert.Contains("passed and late submissions are disabled", badRequestResult.Value?.ToString());
        }

        [Fact]
        public async Task SubmitAssignment_WithPassedDeadline_ReturnsOk_IfAllowLateIsTrue()
        {
            // Arrange
            using var context = GetContext();

            var mockSubRepo = new Mock<ISubmissionRepository>();
            var mockAssignRepo = new Mock<IAssignmentRepository>();

            var assignmentId = "assignment-123";
            var overdueDate = DateTime.UtcNow.AddHours(-1); // Passed deadline
            
            mockAssignRepo.Setup(r => r.GetByIdAsync(assignmentId))
                .ReturnsAsync(new Assignment
                {
                    Id = assignmentId,
                    Title = "Test Overdue Assignment",
                    DueDate = overdueDate,
                    AllowLateSubmissions = true
                });

            mockSubRepo.Setup(r => r.GetByStudentIdAsync("student-123"))
                .ReturnsAsync(new List<Submission>()); // No previous submission

            var controller = new SubmissionsController(mockSubRepo.Object, mockAssignRepo.Object, context);
            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = CreateMockUser("student-123", "Student", "student@example.com")
                }
            };

            var dto = new SubmissionCreateDto
            {
                AssignmentId = assignmentId,
                Content = "My late submission content"
            };

            // Act
            var result = await controller.SubmitAssignment(dto);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var submission = Assert.IsType<Submission>(okResult.Value);
            Assert.Equal("My late submission content", submission.Content);
        }

        [Fact]
        public async Task RegisterUser_WithNonRegisteredEmail_ReturnsBadRequest()
        {
            // Arrange
            using var context = GetContext();
            // No student or teacher pre-registered in DB

            var controller = new UsersController(context);
            var payload = new RegisterPayload
            {
                Email = "random@school.com",
                Name = "Random User",
                PasswordHash = "Password123"
            };

            // Act
            var result = await controller.RegisterUser(payload);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
            Assert.Contains("Your email is not registered in the student or teacher rosters", badRequestResult.Value?.ToString());
        }

        [Fact]
        public async Task RegisterUser_WithRegisteredStudentEmail_RegistersAndHashesPassword()
        {
            // Arrange
            using var context = GetContext();
            
            // Pre-register a student
            context.Students.Add(new Student
            {
                Id = "REG-S-1001",
                Name = "Test Student",
                Email = "student@school.com",
                ClassCourseId = "class-6",
                ClassRoll = 1
            });
            await context.SaveChangesAsync();

            var controller = new UsersController(context);
            var payload = new RegisterPayload
            {
                Email = "student@school.com",
                Name = "Test Student",
                PasswordHash = "MySecretPassword123"
            };

            // Act
            var result = await controller.RegisterUser(payload);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            
            // Verify record is created in the Users collection
            var registeredUser = await context.Users.FirstOrDefaultAsync(u => u.Email == "student@school.com");
            Assert.NotNull(registeredUser);
            Assert.Equal("Student", registeredUser.Role);
            
            // Verify password is encrypted and matches BCrypt format (hashes start with $2a$, $2b$ or $2y$)
            Assert.StartsWith("$2a$", registeredUser.PasswordHash);
            Assert.True(BCrypt.Net.BCrypt.Verify("MySecretPassword123", registeredUser.PasswordHash));
        }

        [Fact]
        public async Task GradeSubmission_WithMarksExceedingMax_ReturnsBadRequest()
        {
            // Arrange
            using var context = GetContext();
            var mockSubRepo = new Mock<ISubmissionRepository>();
            var mockAssignRepo = new Mock<IAssignmentRepository>();

            var submissionId = "sub-123";
            var assignmentId = "assign-123";

            var existingSubmission = new Submission
            {
                Id = submissionId,
                AssignmentId = assignmentId,
                StudentId = "student-123",
                Status = "Pending"
            };

            mockSubRepo.Setup(r => r.GetByIdAsync(submissionId))
                .ReturnsAsync(existingSubmission);

            mockAssignRepo.Setup(r => r.GetByIdAsync(assignmentId))
                .ReturnsAsync(new Assignment
                {
                    Id = assignmentId,
                    MaxMarks = 50
                });

            var controller = new SubmissionsController(mockSubRepo.Object, mockAssignRepo.Object, context);
            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = CreateMockUser("teacher-123", "Teacher", "teacher@example.com")
                }
            };

            var gradeDto = new SubmissionGradeDto
            {
                Marks = 70, // Exceeds MaxMarks of 50
                Feedback = "Exceeded limit",
                Status = "Graded"
            };

            // Act
            var result = await controller.GradeSubmission(submissionId, gradeDto);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
            Assert.Contains("Marks cannot exceed the maximum marks of 50", badRequestResult.Value?.ToString());
        }

        [Fact]
        public async Task UpdateSubmission_WhenAlreadyGraded_ReturnsBadRequest()
        {
            // Arrange
            using var context = GetContext();
            var mockSubRepo = new Mock<ISubmissionRepository>();
            var mockAssignRepo = new Mock<IAssignmentRepository>();

            var submissionId = "sub-123";
            var assignmentId = "assign-123";
            var studentUserId = "student-123";

            var existingSubmission = new Submission
            {
                Id = submissionId,
                AssignmentId = assignmentId,
                StudentId = studentUserId,
                Status = "Graded",
                Marks = 45
            };

            mockSubRepo.Setup(r => r.GetByIdAsync(submissionId))
                .ReturnsAsync(existingSubmission);

            mockAssignRepo.Setup(r => r.GetByIdAsync(assignmentId))
                .ReturnsAsync(new Assignment
                {
                    Id = assignmentId,
                    DueDate = DateTime.UtcNow.AddDays(1)
                });

            var controller = new SubmissionsController(mockSubRepo.Object, mockAssignRepo.Object, context);
            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = CreateMockUser(studentUserId, "Student", "student@example.com")
                }
            };

            var updateDto = new SubmissionUpdateDto
            {
                Content = "Attempted updated content"
            };

            // Act
            var result = await controller.UpdateSubmission(submissionId, updateDto);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
            Assert.Contains("already been graded and cannot be updated", badRequestResult.Value?.ToString());
        }
    }
}
