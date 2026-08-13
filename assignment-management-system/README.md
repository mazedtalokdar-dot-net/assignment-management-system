# Assignment & Submission Management System

A role-based school/college management application designed for evaluating system design, RESTful API development, frontend implementation, security best practices, and unit testing.

---

## 🚀 Key Features

* **Role-Based Authorization**: Distinct views and action privileges for **Admin**, **Teacher**, and **Student** roles.
* **Enrollment Security (Pre-Registration Flow)**: Public registration is protected; only students and teachers pre-registered by the Administrator can create login credentials. The server automatically maps user accounts to their respective profiles and roles.
* **Auto-Database Seeding & Hashing**: The MongoDB database is automatically initialized and seeded with sample data on startup. Plain-text passwords from the seed roster are encrypted using **BCrypt** hashing upon database initialization.
* **Settings-Driven Business Rules**: Admin panel allows configuring the *Allow Late Submissions* setting on a per-assignment basis, which is checked dynamically when students submit or update answers.
* **Teacher Subject Constraints**: Only the teacher assigned to a specific subject (configured by Admin) can create or modify assignments for that subject, preventing unauthorized assignment generation.
* **Global Error Logging**: Global exception handling middleware returns structured RFC 7807 problem details to the client and logs requests, responses, and errors to `logs/app-log.txt`.
* **Testing Suite**: Comprehensive backend unit tests written in xUnit covering late submission rule exceptions, registration guards, grading limits, and role-based permissions.

---

## 🛠️ Technology Stack

* **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, Lucide icons, React Hook Form, Zod validation.
* **Backend**: ASP.NET Core 10 Web API, C#, Entity Framework Core (MongoDB EF provider), JWT Authentication, BCrypt.Net-Next.
* **Database**: MongoDB (Local instance).
* **Testing**: xUnit, Moq, Microsoft.EntityFrameworkCore.InMemory.

---

## 🔑 Demo Credentials

Once the backend starts, the database is auto-seeded with these working logins:

| Role | Email | Password | Details |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@example.com` | `Password123` | Access to User CRUD, Settings, Subject assignment, global ledger |
| **Teacher** | `teacher@example.com` | `Password123` | Create/edit assignments, view submission roll, grade submissions |
| **Student** | `student@example.com` | `Password123` | Assigned to **Class-6**, views class assignments, submits answers |
| **Student 2** | `student2@example.com` | `Password123` | Assigned to **Class-7**, views class assignments |

---

## ⚙️ Quick Start Setup

### Prerequisites
* [.NET 10 SDK](https://dotnet.microsoft.com/download)
* [Node.js (v18+)](https://nodejs.org)
* [MongoDB](https://www.mongodb.com/try/download/community) running locally on `mongodb://localhost:27017`

### 1. Database Configuration
By default, the backend connects to MongoDB on `mongodb://localhost:27017`.
> [!IMPORTANT]
> If your MongoDB instance runs on a different port or URI (e.g. `mongodb://localhost:27018` or `mongodb://127.0.0.1:27017`), update the connection string in the `ConnectionStrings:MongoDb` section of [appsettings.json](file:///e:/Job%20Application/Project%20for%20Onnorokom%20Projukti/Project%20set%20up/assignment-management-system/backend/Assignment_%20Submisstion_Manegment_System_API/appsettings.json) to match your local environment before launching the application.

### 2. Start the Backend API
```bash
cd backend/Assignment_%20Submisstion_Manegment_System_API
dotnet run
```
* The API will start at: `https://localhost:7198` (or `http://localhost:5039`)
* The database will automatically seed on startup.
* Swagger documentation is available in development mode at: `http://localhost:5039/swagger`

### 3. Start the Frontend Application
```bash
cd frontend
npm install
npm run dev
```
* Open your browser and navigate to: `http://localhost:3000`

### 4. Run Unit Tests
To execute the automated xUnit tests:
```bash
cd backend
dotnet test
```

---

## 🏛️ System Architecture Decisions

1. **Decoupled Auth & Profiles**: `User` represents identity credentials, whereas `Student` and `Teacher` maintain institutional information (Roll, Designation, date of birth, etc.). This ensures that profile databases can be safely modified without altering authentication records.
2. **Roster Enrollment Verification**: Users cannot register a new account on `/register` unless their email is already in the `Students` or `Teachers` collections created by the Admin. This simulates secure school/college registration where records are managed strictly by institutional administration.
3. **Per-Assignment Settings Enforcement**: The `AllowLateSubmissions` setting is stored on each assignment. Toggled dynamically by the Admin in the Settings tab, the server checks this property in `SubmissionsController.cs` on submission or update requests, enabling or disallowing late student work per task.
4. **Subject Teacher Ownership**: Assignments are tied to class courses and subjects. Only the teacher who has been explicitly assigned to a subject by the Admin is authorized to create/edit assignments for that subject. Other teachers are blocked at both the UI and API levels.

---

## 📝 Data Insertion & Registration Guideline

The system enforces a **verified institutional roster pre-registration flow** to ensure only legitimate students and teachers can register accounts:

1. **Step 1: Admin Creates Roster Record**:
   - Log in as the Admin (`admin@example.com` / `Password123`).
   - Navigate to **Manage Users** and add a new Teacher or Student profile (with name, registration number, unique email, guardian info, roll, etc.).
2. **Step 2: User Registers Credentials**:
   - Navigate to `/register` on the frontend.
   - Enter the exact email address used by the Admin during profile creation, choose a password, and submit.
   - The server validates that the email matches a pre-registered student or teacher profile, automatically hashes the password using **BCrypt**, and creates their credential record.
   - The user can now log in at `/login` and access their respective portal.

---

## 📌 Assumptions Made

1. **Email Uniqueness**: User emails are unique across both Student and Teacher profiles to guarantee correct authentication mapping.
2. **Subject Assignment**: Subjects belong to a class course, and have an optional `AssignedTeacherId` mapping to a teacher's registration ID.
3. **Submission Constraints**:
   - Students can only submit a single solution to an assignment; further edits require updating the existing submission.
   - If an assignment is already evaluated and graded by the teacher, the student can no longer update or modify their submission under any circumstances.
   - Teacher marks cannot exceed the assignment's defined `maxMarks`.

---

## ⚠️ Known Limitations

1. **MongoDB Connection**: Requires a local MongoDB service instance running. In case of connection failure, verify local service launch on Windows services.
2. **xUnit In-Memory Db Provider**: Automated tests utilize Entity Framework's `InMemory` database provider which is optimized for simulating relational context behaviors but does not simulate MongoDB-specific operations like schema validation or direct aggregation syntax.
