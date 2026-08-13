"use client";

import { useState, useEffect } from "react";
import api from "@/lib/axios";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import { Send, CheckCircle, Calendar, Book, Clock } from "lucide-react";

export default function StudentDashboard() {
  const [studentProfile, setStudentProfile] = useState<any>(null);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState("");
  
  const [assignments, setAssignments] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);

  const [activeAssignmentId, setActiveAssignmentId] = useState<string | null>(null);
  const [submissionContent, setSubmissionContent] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [allowLateSubmissionsSetting, setAllowLateSubmissionsSetting] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [meRes, classRes, subRes, submsRes, settingsRes] = await Promise.all([
        api.get("/Users/me"),
        api.get("/Admin/classes"),
        api.get("/Admin/subjects"),
        api.get("/Submissions/my-submissions"),
        api.get("/Admin/settings").catch(() => ({ data: [] })) // Fallback if settings fails
      ]);
      
      setClasses(classRes.data);
      setSubjects(subRes.data);
      setSubmissions(submsRes.data);

      const profile = meRes.data.studentProfile;
      if (profile) {
        setStudentProfile(profile);
        setSelectedClass(profile.classCourseId);
      }

      if (settingsRes && settingsRes.data) {
        const lateSetting = settingsRes.data.find((s: any) => s.key === "AllowLateSubmissions");
        if (lateSetting) {
          setAllowLateSubmissionsSetting(lateSetting.value === "true");
        }
      }
    } catch (err) {
      console.error("Failed to fetch initial data", err);
    }
  };

  // Fetch assignments when class is resolved
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

  const handleActionClick = (assignmentId: string, existingContent: string = "") => {
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

  const studentClassObj = classes.find(c => c.id === selectedClass);

  return (
    <ProtectedRoute allowedRoles={["Student"]}>
      <div className="min-h-screen bg-gray-900 text-gray-100 font-sans">
        <Navbar />
        <main className="p-8 max-w-5xl mx-auto">
          
          {/* Header Card */}
          <div className="bg-gray-800 border border-gray-700 p-6 rounded-2xl mb-8 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <h2 className="text-2xl font-bold text-white">
                Student Portal
              </h2>
              {studentProfile && (
                <div className="mt-2 text-sm text-gray-400 space-y-1">
                  <p>Welcome back, <strong className="text-blue-400">{studentProfile.name}</strong> (Roll: {studentProfile.classRoll})</p>
                  <p>Registration No: <span className="text-gray-300 font-mono">{studentProfile.id}</span> | Guardian: <span className="text-gray-300">{studentProfile.guardianName}</span></p>
                </div>
              )}
            </div>
            
            {studentClassObj && (
              <div className="mt-4 md:mt-0 bg-blue-950/40 border border-blue-800 text-blue-300 px-4 py-2 rounded-xl text-center">
                <span className="text-xs uppercase tracking-wider block font-semibold text-blue-400">Assigned Class</span>
                <span className="font-bold text-lg">{studentClassObj.name}</span>
              </div>
            )}
          </div>

          {/* Messages */}
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

          {/* Assignments Header */}
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Book size={20} className="text-blue-400" /> Active Course Assignments
          </h3>

          {/* Assignment Cards */}
          <div className="space-y-6">
            {assignments.map((a) => {
              const submission = getSubmissionForAssignment(a.id);
              const isPastDeadline = new Date() > new Date(a.dueDate);
              const isEditing = activeAssignmentId === a.id;
              
              // Late submission allowed status
              const canSubmit = !isPastDeadline || a.allowLateSubmissions;

              return (
                <div
                  key={a.id}
                  className="bg-gray-800/40 p-6 rounded-2xl border border-gray-800/80 shadow-md hover:border-gray-700/60 transition"
                >
                  <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                    <div className="space-y-2 flex-1">
                      <h4 className="text-lg font-bold text-white">{a.title}</h4>
                      <p className="text-sm text-gray-400 leading-relaxed">{a.description}</p>
                      
                      <div className="flex flex-wrap gap-4 text-xs text-gray-500 pt-2">
                        <span className="bg-gray-900 border border-gray-800 px-2 py-0.5 rounded text-gray-300">
                          Subject: {subjects.find((s) => s.id === a.subjectId)?.name || "N/A"}
                        </span>
                        <span className="bg-gray-900 border border-gray-800 px-2 py-0.5 rounded text-gray-300">
                          Max Marks: {a.maxMarks}
                        </span>
                        <span className={`px-2 py-0.5 rounded font-semibold flex items-center gap-1 ${isPastDeadline ? "bg-red-950/40 text-red-400 border border-red-900/40" : "bg-blue-950/40 text-blue-400 border border-blue-900/40"}`}>
                          <Clock size={12} /> Due: {new Date(a.dueDate).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="self-start md:self-auto">
                      {submission ? (
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${
                            submission.status === "Graded"
                              ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                              : submission.status === "Needs Revision"
                              ? "bg-rose-950 text-rose-300 border border-rose-800"
                              : "bg-amber-950 text-amber-300 border border-amber-800"
                          }`}
                        >
                          {submission.status}
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-900 text-gray-400 border border-gray-800">
                          Not Submitted
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Submission form */}
                  {isEditing ? (
                    <div className="mt-6 border-t border-gray-800 pt-6">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Write your Submission Answer</label>
                      <textarea
                        value={submissionContent}
                        onChange={(e) => setSubmissionContent(e.target.value)}
                        placeholder="Type your answer here..."
                        className="w-full p-4 bg-gray-900 border border-gray-700 rounded-xl text-white text-sm focus:border-blue-500 focus:outline-none mb-4"
                        rows={5}
                      ></textarea>
                      <div className="flex gap-2">
                        <button
                          onClick={() => submitWork(a.id)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-2"
                        >
                          <Send size={14} /> Submit Answer
                        </button>
                        <button
                          onClick={() => setActiveAssignmentId(null)}
                          className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-5 py-2 rounded-lg text-sm font-semibold border border-gray-700 transition"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-6 border-t border-gray-800/60 pt-4">
                      {submission && (
                        <div className="mb-4">
                          <span className="text-xs text-gray-500 block mb-1">Your Submission:</span>
                          <div className="bg-gray-900/60 p-4 border border-gray-800 rounded-xl text-sm text-gray-300 font-mono whitespace-pre-wrap">
                            {submission.content}
                          </div>
                        </div>
                      )}

                      {submission && submission.status === "Graded" && (
                        <div className="bg-emerald-950/30 border border-emerald-900/60 p-4 rounded-xl">
                          <p className="text-emerald-400 font-bold mb-1 flex items-center gap-1.5">
                            <CheckCircle size={16} /> Graded: {submission.marks} / {a.maxMarks}
                          </p>
                          {submission.feedback && (
                            <p className="text-sm text-emerald-300/80 mt-1">
                              <strong>Teacher Feedback:</strong> {submission.feedback}
                            </p>
                          )}
                        </div>
                      )}

                      {submission && submission.status === "Needs Revision" && (
                        <div className="bg-rose-950/30 border border-rose-900/60 p-4 rounded-xl mb-4">
                          <p className="text-rose-400 font-bold mb-1">
                            Needs Revision
                          </p>
                          {submission.feedback && (
                            <p className="text-sm text-rose-300/80 mt-1">
                              <strong>Feedback:</strong> {submission.feedback}
                            </p>
                          )}
                        </div>
                      )}
                      <div className="flex gap-2">
                        {submission && submission.status === "Graded" ? (
                          <span className="text-xs text-emerald-400 italic">
                            This submission has been graded and cannot be updated.
                          </span>
                        ) : canSubmit ? (
                          <button
                            onClick={() => handleActionClick(a.id, submission?.content || "")}
                            className="bg-gray-900 hover:bg-gray-800 border border-gray-700 text-blue-400 px-4 py-2 rounded-lg text-xs font-bold transition"
                          >
                            {submission ? "Update Submission" : "Submit Answer"}
                          </button>
                        ) : (
                          <span className="text-xs text-red-400 italic">
                            Submission closed (deadline passed).
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            
            {assignments.length === 0 && (
              <p className="text-center text-gray-500 italic text-sm py-12">No assignments found for your class course.</p>
            )}
          </div>

        </main>
      </div>
    </ProtectedRoute>
  );
}
