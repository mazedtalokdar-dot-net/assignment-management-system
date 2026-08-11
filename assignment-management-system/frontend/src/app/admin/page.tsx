"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import api from "@/lib/axios";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";

// --- Validation Schemas ---
const classSchema = z.object({
  name: z.string().min(2, "Class name is required"),
  description: z.string().optional(),
});

const subjectSchema = z.object({
  name: z.string().min(2, "Subject name is required"),
  classCourseId: z.string().min(1, "Please select a class"),
});

type ClassFormValues = z.infer<typeof classSchema>;
type SubjectFormValues = z.infer<typeof subjectSchema>;

export default function AdminDashboard() {
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [error, setError] = useState("");

  // Form setups
  const classForm = useForm<ClassFormValues>({
    resolver: zodResolver(classSchema),
  });
  const subjectForm = useForm<SubjectFormValues>({
    resolver: zodResolver(subjectSchema),
  });

  // Fetch data on load
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [classRes, subRes] = await Promise.all([
        api.get("/Admin/classes"),
        api.get("/Admin/subjects"),
      ]);
      setClasses(classRes.data);
      setSubjects(subRes.data);
    } catch (err: any) {
      console.error("Failed to fetch admin data", err);
    }
  };

  // Submit Handlers
  const onClassSubmit = async (data: ClassFormValues) => {
    try {
      setError("");
      await api.post("/Admin/classes", data);
      classForm.reset();
      fetchData(); // Refresh list
    } catch (err: any) {
      setError("Failed to create class.");
    }
  };

  const onSubjectSubmit = async (data: SubjectFormValues) => {
    try {
      setError("");
      await api.post("/Admin/subjects", data);
      subjectForm.reset();
      fetchData(); // Refresh list
    } catch (err: any) {
      setError("Failed to create subject.");
    }
  };

  return (
    <ProtectedRoute allowedRoles={["Admin"]}>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="p-8 max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-800 mb-6">
            Admin Dashboard
          </h2>

          {error && (
            <div className="bg-red-100 text-red-700 p-3 rounded mb-6">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* --- CLASSES SECTION --- */}
            <div className="bg-white p-6 rounded-lg shadow-sm border-t-4 border-blue-600">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                Manage Classes
              </h3>

              <form
                onSubmit={classForm.handleSubmit(onClassSubmit)}
                className="space-y-4 mb-6 bg-gray-50 p-4 rounded border"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Class Name
                  </label>
                  <input
                    {...classForm.register("name")}
                    placeholder="e.g., Computer Science 101"
                    className="mt-1 w-full p-2 border border-gray-300 rounded text-gray-900"
                  />
                  {classForm.formState.errors.name && (
                    <p className="text-red-500 text-xs mt-1">
                      {classForm.formState.errors.name.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <input
                    {...classForm.register("description")}
                    className="mt-1 w-full p-2 border border-gray-300 rounded text-gray-900"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
                >
                  Create Class
                </button>
              </form>

              <div className="max-h-60 overflow-y-auto">
                <ul className="space-y-2">
                  {classes.map((c) => (
                    <li
                      key={c.id}
                      className="p-3 bg-gray-50 border rounded flex justify-between items-center"
                    >
                      <div>
                        <p className="font-medium text-gray-800">{c.name}</p>
                      </div>
                    </li>
                  ))}
                  {classes.length === 0 && (
                    <p className="text-sm text-gray-500">No classes found.</p>
                  )}
                </ul>
              </div>
            </div>

            {/* --- SUBJECTS SECTION --- */}
            <div className="bg-white p-6 rounded-lg shadow-sm border-t-4 border-green-600">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                Manage Subjects
              </h3>

              <form
                onSubmit={subjectForm.handleSubmit(onSubjectSubmit)}
                className="space-y-4 mb-6 bg-gray-50 p-4 rounded border"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Subject Name
                  </label>
                  <input
                    {...subjectForm.register("name")}
                    placeholder="e.g., Data Structures"
                    className="mt-1 w-full p-2 border border-gray-300 rounded text-gray-900"
                  />
                  {subjectForm.formState.errors.name && (
                    <p className="text-red-500 text-xs mt-1">
                      {subjectForm.formState.errors.name.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Assign to Class
                  </label>
                  <select
                    {...subjectForm.register("classCourseId")}
                    className="mt-1 w-full p-2 border border-gray-300 rounded text-gray-900 bg-white"
                  >
                    <option value="">Select a Class...</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  {subjectForm.formState.errors.classCourseId && (
                    <p className="text-red-500 text-xs mt-1">
                      {subjectForm.formState.errors.classCourseId.message}
                    </p>
                  )}
                </div>
                <button
                  type="submit"
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm"
                >
                  Create Subject
                </button>
              </form>

              <div className="max-h-60 overflow-y-auto">
                <ul className="space-y-2">
                  {subjects.map((s) => (
                    <li
                      key={s.id}
                      className="p-3 bg-gray-50 border rounded flex justify-between items-center"
                    >
                      <div>
                        <p className="font-medium text-gray-800">{s.name}</p>
                        <p className="text-xs text-gray-500">
                          {" "}
                          {classes.find((c) => c.id === s.classCourseId)
                            ?.name || "Unknown Class"}
                        </p>
                      </div>
                    </li>
                  ))}
                  {subjects.length === 0 && (
                    <p className="text-sm text-gray-500">No subjects found.</p>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
