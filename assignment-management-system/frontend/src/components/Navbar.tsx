"use client";

import { useAuth } from "@/context/AuthContext";
import { LogOut } from "lucide-react";

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
      <h1 className="text-xl font-bold text-gray-800">Assignment System</h1>
      <div className="flex items-center gap-4">
        {user && (
          <span className="text-sm text-gray-700 font-medium px-3 py-1 bg-gray-100 rounded-full border border-gray-200">
            Role: {user.role}
          </span>
        )}
        <button
          onClick={logout}
          className="flex items-center text-red-600 hover:text-red-800 transition font-medium text-sm"
        >
          <LogOut size={18} className="mr-1" /> Logout
        </button>
      </div>
    </nav>
  );
}
