# Assignment Management System

## Project Overview
A full-stack Assignment Management System designed to handle class infrastructure, assignment lifecycle, and grading. Built with a robust Role-Based Access Control (RBAC) architecture, it serves Admins, Teachers, and Students through customized, secure dashboards.

## Main Features
*   **Role-Based Access Control:** Secure JWT authentication enforcing Admin, Teacher, and Student permissions at both the API and UI levels.
*   **Admin Module:** Create and manage Classes and Subjects to establish the school's infrastructure.
*   **Teacher Module:** Create, update, publish, and delete assignments. View student submissions and provide grades/feedback.
*   **Student Module:** View published assignments by class, submit answers, update submissions before deadlines, and view graded feedback.

## Technology Stack
*   **Frontend:** Next.js (App Router), React, TypeScript, Tailwind CSS, React Hook Form, Zod.
*   **Backend:** C# / .NET 8.0 Web API.
*   **Database:** MongoDB, Entity Framework Core (MongoDB Provider).
*   **Authentication:** JSON Web Tokens (JWT).

## Project Structure
The repository is a monorepo containing:
1.  `/frontend`: The Next.js web application.
2.  `/backend`: The .NET 8.0 Web API solution.
3.  `/Database-Seed-Data`: JSON exports of the MongoDB collections for easy setup.

## Database Setup Instructions
Because this project utilizes MongoDB, there are no traditional SQL migration files. Collections are automatically created upon initial data insertion by Entity Framework Core. 
To set up the demo data:
1. Ensure MongoDB is running locally on port `27017`.
2. Open MongoDB Compass or a terminal and create a database named `AssignmentSystemDb`.
3. Import the JSON files located in the `/Database-Seed-Data` folder (`users.json`, `classes.json`, `subjects.json`) into their respective collections.

## Setup Instructions

### Running the Backend (API)
1. Navigate to the `/backend` directory.
2. Rename `appsettings.example.json` to `appsettings.json`.
3. Update the `JwtSettings:Secret` with a secure string of your choice.
4. Run the application:
   ```bash
   dotnet restore
   dotnet run```
   
   
   
1. The API will be available at http://localhost:5039 or https://localhost:7039. Swagger UI is available at /swagger.

**Running the Frontend
1. Navigate to the /frontend directory.

2. Rename .env.example to .env.local. Ensure the NEXT_PUBLIC_API_URL matches your backend's running port.

3. Install dependencies:

```Bash
npm install```
4. Start the development server:

```Bash
npm run dev```
5. Open http://localhost:3000 in your browser.

**Demo Credentials
 Login using this email and password
1.For Admin Login : 
usermail: 'admin@example.com' 
password: 'string'

2. For Teacher Login:
usermail: 'jaber@example.com' 
password: 'Password123'

3. For Student Login:
usermail: 'student@example.com' 
password: 'Password123'
Instructions for Running Tests
Navigate to the backend tests directory: cd backend/Tests

**Run the test suite: dotnet test

Assumptions & Known Limitations
Assumptions: It is assumed that Students are manually told which Class they belong to, as a complex "Student Enrollment" relationship was outside the immediate scope; they select their class via a dropdown to view assignments.

Limitations: The system currently relies on local MongoDB instances. File uploading for assignments is not currently supported; submissions are text-based.