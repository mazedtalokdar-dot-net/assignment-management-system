"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import api from "@/lib/axios";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import { Trash2, UserPlus, Settings, BookOpen, Layers, FileText, ClipboardList } from "lucide-react";

// --- Validation Schemas ---
const classSchema = z.object({
  name: z.string().min(2, "Class name is required"),
  description: z.string().optional(),
});

const subjectSchema = z.object({
  name: z.string().min(2, "Subject name is required"),
  classCourseId: z.string().min(1, "Please select a class"),
});

const studentSchema = z.object({
  id: z.string().min(3, "Registration ID is required (min 3 chars)"),
  name: z.string().min(2, "Name is required"),
  guardianName: z.string().min(2, "Guardian name is required"),
  dateOfBirth: z.string().min(1, "Date of Birth is required"),
  classCourseId: z.string().min(1, "Class Course selection is required"),
  classRoll: z.coerce.number().min(1, "Roll number must be at least 1"),
  contactNumber: z.string().min(5, "Contact number is required"),
  email: z.string().email("Please enter a valid email address"),
});

const teacherSchema = z.object({
  id: z.string().min(3, "Registration ID is required (min 3 chars)"),
  name: z.string().min(2, "Name is required"),
  dateOfBirth: z.string().min(1, "Date of Birth is required"),
  designation: z.string().min(2, "Designation is required"),
  email: z.string().email("Please enter a valid email address"),
  isAdmin: z.boolean(),
});

