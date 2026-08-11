"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles: string[];
}) {
  const { user } = useAuth();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    // 1. If there's no user in context, check localStorage. If still nothing, go to login.
    const token = localStorage.getItem("token");

    if (!token) {
      router.push("/login");
      return;
    }

    // 2. If the user context is loaded, verify their role
    if (user) {
      if (allowedRoles.includes(user.role)) {
        setIsAuthorized(true);
      } else {
        // Kick them to their correct dashboard
        if (user.role === "Admin") router.push("/admin");
        else if (user.role === "Teacher") router.push("/teacher");
        else router.push("/student");
      }
    }
  }, [user, router, allowedRoles]);

  if (!isAuthorized) {
    // Show a blank screen or loading spinner while checking permissions
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-500">
        Checking permissions...
      </div>
    );
  }

  return <>{children}</>;
}
