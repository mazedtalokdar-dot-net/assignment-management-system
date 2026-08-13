"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import api from "@/lib/axios";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import { Trash2, Edit, Users, CheckCircle, ChevronDown, ChevronUp, Calendar, FileText } from "lucide-react";

const assignmentSchema = z.object({
  title: z.string().min(2, "Title is required"),
  description: z.string().optional(),
  dueDate: z.string().min(1, "Due date is required"),
  classCourseId: z.string().min(1, "Class is required"),
  subjectId: z.string().min(1, "Subject is required"),
  maxMarks: z.coerce.number().min(1, "Marks must be at least 1"),
  status: z.enum(["Draft", "Published"]),
});

const gradingSchema = z.object({
  marks: z.coerce.number().min(0, "Marks cannot be negative"),
  feedback: z.string().optional(),
  status: z.enum(["Graded", "Needs Revision"]),
});

type AssignmentFormValues = z.infer<typeof assignmentSchema>;
type GradingFormValues = z.infer<typeof gradingSchema>;

export default function TeacherDashboard() {
  const { user } = useAuth();

  const [assignments, setAssignments] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [teacherProfile, setTeacherProfile] = useState<any | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeAssignment, setActiveAssignment] = useState<any | null>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [expandedSubId, setExpandedSubId] = useState<string | null>(null); // State to toggle clicked submission detail view
  const [gradingSubmissionId, setGradingSubmissionId] = useState<string | null>(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const form = useForm<AssignmentFormValues>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: { status: "Draft" },
  });

  const gradeForm = useForm<GradingFormValues>({
    resolver: zodResolver(gradingSchema),
    defaultValues: { status: "Graded" },
  });

  const selectedClassId = form.watch("classCourseId");
  const filteredSubjects = subjects.filter(
    (s) => s.classCourseId === selectedClassId,
  );

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      const [classRes, subRes, assignRes, studentsRes, meRes] = await Promise.all([
        api.get("/Admin/classes"),
        api.get("/Admin/subjects"),
        api.get("/Assignments"),
        api.get("/Admin/students").catch(() => ({ data: [] })), // Allow fallback
        api.get("/Users/me").catch(() => ({ data: null })), // Fetch teacher profile
      ]);

      setClasses(classRes.data);
      setSubjects(subRes.data);
      setStudents(studentsRes.data);

      if (meRes && meRes.data && meRes.data.teacherProfile) {
        setTeacherProfile(meRes.data.teacherProfile);
      }

      const myAssignments = assignRes.data.filter(
        (a: any) => a.teacherId === user?.id,
      );
      setAssignments(myAssignments);
    } catch (err: any) {
      console.error("Failed to fetch teacher dashboard data", err);
    }
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
    }, 4500);
  };

  const onSubmit = async (data: AssignmentFormValues) => {
    try {
      // Validate that the teacher is assigned to the selected subject
      const subjectObj = subjects.find((s) => s.id === data.subjectId);
      if (subjectObj && (!teacherProfile || subjectObj.assignedTeacherId !== teacherProfile.id)) {
        showNotification("You can only create assignments for subjects assigned to you.", true);
        return;
      }

      if (editingId) {
        await api.put(`/Assignments/${editingId}`, data);
        setEditingId(null);
        showNotification("Assignment updated successfully!");
      } else {
        await api.post("/Assignments", data);
        showNotification("Assignment created successfully!");
      }
      form.reset({
        title: "",
        description: "",
        classCourseId: "",
        subjectId: "",
        dueDate: "",
        maxMarks: 0,
        status: "Draft",
      });
      fetchData();
    } catch (err: any) {
      showNotification(editingId ? "Failed to update assignment." : "Failed to create assignment.", true);
    }
  };

  const handleEdit = (a: any) => {
    setEditingId(a.id);
    setActiveAssignment(null);
    const formattedDate = new Date(a.dueDate).toISOString().slice(0, 16);
    form.reset({ ...a, dueDate: formattedDate });
  };

  const deleteAssignment = async (id: string) => {
    if (!confirm("Are you sure you want to delete this assignment?")) return;
    try {
      await api.delete(`/Assignments/${id}`);
      if (activeAssignment?.id === id) setActiveAssignment(null);
      showNotification("Assignment deleted successfully.");
      fetchData();
    } catch (err: any) {
      showNotification("Failed to delete assignment.", true);
    }
  };

  const viewSubmissions = async (assignment: any) => {
    try {
      setActiveAssignment(assignment);
      setEditingId(null);
      setExpandedSubId(null);
      setGradingSubmissionId(null);
      const res = await api.get(`/Submissions/assignment/${assignment.id}`);
      setSubmissions(res.data);
    } catch (err) {
      alert("Failed to load submissions.");
    }
  };

  const toggleSubmissionDetails = (subId: string) => {
    setExpandedSubId(expandedSubId === subId ? null : subId);
    setGradingSubmissionId(null); // Reset grading panel when toggling
  };

  const openGradingForm = (e: React.MouseEvent, sub: any) => {
    e.stopPropagation(); // Stop parent click event
    setGradingSubmissionId(sub.id);
    gradeForm.reset({
      marks: sub.marks || 0,
      feedback: sub.feedback || "",
      status: sub.status === "Pending" ? "Graded" : sub.status,
    });
  };

  const submitGrade = async (data: GradingFormValues) => {
    if (activeAssignment && data.marks > activeAssignment.maxMarks) {
      showNotification(`Marks cannot exceed the assignment maximum marks of ${activeAssignment.maxMarks}.`, true);
      return;
    }
    try {
      await api.put(`/Submissions/${gradingSubmissionId}/grade`, data);
      setGradingSubmissionId(null);
      showNotification("Submission graded successfully!");
      if (activeAssignment) viewSubmissions(activeAssignment);
    } catch (err: any) {
      const errMsg = err.response?.data?.message || err.response?.data || "Failed to save grade.";
      showNotification(errMsg, true);
    }
  };

  return (
    <ProtectedRoute allowedRoles={["Teacher"]}>
      <div className="min-h-screen bg-gray-900 text-gray-100 font-sans">
        <Navbar />
        <main className="p-8 max-w-7xl mx-auto">
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 pb-6 border-b border-gray-800">
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight text-white bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400">
                Teacher Dashboard
              </h2>
              <p className="text-sm text-gray-400 mt-1">
                Construct course tasks, manage student assignments, and evaluate student submission results.
              </p>
            </div>
          </div>

          {error && (
            <div className="bg-red-900/60 border border-red-800 text-red-200 p-3 rounded-lg mb-6 shadow text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-emerald-950/60 border border-emerald-800 text-emerald-200 p-3 rounded-lg mb-6 shadow text-sm">
              {success}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column: Form or Submissions */}
            <div className="lg:col-span-1">
              {activeAssignment ? (
                <div className="bg-gray-800 border border-gray-700 p-6 rounded-2xl shadow-xl">
                  <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-700">
                    <h3 className="text-lg font-bold text-white">
                      Submissions Ledger
                    </h3>
                    <button
                      onClick={() => setActiveAssignment(null)}
                      className="text-xs text-blue-400 hover:text-blue-300 font-semibold"
                    >
                      Close Panel
                    </button>
                  </div>

                  <div className="mb-4 p-3 bg-gray-900 border border-gray-800 rounded-xl text-xs space-y-1.5 text-gray-400">
                    <p className="font-semibold text-gray-200 line-clamp-1">Task: {activeAssignment.title}</p>
                    <p>Max Score: <span className="text-white font-bold">{activeAssignment.maxMarks}</span> | Due: <span className="text-white">{new Date(activeAssignment.dueDate).toLocaleDateString()}</span></p>
                  </div>

                  {/* Submissions List */}
                  <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                    {submissions.length === 0 && (
                      <p className="text-center py-6 text-gray-500 italic text-xs">
                        No submissions recorded yet.
                      </p>
                    )}

                    {submissions.map((sub) => {
                      const isExpanded = expandedSubId === sub.id;
                      return (
                        <div
                          key={sub.id}
                          onClick={() => toggleSubmissionDetails(sub.id)}
                          className={`border rounded-xl p-3.5 transition cursor-pointer ${
                            isExpanded 
                              ? "bg-gray-900/60 border-teal-500/50 shadow-md" 
                              : "bg-gray-850 border-gray-800 hover:border-gray-750 hover:bg-gray-800/40"
                          }`}
                        >
                          {/* Submission Header Row */}
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-bold text-white text-sm">
                                {sub.studentName}
                              </p>
                              <p className="text-xs text-gray-400">
                                Roll: <strong className="text-gray-300">{sub.studentRoll}</strong> | Reg: <strong className="text-gray-300">{sub.studentRegNo}</strong>
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-1.5">
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                  sub.status === "Graded" 
                                    ? "bg-emerald-950 text-emerald-300 border border-emerald-800" 
                                    : sub.status === "Needs Revision"
                                    ? "bg-rose-950 text-rose-300 border border-rose-800"
                                    : "bg-amber-950 text-amber-300 border border-amber-800"
                                }`}
                              >
                                {sub.status}
                              </span>
                              <span className="text-[10px] text-gray-500">
                                {new Date(sub.submittedAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>

                          {/* Expanded Details View */}
                          {isExpanded && (
                            <div className="mt-4 pt-3 border-t border-gray-800/80 space-y-4" onClick={e => e.stopPropagation()}>
                              <div>
                                <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Submitted Answer:</span>
                                <div className="mt-1 p-3 bg-gray-900 border border-gray-850 rounded-lg text-xs text-gray-300 font-mono whitespace-pre-wrap">
                                  {sub.content}
                                </div>
                              </div>

                              {/* Grading Form Panel */}
                              {gradingSubmissionId === sub.id ? (
                                <form
                                  onSubmit={gradeForm.handleSubmit(submitGrade)}
                                  className="space-y-3 p-3 bg-gray-950 border border-gray-850 rounded-xl"
                                >
                                  <div>
                                    <label className="block text-xs font-semibold text-gray-400 mb-1">Marks Assigned</label>
                                    <input
                                      type="number"
                                      {...gradeForm.register("marks")}
                                      className="w-full p-2 bg-gray-900 border border-gray-700 rounded text-white text-xs focus:outline-none"
                                    />
                                    {gradeForm.formState.errors.marks && <p className="text-red-400 text-xs mt-1">{gradeForm.formState.errors.marks.message}</p>}
                                  </div>
                                  <div>
                                    <label className="block text-xs font-semibold text-gray-400 mb-1">Feedback</label>
                                    <textarea
                                      {...gradeForm.register("feedback")}
                                      className="w-full p-2 bg-gray-900 border border-gray-700 rounded text-white text-xs focus:outline-none"
                                      rows={2}
                                    ></textarea>
                                  </div>
                                  <div>
                                    <label className="block text-xs font-semibold text-gray-400 mb-1">Status Status</label>
                                    <select
                                      {...gradeForm.register("status")}
                                      className="w-full p-2 bg-gray-900 border border-gray-700 rounded text-white text-xs focus:outline-none"
                                    >
                                      <option value="Graded">Graded</option>
                                      <option value="Needs Revision">Needs Revision</option>
                                    </select>
                                  </div>
                                  <div className="flex gap-2 pt-1.5">
                                    <button
                                      type="submit"
                                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded text-xs font-semibold flex-1"
                                    >
                                      Save Grade
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setGradingSubmissionId(null)}
                                      className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded text-xs border border-gray-750"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </form>
                              ) : (
                                <div className="pt-2 border-t border-gray-800/40 flex justify-between items-center">
                                  {sub.status === "Graded" ? (
                                    <div className="text-xs text-emerald-400 font-bold">
                                      Score: {sub.marks} / {activeAssignment.maxMarks}
                                      {sub.feedback && <p className="text-[10px] text-gray-400 font-normal mt-0.5">Feedback: "{sub.feedback}"</p>}
                                    </div>
                                  ) : (
                                    <span className="text-xs text-gray-500 italic">Ungraded</span>
                                  )}
                                  <button
                                    onClick={(e) => openGradingForm(e, sub)}
                                    className="px-3 py-1.5 bg-teal-950/40 border border-teal-900/60 text-teal-400 rounded-lg hover:bg-teal-900/80 hover:text-white transition text-xs font-bold flex items-center gap-1"
                                  >
                                    <CheckCircle size={12} /> {sub.status === "Graded" ? "Edit Grade" : "Evaluate"}
                                  </button>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Click Indicator arrow */}
                          <div className="flex justify-center mt-1.5 text-gray-600">
                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                
                // Create / Edit Assignment Form
                <div className="bg-gray-800 border border-gray-750 p-6 rounded-2xl shadow-xl">
                  <h3 className="text-xl font-bold text-white mb-6">
                    {editingId ? "Edit Assignment" : "Construct Assignment"}
                  </h3>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-4"
                  >
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
                        Task Title
                      </label>
                      <input
                        {...form.register("title")}
                        placeholder="e.g. Word Meaning Poem"
                        className="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:border-blue-500 focus:outline-none"
                      />
                      {form.formState.errors.title && <p className="text-red-400 text-xs mt-1">{form.formState.errors.title.message}</p>}
                    </div>
                    
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
                        Detailed Description
                      </label>
                      <textarea
                        {...form.register("description")}
                        placeholder="Detail instructions for the student..."
                        className="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:border-blue-500 focus:outline-none"
                        rows={3}
                      ></textarea>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1 font-medium">
                          Class / Course
                        </label>
                        <select
                          {...form.register("classCourseId")}
                          className="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:outline-none"
                        >
                          <option value="">Select Class...</option>
                          {classes.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                        {form.formState.errors.classCourseId && <p className="text-red-400 text-xs mt-1">{form.formState.errors.classCourseId.message}</p>}
                      </div>
                      
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
                          Course Subject
                        </label>
                        <select
                          {...form.register("subjectId")}
                          className="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:outline-none"
                          disabled={!selectedClassId}
                        >
                          <option value="">Select Subject...</option>
                          {filteredSubjects.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                        {form.formState.errors.subjectId && <p className="text-red-400 text-xs mt-1">{form.formState.errors.subjectId.message}</p>}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
                          Submission Deadline
                        </label>
                        <input
                          type="datetime-local"
                          {...form.register("dueDate")}
                          className="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:outline-none"
                        />
                        {form.formState.errors.dueDate && <p className="text-red-400 text-xs mt-1">{form.formState.errors.dueDate.message}</p>}
                      </div>
                      
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
                          Maximum Marks
                        </label>
                        <input
                          type="number"
                          {...form.register("maxMarks")}
                          className="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:outline-none"
                        />
                        {form.formState.errors.maxMarks && <p className="text-red-400 text-xs mt-1">{form.formState.errors.maxMarks.message}</p>}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
                        Publish Status
                      </label>
                      <select
                        {...form.register("status")}
                        className="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:outline-none"
                      >
                        <option value="Draft">Draft (Hidden)</option>
                        <option value="Published">Published (Active)</option>
                      </select>
                    </div>

                    {/* Allow Late Submissions managed strictly by Admin */}

                    <div className="flex gap-2 pt-2">
                      <button
                        type="submit"
                        className="flex-1 bg-teal-600 text-white px-4 py-2.5 rounded-lg hover:bg-teal-700 transition text-sm font-semibold"
                      >
                        {editingId ? "Update Task" : "Save Task"}
                      </button>
                      {editingId && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(null);
                            form.reset({
                              title: "",
                              description: "",
                              classCourseId: "",
                              subjectId: "",
                              dueDate: "",
                              maxMarks: 0,
                              status: "Draft",
                            });
                          }}
                          className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2.5 rounded-lg border border-gray-700 transition text-sm"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
                </div>
              )}
            </div>

            {/* Right Column: Assignments List */}
            <div className="lg:col-span-2 bg-gray-800/30 p-6 rounded-2xl border border-gray-800 shadow-lg">
              <h3 className="text-xl font-bold text-white mb-6">
                My Configured Assignments
              </h3>

              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                {assignments.map((a) => (
                  <div
                    key={a.id}
                    className="p-4 bg-gray-850 border border-gray-800 hover:border-gray-750 rounded-xl flex justify-between items-start transition"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-3">
                        <h4 className="font-bold text-white text-base">
                          {a.title}
                        </h4>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                            a.status === "Published" 
                              ? "bg-emerald-950 text-emerald-300 border border-emerald-800" 
                              : "bg-gray-900 text-gray-400 border border-gray-800"
                          }`}
                        >
                          {a.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 line-clamp-2">
                        {a.description}
                      </p>
                      
                      <div className="flex flex-wrap gap-4 text-[10px] text-gray-500 pt-1.5">
                        <span>
                          Class: <strong className="text-gray-300">{classes.find((c) => c.id === a.classCourseId)?.name || "N/A"}</strong>
                        </span>
                        <span>
                          Subject: <strong className="text-gray-300">{subjects.find((s) => s.id === a.subjectId)?.name || "N/A"}</strong>
                        </span>
                        <span>
                          Marks: <strong className="text-gray-300">{a.maxMarks}</strong>
                        </span>
                        <span>
                          Due: <strong className="text-gray-300">{new Date(a.dueDate).toLocaleString()}</strong>
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => viewSubmissions(a)}
                        className="text-teal-400 hover:text-white p-2 bg-teal-950/40 border border-teal-900/60 hover:bg-teal-900 rounded-lg transition flex items-center gap-1.5"
                        title="Evaluate Student Submissions"
                      >
                        <Users size={16} />
                        <span className="text-[10px] font-bold">Grade</span>
                      </button>
                      <button
                        onClick={() => handleEdit(a)}
                        className="text-blue-400 hover:text-white p-2 bg-blue-950/40 border border-blue-900/60 hover:bg-blue-900 rounded-lg transition"
                        title="Edit Assignment"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => deleteAssignment(a.id)}
                        className="text-red-400 hover:text-white p-2 bg-red-950/40 border border-red-900/60 hover:bg-red-900 rounded-lg transition"
                        title="Delete Assignment"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
                {assignments.length === 0 && (
                  <p className="text-center text-gray-500 italic text-sm py-12">No assignments created yet.</p>
                )}
              </div>
            </div>

          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