type ClassFormValues = z.infer<typeof classSchema>;
type SubjectFormValues = z.infer<typeof subjectSchema>;
type StudentFormValues = z.infer<typeof studentSchema>;
type TeacherFormValues = z.infer<typeof teacherSchema>;

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<"users" | "classes" | "subjects" | "settings" | "overview">("users");
  
  // Data States
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [allowLateSubmissions, setAllowLateSubmissions] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Forms
  const classForm = useForm<ClassFormValues>({
    resolver: zodResolver(classSchema),
    defaultValues: { name: "", description: "" }
  });
  const subjectForm = useForm<SubjectFormValues>({
    resolver: zodResolver(subjectSchema),
    defaultValues: { name: "", classCourseId: "" }
  });
  const studentForm = useForm<StudentFormValues>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      id: "",
      name: "",
      guardianName: "",
      dateOfBirth: "",
      classCourseId: "",
      classRoll: 0,
      contactNumber: "",
      email: ""
    }
  });
  const teacherForm = useForm<TeacherFormValues>({
    resolver: zodResolver(teacherSchema),
    defaultValues: {
      id: "",
      name: "",
      dateOfBirth: "",
      designation: "",
      email: "",
      isAdmin: false
    }
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [classRes, subRes, studentRes, teacherRes, assignRes, submsRes, settingsRes] = await Promise.all([
        api.get("/Admin/classes"),
        api.get("/Admin/subjects"),
        api.get("/Admin/students"),
        api.get("/Admin/teachers"),
        api.get("/Admin/assignments"),
        api.get("/Admin/submissions"),
        api.get("/Admin/settings"),
      ]);
      
      setClasses(classRes.data);
      setSubjects(subRes.data);
      setStudents(studentRes.data);
      setTeachers(teacherRes.data);
      setAssignments(assignRes.data);
      setSubmissions(submsRes.data);

      // Resolve setting
      const lateSetting = settingsRes.data.find((s: any) => s.key === "AllowLateSubmissions");
      if (lateSetting) {
        setAllowLateSubmissions(lateSetting.value === "true");
      }
    } catch (err: any) {
      console.error("Failed to fetch admin dashboard data", err);
    }
  };

  const getErrorMessage = (err: any) => {
    if (!err.response) return "Network error. Please try again.";
    const data = err.response.data;
    if (typeof data === "string") return data;
    if (data && typeof data === "object") {
      if (data.errors && typeof data.errors === "object") {
        // Standard ASP.NET Core Validation errors (e.g. Model validation)
        return Object.values(data.errors).flat().join(", ");
      }
      if (data.errors && Array.isArray(data.errors)) {
        return data.errors.join(", ");
      }
      if (data.message) return data.message;
      return JSON.stringify(data);
    }
    return "An error occurred.";
  };

  const showNotification = (msg: string, isError = false) => {
    if (isError) {
      setError(msg);
      setSuccess("");
    } else {
      setSuccess(msg);
      setError("");
    }
    setTimeout(() => {
      setError("");
      setSuccess("");
    }, 5000);
  };

  // Submit Handlers
  const onClassSubmit = async (data: ClassFormValues) => {
    try {
      await api.post("/Admin/classes", data);
      classForm.reset({ name: "", description: "" });
      showNotification("Class created successfully!");
      fetchData();
    } catch (err: any) {
      showNotification(getErrorMessage(err), true);
    }
  };

  const onSubjectSubmit = async (data: SubjectFormValues) => {
    try {
      await api.post("/Admin/subjects", data);
      subjectForm.reset({ name: "", classCourseId: "" });
      showNotification("Subject created successfully!");
      fetchData();
    } catch (err: any) {
      showNotification(getErrorMessage(err), true);
    }
  };

  const onStudentSubmit = async (data: StudentFormValues) => {
    try {
      const payload = {
        ...data,
        dateOfBirth: new Date(data.dateOfBirth).toISOString(),
      };
      await api.post("/Admin/students", payload);
      studentForm.reset({
        id: "",
        name: "",
        guardianName: "",
        dateOfBirth: "",
        classCourseId: "",
        classRoll: 0,
        contactNumber: "",
        email: "",
      });
      showNotification("Student profile created successfully! They can now register with their email.");
      fetchData();
    } catch (err: any) {
      showNotification(getErrorMessage(err), true);
    }
  };

  const onTeacherSubmit = async (data: TeacherFormValues) => {
    try {
      const payload = {
        ...data,
        dateOfBirth: new Date(data.dateOfBirth).toISOString(),
      };
      await api.post("/Admin/teachers", payload);
      teacherForm.reset({
        id: "",
        name: "",
        dateOfBirth: "",
        designation: "",
        email: "",
        isAdmin: false,
      });
      showNotification("Teacher profile created successfully! They can now register with their email.");
      fetchData();
    } catch (err: any) {
      showNotification(getErrorMessage(err), true);
    }
  };

  const deleteStudent = async (id: string) => {
    if (!confirm("Are you sure you want to delete this student and their login credentials?")) return;
    try {
      await api.delete(`/Admin/students/${id}`);
      showNotification("Student profile deleted successfully.");
      fetchData();
    } catch (err: any) {
      showNotification("Failed to delete student.", true);
    }
  };

  const deleteTeacher = async (id: string) => {
    if (!confirm("Are you sure you want to delete this teacher and their login credentials?")) return;
    try {
      await api.delete(`/Admin/teachers/${id}`);
      showNotification("Teacher profile deleted successfully.");
      fetchData();
    } catch (err: any) {
      showNotification("Failed to delete teacher.", true);
    }
  };

  const assignTeacherToSubject = async (subjectId: string, teacherId: string) => {
    if (!teacherId) return;
    try {
      await api.put(`/Admin/subjects/${subjectId}/assign-teacher`, { teacherId });
      showNotification("Teacher assigned to subject successfully.");
      fetchData();
    } catch (err: any) {
      showNotification("Failed to assign teacher.", true);
    }
  };

  const toggleLateSubmissions = async (checked: boolean) => {
    try {
      setAllowLateSubmissions(checked);
      await api.put("/Admin/settings", {
        key: "AllowLateSubmissions",
        value: checked ? "true" : "false",
      });
      showNotification(`Late submissions ${checked ? "enabled" : "disabled"} successfully.`);
      fetchData();
    } catch (err: any) {
      showNotification("Failed to update settings.", true);
    }
  };

  const toggleAssignmentLateSubmission = async (assignmentId: string, checked: boolean) => {
    try {
      setAssignments(prev =>
        prev.map(a => (a.id === assignmentId ? { ...a, allowLateSubmissions: checked } : a))
      );
      await api.put(`/Admin/assignments/${assignmentId}/toggle-late-submission`, {
        allowLate: checked
      });
      showNotification(`Late submissions updated for this assignment.`);
      fetchData();
    } catch (err: any) {
      showNotification("Failed to update assignment setting.", true);
      fetchData();
    }
  };

  return (
    <ProtectedRoute allowedRoles={["Admin"]}>
      <div className="min-h-screen bg-gray-900 text-gray-100 font-sans">
        <Navbar />
        <main className="p-8 max-w-7xl mx-auto">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 pb-6 border-b border-gray-800">
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight text-white bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
                Administration Portal
              </h2>
              <p className="text-sm text-gray-400 mt-1">
                Manage user rosters, class subjects, system settings, and overview assignment reports.
              </p>
            </div>
          </div>

          {/* Notifications */}
          {error && (
            <div className="bg-red-900/60 border border-red-800 text-red-200 p-4 rounded-lg mb-6 shadow-lg animate-pulse text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-emerald-950/60 border border-emerald-800 text-emerald-200 p-4 rounded-lg mb-6 shadow-lg text-sm">
              {success}
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="flex flex-wrap gap-2 mb-8 bg-gray-850 p-1.5 rounded-xl border border-gray-800">
            <button
              onClick={() => setActiveTab("users")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition ${
                activeTab === "users"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-900/40"
                  : "text-gray-400 hover:text-gray-200 hover:bg-gray-800"
              }`}
            >
              <UserPlus size={18} /> Manage Users
            </button>
            <button
              onClick={() => setActiveTab("classes")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition ${
                activeTab === "classes"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-900/40"
                  : "text-gray-400 hover:text-gray-200 hover:bg-gray-800"
              }`}
            >
              <Layers size={18} /> Classes & Courses
            </button>
            <button
              onClick={() => setActiveTab("subjects")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition ${
                activeTab === "subjects"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-900/40"
                  : "text-gray-400 hover:text-gray-200 hover:bg-gray-800"
              }`}
            >
              <BookOpen size={18} /> Manage Subjects
            </button>
            <button
              onClick={() => setActiveTab("overview")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition ${
                activeTab === "overview"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-900/40"
                  : "text-gray-400 hover:text-gray-200 hover:bg-gray-800"
              }`}
            >
              <ClipboardList size={18} /> View Overview
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition ${
                activeTab === "settings"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-900/40"
                  : "text-gray-400 hover:text-gray-200 hover:bg-gray-800"
              }`}
            >
              <Settings size={18} /> Settings
            </button>
          </div>

          {/* TAB CONTENTS */}

          {/* TAB 1: USERS */}
          {activeTab === "users" && (
            <div className="space-y-8 animate-fadeIn">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                
                {/* Add Student Form */}
                <div className="bg-gray-800/50 p-6 rounded-2xl border border-gray-700/60 shadow-xl">
                  <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-purple-500"></span> Pre-Register Student
                  </h3>
                  <form onSubmit={studentForm.handleSubmit(onStudentSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Registration ID (Unique)</label>
                        <input {...studentForm.register("id")} placeholder="REG-S-001" className="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:border-blue-500 focus:outline-none" />
                        {studentForm.formState.errors.id && <p className="text-red-400 text-xs mt-1">{studentForm.formState.errors.id.message}</p>}
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Full Name</label>
                        <input {...studentForm.register("name")} placeholder="John Doe" className="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:border-blue-500 focus:outline-none" />
                        {studentForm.formState.errors.name && <p className="text-red-400 text-xs mt-1">{studentForm.formState.errors.name.message}</p>}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Guardian Name</label>
                        <input {...studentForm.register("guardianName")} placeholder="Richard Doe" className="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:border-blue-500 focus:outline-none" />
                        {studentForm.formState.errors.guardianName && <p className="text-red-400 text-xs mt-1">{studentForm.formState.errors.guardianName.message}</p>}
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Date of Birth</label>
                        <input type="date" {...studentForm.register("dateOfBirth")} className="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:border-blue-500 focus:outline-none" />
                        {studentForm.formState.errors.dateOfBirth && <p className="text-red-400 text-xs mt-1">{studentForm.formState.errors.dateOfBirth.message}</p>}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="col-span-2">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Class / Course</label>
                        <select {...studentForm.register("classCourseId")} className="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:border-blue-500 focus:outline-none">
                          <option value="">Select Class...</option>
                          {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        {studentForm.formState.errors.classCourseId && <p className="text-red-400 text-xs mt-1">{studentForm.formState.errors.classCourseId.message}</p>}
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Class Roll</label>
                        <input type="number" {...studentForm.register("classRoll")} className="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:border-blue-500 focus:outline-none" />
                        {studentForm.formState.errors.classRoll && <p className="text-red-400 text-xs mt-1">{studentForm.formState.errors.classRoll.message}</p>}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Contact Number</label>
                        <input {...studentForm.register("contactNumber")} placeholder="+880..." className="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:border-blue-500 focus:outline-none" />
                        {studentForm.formState.errors.contactNumber && <p className="text-red-400 text-xs mt-1">{studentForm.formState.errors.contactNumber.message}</p>}
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Email (Roster/Login Link)</label>
                        <input {...studentForm.register("email")} placeholder="student@example.com" className="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:border-blue-500 focus:outline-none" />
                        {studentForm.formState.errors.email && <p className="text-red-400 text-xs mt-1">{studentForm.formState.errors.email.message}</p>}
                      </div>
                    </div>

                    <button type="submit" className="w-full py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition duration-200 mt-4 text-sm">
                      Pre-Register Student
                    </button>
                  </form>
                </div>

                {/* Add Teacher Form */}
                <div className="bg-gray-800/50 p-6 rounded-2xl border border-gray-700/60 shadow-xl">
                  <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-teal-500"></span> Pre-Register Teacher
                  </h3>
                  <form onSubmit={teacherForm.handleSubmit(onTeacherSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Registration ID (Unique)</label>
                        <input {...teacherForm.register("id")} placeholder="REG-T-001" className="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:border-blue-500 focus:outline-none" />
                        {teacherForm.formState.errors.id && <p className="text-red-400 text-xs mt-1">{teacherForm.formState.errors.id.message}</p>}
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Full Name</label>
                        <input {...teacherForm.register("name")} placeholder="Jane Doe" className="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:border-blue-500 focus:outline-none" />
                        {teacherForm.formState.errors.name && <p className="text-red-400 text-xs mt-1">{teacherForm.formState.errors.name.message}</p>}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Date of Birth</label>
                        <input type="date" {...teacherForm.register("dateOfBirth")} className="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:border-blue-500 focus:outline-none" />
                        {teacherForm.formState.errors.dateOfBirth && <p className="text-red-400 text-xs mt-1">{teacherForm.formState.errors.dateOfBirth.message}</p>}
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Designation</label>
                        <input {...teacherForm.register("designation")} placeholder="Lecturer" className="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:border-blue-500 focus:outline-none" />
                        {teacherForm.formState.errors.designation && <p className="text-red-400 text-xs mt-1">{teacherForm.formState.errors.designation.message}</p>}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Email</label>
                      <input {...teacherForm.register("email")} placeholder="teacher@example.com" className="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:border-blue-500 focus:outline-none" />
                      {teacherForm.formState.errors.email && <p className="text-red-400 text-xs mt-1">{teacherForm.formState.errors.email.message}</p>}
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <input type="checkbox" id="isAdmin" {...teacherForm.register("isAdmin")} className="h-4 w-4 bg-gray-900 border border-gray-700 rounded focus:ring-blue-500 text-blue-600" />
                      <label htmlFor="isAdmin" className="text-sm text-gray-300 font-medium">Grant Administrator Privileges (Teacher + Admin Access)</label>
                    </div>

                    <button type="submit" className="w-full py-3 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-700 transition duration-200 mt-6 text-sm">
                      Pre-Register Teacher
                    </button>
                  </form>
                </div>
              </div>

              {/* Roster Listing */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Students Table */}
                <div className="bg-gray-800/30 p-6 rounded-2xl border border-gray-800 shadow-lg">
                  <h4 className="text-lg font-bold text-white mb-4 flex items-center justify-between">
                    <span>Student Roster</span>
                    <span className="text-xs bg-purple-950/60 border border-purple-800 text-purple-300 px-2 py-0.5 rounded-full">{students.length} Total</span>
                  </h4>
                  <div className="overflow-x-auto max-h-[400px]">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="border-b border-gray-800 text-gray-400 uppercase tracking-wider text-xs">
                          <th className="pb-3">Reg ID / Name</th>
                          <th className="pb-3">Class/Roll</th>
                          <th className="pb-3">Email</th>
                          <th className="pb-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-850">
                        {students.map(s => (
                          <tr key={s.id} className="text-gray-300 hover:bg-gray-800/20">
                            <td className="py-3">
                              <span className="font-semibold text-white block">{s.name}</span>
                              <span className="text-xs text-gray-500">{s.id}</span>
                            </td>
                            <td className="py-3">
                              <span className="block">{classes.find(c => c.id === s.classCourseId)?.name || "Unknown"}</span>
                              <span className="text-xs text-gray-500">Roll: {s.classRoll}</span>
                            </td>
                            <td className="py-3 text-xs">{s.email}</td>
                            <td className="py-3 text-right">
                              <button onClick={() => deleteStudent(s.id)} className="p-1.5 bg-red-950/40 border border-red-900/60 text-red-400 rounded-lg hover:bg-red-900/80 hover:text-white transition">
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                        {students.length === 0 && (
                          <tr>
                            <td colSpan={4} className="py-4 text-center text-gray-500 italic text-xs">No student profiles pre-registered yet.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Teachers Table */}
                <div className="bg-gray-800/30 p-6 rounded-2xl border border-gray-800 shadow-lg">
                  <h4 className="text-lg font-bold text-white mb-4 flex items-center justify-between">
                    <span>Teacher Roster</span>
                    <span className="text-xs bg-teal-950/60 border border-teal-800 text-teal-300 px-2 py-0.5 rounded-full">{teachers.length} Total</span>
                  </h4>
                  <div className="overflow-x-auto max-h-[400px]">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="border-b border-gray-800 text-gray-400 uppercase tracking-wider text-xs">
                          <th className="pb-3">Reg ID / Name</th>
                          <th className="pb-3">Designation</th>
                          <th className="pb-3">Role</th>
                          <th className="pb-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-850">
                        {teachers.map(t => (
                          <tr key={t.id} className="text-gray-300 hover:bg-gray-800/20">
                            <td className="py-3">
                              <span className="font-semibold text-white block">{t.name}</span>
                              <span className="text-xs text-gray-500">{t.id}</span>
                            </td>
                            <td className="py-3">{t.designation}</td>
                            <td className="py-3">
                              <span className={`text-xs px-2 py-0.5 rounded font-bold ${t.isAdmin ? "bg-amber-950 border border-amber-800 text-amber-300" : "bg-teal-950 border border-teal-800 text-teal-300"}`}>
                                {t.isAdmin ? "Admin" : "Teacher"}
                              </span>
                            </td>
                            <td className="py-3 text-right">
                              <button onClick={() => deleteTeacher(t.id)} className="p-1.5 bg-red-950/40 border border-red-900/60 text-red-400 rounded-lg hover:bg-red-900/80 hover:text-white transition">
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                        {teachers.length === 0 && (
                          <tr>
                            <td colSpan={4} className="py-4 text-center text-gray-500 italic text-xs">No teacher profiles pre-registered yet.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 2: CLASSES */}
          {activeTab === "classes" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fadeIn">
              <div className="lg:col-span-1 bg-gray-800/50 p-6 rounded-2xl border border-gray-700/60 shadow-xl h-fit">
                <h3 className="text-xl font-bold text-white mb-6">Create New Class</h3>
                <form onSubmit={classForm.handleSubmit(onClassSubmit)} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Class Name</label>
                    <input {...classForm.register("name")} placeholder="Class-6" className="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:border-blue-500 focus:outline-none" />
                    {classForm.formState.errors.name && <p className="text-red-400 text-xs mt-1">{classForm.formState.errors.name.message}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Description</label>
                    <textarea {...classForm.register("description")} placeholder="Add class details..." className="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:border-blue-500 focus:outline-none" rows={3}></textarea>
                  </div>
                  <button type="submit" className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition text-sm">
                    Create Class
                  </button>
                </form>
              </div>

              <div className="lg:col-span-2 bg-gray-800/30 p-6 rounded-2xl border border-gray-800 shadow-lg">
                <h3 className="text-xl font-bold text-white mb-6">Class List</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {classes.map(c => (
                    <div key={c.id} className="p-4 bg-gray-850 border border-gray-800 rounded-xl">
                      <h4 className="font-bold text-lg text-white">{c.name}</h4>
                      <p className="text-sm text-gray-400 mt-2 line-clamp-3">{c.description || "No description provided."}</p>
                    </div>
                  ))}
                  {classes.length === 0 && (
                    <p className="col-span-2 text-center text-gray-500 italic text-sm py-8">No class courses configured yet.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SUBJECTS */}
          {activeTab === "subjects" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fadeIn">
              <div className="lg:col-span-1 bg-gray-800/50 p-6 rounded-2xl border border-gray-700/60 shadow-xl h-fit">
                <h3 className="text-xl font-bold text-white mb-6">Create New Subject</h3>
                <form onSubmit={subjectForm.handleSubmit(onSubjectSubmit)} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Subject Name</label>
                    <input {...subjectForm.register("name")} placeholder="Mathematics" className="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:border-blue-500 focus:outline-none" />
                    {subjectForm.formState.errors.name && <p className="text-red-400 text-xs mt-1">{subjectForm.formState.errors.name.message}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Assign to Class Course</label>
                    <select {...subjectForm.register("classCourseId")} className="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:border-blue-500 focus:outline-none">
                      <option value="">Select Class...</option>
                      {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    {subjectForm.formState.errors.classCourseId && <p className="text-red-400 text-xs mt-1">{subjectForm.formState.errors.classCourseId.message}</p>}
                  </div>
                  <button type="submit" className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition text-sm">
                    Create Subject
                  </button>
                </form>
              </div>

              <div className="lg:col-span-2 bg-gray-800/30 p-6 rounded-2xl border border-gray-800 shadow-lg">
                <h3 className="text-xl font-bold text-white mb-6">Subjects & Teacher Assignments</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-gray-800 text-gray-400 uppercase tracking-wider text-xs">
                        <th className="pb-3">Subject Name</th>
                        <th className="pb-3">Class Course</th>
                        <th className="pb-3">Assigned Teacher</th>
                        <th className="pb-3 text-right">Assign Teacher Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-850">
                      {subjects.map(s => {
                        const classObj = classes.find(c => c.id === s.classCourseId);
                        const teacherObj = teachers.find(t => t.id === s.assignedTeacherId);
                        
                        return (
                          <tr key={s.id} className="text-gray-300 hover:bg-gray-800/20">
                            <td className="py-3 font-semibold text-white">{s.name}</td>
                            <td className="py-3">{classObj?.name || "Unknown Class"}</td>
                            <td className="py-3">
                              {teacherObj ? (
                                <span className="text-teal-400 font-semibold">{teacherObj.name} ({teacherObj.designation})</span>
                              ) : (
                                <span className="text-red-400 italic text-xs">Unassigned</span>
                              )}
                            </td>
                            <td className="py-3 text-right">
                              <select
                                onChange={(e) => assignTeacherToSubject(s.id, e.target.value)}
                                defaultValue={s.assignedTeacherId || ""}
                                className="p-1.5 bg-gray-900 border border-gray-700 rounded text-white text-xs focus:outline-none"
                              >
                                <option value="">-- Assign Teacher --</option>
                                {teachers.map(t => (
                                  <option key={t.id} value={t.id}>{t.name} ({t.designation})</option>
                                ))}
                              </select>
                            </td>
                          </tr>
                        );
                      })}
                      {subjects.length === 0 && (
                        <tr>
                          <td colSpan={4} className="py-4 text-center text-gray-500 italic text-xs">No subjects created yet.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-8 animate-fadeIn">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Global Assignments */}
                <div className="bg-gray-800/30 p-6 rounded-2xl border border-gray-800 shadow-lg">
                  <h3 className="text-xl font-bold text-white mb-6 flex items-center justify-between">
                    <span>Global Assignments Directory</span>
                    <span className="text-xs bg-indigo-950/60 border border-indigo-800 text-indigo-300 px-2 py-0.5 rounded-full">{assignments.length} Total</span>
                  </h3>
                  <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                    {assignments.map(a => {
                      const classObj = classes.find(c => c.id === a.classCourseId);
                      const subjectObj = subjects.find(s => s.id === a.subjectId);
                      const isPast = new Date() > new Date(a.dueDate);
                      
                      return (
                        <div key={a.id} className="p-4 bg-gray-850 border border-gray-800 rounded-xl">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-bold text-white text-base">{a.title}</h4>
                              <p className="text-xs text-gray-400 mt-1 line-clamp-2">{a.description}</p>
                            </div>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${a.status === "Published" ? "bg-emerald-950 text-emerald-300 border border-emerald-800" : "bg-gray-900 text-gray-400 border border-gray-800"}`}>
                              {a.status}
                            </span>
                          </div>
                          
                          <div className="flex flex-wrap gap-3 mt-4 text-xs text-gray-500 border-t border-gray-800/60 pt-3">
                            <span>Class: <strong className="text-gray-300">{classObj?.name || "N/A"}</strong></span>
                            <span>Subject: <strong className="text-gray-300">{subjectObj?.name || "N/A"}</strong></span>
                            <span>Max Marks: <strong className="text-gray-300">{a.maxMarks}</strong></span>
                            <span className={isPast ? "text-red-400" : "text-blue-400"}>
                              Due: {new Date(a.dueDate).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                    {assignments.length === 0 && (
                      <p className="text-center text-gray-500 italic text-sm py-8">No assignments created yet.</p>
                    )}
                  </div>
                </div>

                {/* Global Submissions */}
                <div className="bg-gray-800/30 p-6 rounded-2xl border border-gray-800 shadow-lg">
                  <h3 className="text-xl font-bold text-white mb-6 flex items-center justify-between">
                    <span>Global Submissions Ledger</span>
                    <span className="text-xs bg-emerald-950/60 border border-emerald-800 text-emerald-300 px-2 py-0.5 rounded-full">{submissions.length} Total</span>
                  </h3>
                  <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                    {submissions.map(sub => {
                      const assignObj = assignments.find(a => a.id === sub.assignmentId);
                      const studentObj = students.find(s => s.id === sub.studentId || s.email === sub.studentId); // matches either
                      
                      return (
                        <div key={sub.id} className="p-4 bg-gray-850 border border-gray-800 rounded-xl">
                          <div className="flex justify-between items-center mb-3">
                            <div>
                              <span className="text-xs text-gray-500">Assignment:</span>
                              <h4 className="font-bold text-gray-200 text-sm">{assignObj?.title || "Unknown Assignment"}</h4>
                            </div>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${sub.status === "Graded" ? "bg-emerald-950 text-emerald-300 border border-emerald-800" : "bg-amber-950 text-amber-300 border border-amber-800"}`}>
                              {sub.status}
                            </span>
                          </div>

                          <p className="text-xs text-gray-400 bg-gray-900/60 p-2 border border-gray-800 rounded-lg italic line-clamp-2">
                            "{sub.content}"
                          </p>

                          <div className="flex justify-between items-center mt-3 text-xs text-gray-500 border-t border-gray-800/60 pt-2.5">
                            <span>Student: <strong className="text-gray-300">{studentObj?.name || sub.studentId}</strong></span>
                            {sub.status === "Graded" && (
                              <span>Marks: <strong className="text-emerald-400 font-bold">{sub.marks} / {assignObj?.maxMarks}</strong></span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {submissions.length === 0 && (
                      <p className="text-center text-gray-500 italic text-sm py-8">No submissions recorded yet.</p>
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 5: SETTINGS */}
          {activeTab === "settings" && (
            <div className="bg-gray-800/50 p-6 rounded-2xl border border-gray-700/60 shadow-xl max-w-2xl animate-fadeIn">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Settings size={20} className="text-blue-400" /> System Settings
              </h3>
              
              <div className="space-y-6">
                <div>
                  <h4 className="font-bold text-white mb-2">Configure Late Submissions</h4>
                  <p className="text-xs text-gray-400 mb-4">
                    Control which specific assignments allow students to submit answers after their deadlines.
                  </p>

                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                    {assignments.length === 0 && (
                      <p className="text-center text-gray-500 italic text-sm py-8">No assignments found.</p>
                    )}
                    {assignments.map((a) => {
                      const classObj = classes.find(c => c.id === a.classCourseId);
                      const subjectObj = subjects.find(s => s.id === a.subjectId);
                      
                      return (
                        <div key={a.id} className="flex items-center justify-between p-3.5 bg-gray-900 border border-gray-850 rounded-xl hover:border-gray-800 transition">
                          <div className="flex-1 mr-4">
                            <h5 className="font-semibold text-white text-sm">{a.title}</h5>
                            <div className="flex gap-3 text-[10px] text-gray-500 mt-1">
                              <span>Class: <strong>{classObj?.name || "N/A"}</strong></span>
                              <span>Subject: <strong>{subjectObj?.name || "N/A"}</strong></span>
                              <span>Due: <strong>{new Date(a.dueDate).toLocaleDateString()}</strong></span>
                            </div>
                          </div>
                          
                          <label htmlFor={`toggle-late-${a.id}`} className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              id={`toggle-late-${a.id}`}
                              checked={a.allowLateSubmissions}
                              onChange={(e) => toggleAssignmentLateSubmission(a.id, e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </ProtectedRoute>
  );
}
