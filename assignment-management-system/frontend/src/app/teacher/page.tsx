"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import api from "@/lib/axios";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import { Trash2, Edit, Users, CheckCircle } from "lucide-react";

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
  const [students, setStudents] = useState<any[]>([]); // NEW: State to hold student data

  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeAssignment, setActiveAssignment] = useState<any | null>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [gradingSubmissionId, setGradingSubmissionId] = useState<string | null>(
    null,
  );

  const [error, setError] = useState("");

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
      // NEW: Added the /Users endpoint to our initial data fetch
      const [classRes, subRes, assignRes, usersRes] = await Promise.all([
        api.get("/Admin/classes"),
        api.get("/Admin/subjects"),
        api.get("/Assignments"),
        api.get("/Users"),
      ]);

      setClasses(classRes.data);
      setSubjects(subRes.data);

      // Filter the users to only keep students
      const onlyStudents = usersRes.data.filter(
        (u: any) => u.role === "Student",
      );
      setStudents(onlyStudents);

      const myAssignments = assignRes.data.filter(
        (a: any) => a.teacherId === user?.id,
      );
      setAssignments(myAssignments);
    } catch (err: any) {
      console.error("Failed to fetch data", err);
    }
  };

  const onSubmit = async (data: AssignmentFormValues) => {
    try {
      setError("");
      if (editingId) {
        await api.put(`/Assignments/${editingId}`, data);
        setEditingId(null);
      } else {
        await api.post("/Assignments", data);
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
      setError(
        editingId
          ? "Failed to update assignment."
          : "Failed to create assignment.",
      );
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
      fetchData();
    } catch (err: any) {
      alert("Failed to delete assignment.");
    }
  };

  const viewSubmissions = async (assignment: any) => {
    try {
      setActiveAssignment(assignment);
      setEditingId(null);
      const res = await api.get(`/Submissions/assignment/${assignment.id}`);
      setSubmissions(res.data);
    } catch (err) {
      alert("Failed to load submissions.");
    }
  };

  const openGradingForm = (sub: any) => {
    setGradingSubmissionId(sub.id);
    gradeForm.reset({
      marks: sub.marks || 0,
      feedback: sub.feedback || "",
      status: sub.status === "Pending" ? "Graded" : sub.status,
    });
  };

  const submitGrade = async (data: GradingFormValues) => {
    try {
      await api.put(`/Submissions/${gradingSubmissionId}/grade`, data);
      setGradingSubmissionId(null);
      if (activeAssignment) viewSubmissions(activeAssignment);
    } catch (err) {
      alert("Failed to save grade.");
    }
  };

  return (
    <ProtectedRoute allowedRoles={["Teacher"]}>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="p-8 max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-800 mb-6">
            Teacher Dashboard
          </h2>

          {error && (
            <div className="bg-red-100 text-red-700 p-3 rounded mb-6">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              {activeAssignment ? (
                <div className="bg-white p-6 rounded-lg shadow-sm border-t-4 border-green-600">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-gray-800">
                      Submissions
                    </h3>
                    <button
                      onClick={() => setActiveAssignment(null)}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Close
                    </button>
                  </div>

                  <p className="text-sm text-gray-600 mb-4">
                    <strong>Assignment:</strong> {activeAssignment.title} (Max:{" "}
                    {activeAssignment.maxMarks})
                  </p>

                  <div className="space-y-4 max-h-[500px] overflow-y-auto">
                    {submissions.length === 0 && (
                      <p className="text-sm text-gray-500 italic">
                        No submissions yet.
                      </p>
                    )}

                    {submissions.map((sub) => {
                      // NEW: Match the submission's studentId with our students array
                      const studentInfo = students.find(
                        (s) => s.id === sub.studentId,
                      );

                      return (
                        <div
                          key={sub.id}
                          className="border p-3 rounded bg-gray-50"
                        >
                          {/* NEW: Display Student Name and Email */}
                          <div className="mb-3 pb-2 border-b border-gray-200">
                            <p className="font-bold text-gray-800 text-sm">
                              {studentInfo?.name || "Unknown Student"}
                            </p>
                            <p className="text-xs text-gray-500">
                              {studentInfo?.email || "No email available"}
                            </p>
                          </div>

                          <div className="flex justify-between items-start mb-2">
                            <span
                              className={`text-xs px-2 py-1 rounded font-bold ${sub.status === "Graded" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}
                            >
                              {sub.status}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(sub.submittedAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-800 mb-3 bg-white p-2 border rounded">
                            "{sub.content}"
                          </p>

                          {gradingSubmissionId === sub.id ? (
                            <form
                              onSubmit={gradeForm.handleSubmit(submitGrade)}
                              className="space-y-2 border-t pt-2"
                            >
                              <div>
                                <label className="text-xs font-bold text-gray-700">
                                  Marks
                                </label>
                                <input
                                  type="number"
                                  {...gradeForm.register("marks")}
                                  className="w-full p-1 border rounded text-sm text-gray-900"
                                />
                              </div>
                              <div>
                                <label className="text-xs font-bold text-gray-700">
                                  Feedback
                                </label>
                                <textarea
                                  {...gradeForm.register("feedback")}
                                  className="w-full p-1 border rounded text-sm text-gray-900"
                                  rows={2}
                                ></textarea>
                              </div>
                              <div>
                                <label className="text-xs font-bold text-gray-700">
                                  Status
                                </label>
                                <select
                                  {...gradeForm.register("status")}
                                  className="w-full p-1 border rounded text-sm text-gray-900 bg-white"
                                >
                                  <option value="Graded">Graded</option>
                                  <option value="Needs Revision">
                                    Needs Revision
                                  </option>
                                </select>
                              </div>
                              <div className="flex gap-2 mt-2">
                                <button
                                  type="submit"
                                  className="bg-green-600 text-white px-3 py-1 rounded text-sm flex-1"
                                >
                                  Save Grade
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setGradingSubmissionId(null)}
                                  className="bg-gray-500 text-white px-3 py-1 rounded text-sm"
                                >
                                  Cancel
                                </button>
                              </div>
                            </form>
                          ) : (
                            <div className="border-t pt-2 mt-2">
                              {sub.status === "Graded" && (
                                <p className="text-xs text-green-700 font-bold mb-1">
                                  Score: {sub.marks} /{" "}
                                  {activeAssignment.maxMarks}
                                </p>
                              )}
                              <button
                                onClick={() => openGradingForm(sub)}
                                className="text-blue-600 text-sm font-medium hover:underline flex items-center gap-1"
                              >
                                <CheckCircle size={14} />{" "}
                                {sub.status === "Graded"
                                  ? "Edit Grade"
                                  : "Grade Submission"}
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="bg-white p-6 rounded-lg shadow-sm border-t-4 border-indigo-600">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">
                    {editingId ? "Edit Assignment" : "Create Assignment"}
                  </h3>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-4"
                  >
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Title
                      </label>
                      <input
                        {...form.register("title")}
                        className="mt-1 w-full p-2 border rounded text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Description
                      </label>
                      <textarea
                        {...form.register("description")}
                        className="mt-1 w-full p-2 border rounded text-gray-900"
                        rows={3}
                      ></textarea>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Class
                      </label>
                      <select
                        {...form.register("classCourseId")}
                        className="mt-1 w-full p-2 border rounded bg-white text-gray-900"
                      >
                        <option value="">Select a Class...</option>
                        {classes.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Subject
                      </label>
                      <select
                        {...form.register("subjectId")}
                        className="mt-1 w-full p-2 border rounded bg-white text-gray-900"
                        disabled={!selectedClassId}
                      >
                        <option value="">Select a Subject...</option>
                        {filteredSubjects.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Due Date
                        </label>
                        <input
                          type="datetime-local"
                          {...form.register("dueDate")}
                          className="mt-1 w-full p-2 border rounded text-gray-900"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Max Marks
                        </label>
                        <input
                          type="number"
                          {...form.register("maxMarks")}
                          className="mt-1 w-full p-2 border rounded text-gray-900"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Status
                      </label>
                      <select
                        {...form.register("status")}
                        className="mt-1 w-full p-2 border rounded bg-white text-gray-900"
                      >
                        <option value="Draft">Draft</option>
                        <option value="Published">Published</option>
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
                      >
                        {editingId ? "Update" : "Save"}
                      </button>
                      {editingId && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(null);
                            form.reset();
                          }}
                          className="flex-1 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
                </div>
              )}
            </div>

            <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-sm border-t-4 border-orange-600">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                My Assignments
              </h3>

              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                {assignments.map((a) => (
                  <div
                    key={a.id}
                    className="p-4 border rounded-lg bg-gray-50 flex justify-between items-start"
                  >
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h4 className="font-bold text-gray-800 text-lg">
                          {a.title}
                        </h4>
                        <span
                          className={`px-2 py-1 text-xs rounded-full font-medium ${a.status === "Published" ? "bg-green-100 text-green-800" : "bg-gray-200 text-gray-700"}`}
                        >
                          {a.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {a.description}
                      </p>
                      <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                        <span>
                          <strong>Class:</strong>{" "}
                          {classes.find((c) => c.id === a.classCourseId)
                            ?.name || "Unknown"}
                        </span>
                        <span>
                          <strong>Subject:</strong>{" "}
                          {subjects.find((s) => s.id === a.subjectId)?.name ||
                            "Unknown"}
                        </span>
                        <span>
                          <strong>Due:</strong>{" "}
                          {new Date(a.dueDate).toLocaleString()}
                        </span>
                        <span>
                          <strong>Marks:</strong> {a.maxMarks}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => viewSubmissions(a)}
                        className="text-green-600 hover:text-green-800 p-2 bg-green-50 hover:bg-green-100 rounded transition flex items-center gap-1"
                        title="View Submissions"
                      >
                        <Users size={18} />{" "}
                        <span className="text-xs font-bold">Grade</span>
                      </button>
                      <button
                        onClick={() => handleEdit(a)}
                        className="text-blue-500 hover:text-blue-700 p-2 bg-blue-50 hover:bg-blue-100 rounded transition"
                        title="Edit Assignment"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => deleteAssignment(a.id)}
                        className="text-red-500 hover:text-red-700 p-2 bg-red-50 hover:bg-red-100 rounded transition"
                        title="Delete Assignment"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
