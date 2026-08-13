"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import api from "@/lib/axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormValues) => {
    try {
      setError("");

      const payload = {
        name: data.name,
        email: data.email,
        passwordHash: data.password, // sent to backend for hashing
      };

      await api.post("/Users", payload);

      setSuccess(true);
      reset();

      setTimeout(() => {
        router.push("/login");
      }, 2500);
    } catch (err: any) {
      setError(err.response?.data || "Failed to register. Please make sure your email is pre-registered by your Administrator.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-gray-100 font-sans">
      <div className="bg-gray-800 border border-gray-700 p-8 rounded-2xl shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-bold text-center text-white mb-2">
          Create an Account
        </h2>
        <p className="text-xs text-gray-400 text-center mb-6">
          Your access role will be resolved automatically based on your pre-registered roster email.
        </p>

        {error && (
          <div className="bg-red-900/60 border border-red-800 text-red-200 p-3 rounded-lg mb-4 text-xs text-center">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-emerald-950/60 border border-emerald-800 text-emerald-200 p-3 rounded-lg mb-4 text-xs text-center">
            Registration successful! Redirecting to login...
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
              Full Name
            </label>
            <input
              {...register("name")}
              type="text"
              placeholder="John Doe"
              className="w-full p-3 bg-gray-900 border border-gray-750 rounded-lg text-white text-sm focus:border-blue-500 focus:outline-none"
            />
            {errors.name && (
              <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
              Pre-Registered Email Address
            </label>
            <input
              {...register("email")}
              type="email"
              placeholder="student@school.com"
              className="w-full p-3 bg-gray-900 border border-gray-750 rounded-lg text-white text-sm focus:border-blue-500 focus:outline-none"
            />
            {errors.email && (
              <p className="text-red-400 text-xs mt-1">
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
              Set Password
            </label>
            <div className="relative">
              <input
                {...register("password")}
                type={showPassword ? "text" : "password"}
                placeholder="••••••"
                className="w-full p-3 bg-gray-900 border border-gray-750 rounded-lg text-white text-sm focus:border-blue-500 focus:outline-none pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-400"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-400 text-xs mt-1">
                {errors.password.message}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 bg-blue-950/20 border border-blue-900/40 p-3 rounded-lg text-xs text-blue-300">
            <ShieldCheck size={20} className="shrink-0 text-blue-400" />
            <span>Note: Only email addresses pre-authorized by an administrator can register accounts.</span>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || success}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition disabled:opacity-50 mt-6 text-sm"
          >
            {isSubmitting ? "Creating account..." : "Register"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-400">
          Already have an account?{" "}
          <Link href="/login" className="text-blue-500 hover:underline">
            Log in here
          </Link>
        </p>
      </div>
    </div>
  );
}
