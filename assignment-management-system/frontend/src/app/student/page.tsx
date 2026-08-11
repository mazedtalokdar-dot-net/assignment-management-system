"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import api from "@/lib/axios";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import { Send, Edit3, CheckCircle } from "lucide-react";

export default function StudentDashboard() {
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState("");

  const [assignments, setAssignments] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);

  const [activeAssignmentId, setActiveAssignmentId] = useState<string | null>(
    null,
  );
  const [submissionContent, setSubmissionContent] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [classRes, subRes, submsRes] = await Promise.all([
        api.get("/Admin/classes"),
        api.get("/Admin/subjects"),
        api.get("/Submissions/my-submissions"),
      ]);
      setClasses(classRes.data);
      setSubjects(subRes.data);
      setSubmissions(submsRes.data);
    } catch (err) {
      console.error("Failed to fetch initial data");
    }
  };

  // Fetch assignments when a class is selected
  useEffect(() => {
    if (!selectedClass) {
      setAssignments([]);
      return;
    }
    const fetchAssignments = async () => {
      try {
        const res = await api.get(`/Assignments/class/${selectedClass}`);
        setAssignments(res.data);
      } catch (err) {
        console.error("Failed to fetch assignments");
      }
    };
    fetchAssignments();
  }, [selectedClass]);

  const getSubmissionForAssignment = (assignmentId: string) => {
    return submissions.find((s) => s.assignmentId === assignmentId);
  };

  const handleActionClick = (
    assignmentId: string,
    existingContent: string = "",
  ) => {
    setActiveAssignmentId(assignmentId);
    setSubmissionContent(existingContent);
    setError("");
    setSuccess("");
  };

  const submitWork = async (assignmentId: string) => {
    if (!submissionContent.trim()) {
      setError("Submission content cannot be empty.");
      return;
    }

    try {
      const existingSubmission = getSubmissionForAssignment(assignmentId);

      if (existingSubmission) {
        // Update existing submission
        await api.put(`/Submissions/${existingSubmission.id}`, {
          content: submissionContent,
        });
      } else {
        // Create new submission
        await api.post("/Submissions", {
          assignmentId,
          content: submissionContent,
        });
      }

      setSuccess("Assignment submitted successfully!");
      setActiveAssignmentId(null);
      setSubmissionContent("");

      // Refresh submissions
      const submsRes = await api.get("/Submissions/my-submissions");
      setSubmissions(submsRes.data);
    } catch (err: any) {
      setError(err.response?.data || "Failed to submit assignment.");
    }
  };

  return (
    <ProtectedRoute allowedRoles={["Student"]}>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="p-8 max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-800 mb-6">
            Student Dashboard
          </h2>

          {/* Class Selector */}
          <div className="bg-white p-6 rounded-lg shadow-sm border-t-4 border-purple-600 mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select your Class to view Assignments
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full md:w-1/3 p-2 border rounded bg-white text-gray-900"
            >
              <option value="">-- Choose a Class --</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-100 text-green-700 p-3 rounded mb-4">
              {success}
            </div>
          )}

          <div className="grid grid-cols-1 gap-6">
            {assignments.map((a) => {
              const submission = getSubmissionForAssignment(a.id);
              const isPastDeadline = new Date() > new Date(a.dueDate);
              const isEditing = activeAssignmentId === a.id;

              return (
                <div
                  key={a.id}
                  className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-800">
                        {a.title}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {a.description}
                      </p>
                      <div className="flex gap-4 mt-3 text-xs text-gray-500">
                        <span className="bg-gray-100 px-2 py-1 rounded">
                          {subjects.find((s) => s.id === a.subjectId)?.name ||
                            "Subject"}
                        </span>
                        <span
                          className={`px-2 py-1 rounded ${isPastDeadline ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"}`}
                        >
                          Due: {new Date(a.dueDate).toLocaleString()}
                        </span>
                        <span className="bg-gray-100 px-2 py-1 rounded">
                          Max Marks: {a.maxMarks}
                        </span>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div>
                      {submission ? (
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${
                            submission.status === "Graded"
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {submission.status}
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-200 text-gray-700">
                          Not Submitted
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Submission Form Area */}
                  {isEditing ? (
                    <div className="mt-4 border-t pt-4">
                      <textarea
                        value={submissionContent}
                        onChange={(e) => setSubmissionContent(e.target.value)}
                        placeholder="Type your answer here..."
                        className="w-full p-3 border rounded text-gray-900 mb-3"
                        rows={4}
                      ></textarea>
                      <div className="flex gap-2">
                        <button
                          onClick={() => submitWork(a.id)}
                          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-2"
                        >
                          <Send size={16} /> Submit
                        </button>
                        <button
                          onClick={() => setActiveAssignmentId(null)}
                          className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 border-t pt-4">
                      {submission && submission.status === "Graded" ? (
                        <div className="bg-green-50 p-4 rounded border border-green-200">
                          <p className="text-green-800 font-bold mb-1">
                            Graded: {submission.marks} / {a.maxMarks}
                          </p>
                          <p className="text-sm text-green-700">
                            <strong>Feedback:</strong>{" "}
                            {submission.feedback || "No feedback provided."}
                          </p>
                        </div>
                      ) : (
                        <div>
                          {submission && (
                            <div className="bg-gray-50 p-3 rounded mb-3 text-sm text-gray-700">
                              <strong>Your latest submission:</strong>{" "}
                              {submission.content}
                            </div>
                          )}
                          {!isPastDeadline ? (
                            <button
                              onClick={() =>
                                handleActionClick(a.id, submission?.content)
                              }
                              className="text-blue-600 border border-blue-600 px-4 py-2 rounded hover:bg-blue-50 transition flex items-center gap-2"
                            >
                              {submission ? (
                                <>
                                  <Edit3 size={16} /> Update Submission
                                </>
                              ) : (
                                <>
                                  <Send size={16} /> Add Submission
                                </>
                              )}
                            </button>
                          ) : (
                            <p className="text-red-500 text-sm font-semibold flex items-center gap-1">
                              Deadline has passed. No further updates allowed.
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {selectedClass && assignments.length === 0 && (
              <div className="text-center p-8 text-gray-500 bg-white rounded-lg shadow-sm">
                No published assignments found for this class.
              </div>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
