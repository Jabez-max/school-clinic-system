"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Settings, Shield, User, Lock, LogOut, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [passwordData, setPasswordData] = useState({ currentPassword: "", newPassword: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    // Kunin ang student info para sa settings display
    const fetchSettingsInfo = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          router.push("/login");
          return;
        }

        const res = await fetch("http://localhost:5000/api/student/dashboard", {
          headers: { "Authorization": `Bearer ${token}` }
        });

        if (!res.ok) throw new Error("Failed to load account settings");
        const json = await res.json();
        setProfile(json.student);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettingsInfo();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    setError("");
    setMessage("");

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      // Tawagin ang bagong backend endpoint natin
      const res = await fetch("http://localhost:5000/api/student/settings/password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(passwordData)
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Failed to update password");
      }

      setMessage("Password updated successfully!");
      setPasswordData({ currentPassword: "", newPassword: "" }); // i-clear ang form

    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-10 w-10 animate-spin text-slate-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12 max-w-4xl mx-auto">
      
      {/* HEADER SECTION */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="relative z-10 flex items-center gap-4">
          <div className="h-16 w-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-700">
            <Settings className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Account Settings</h1>
            <p className="text-slate-500 mt-1 text-sm md:text-base">Manage your account preferences and security.</p>
          </div>
        </div>
        <div className="relative z-10">
          <Button onClick={handleLogout} variant="destructive" className="rounded-xl flex items-center gap-2">
            <LogOut className="h-4 w-4" /> Sign Out
          </Button>
        </div>
        <div className="absolute right-0 top-0 w-64 h-full bg-gradient-to-l from-slate-100 to-transparent opacity-50 pointer-events-none rounded-r-3xl"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* ACCOUNT PROFILE INFO */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <h3 className="font-bold text-slate-800 flex items-center gap-2 text-lg border-b border-slate-100 pb-3">
            <User className="h-5 w-5 text-indigo-500" /> Profile Information
          </h3>
          
          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b border-slate-50">
              <span className="text-slate-500">Student ID Number</span>
              <span className="font-bold text-slate-800">{profile?.idNumber || 'N/A'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-50">
              <span className="text-slate-500">Full Name</span>
              <span className="font-bold text-slate-800">{profile?.firstName} {profile?.lastName}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-50">
              <span className="text-slate-500">Grade & Section</span>
              <span className="font-bold text-slate-800">{profile?.gradeLevel} - {profile?.section}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-500">Account Role</span>
              <span className="font-bold text-indigo-600 uppercase">Student</span>
            </div>
          </div>
        </div>

        {/* SECURITY SETTINGS */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <h3 className="font-bold text-slate-800 flex items-center gap-2 text-lg border-b border-slate-100 pb-3">
            <Shield className="h-5 w-5 text-emerald-500" /> Security & Password
          </h3>

          {message && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-sm flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" /> {message}
            </div>
          )}

          {/* Dito natin ipapakita kung may error gaya ng maling current password */}
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4" /> {error}
            </div>
          )}

          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Current Password</label>
              <input 
                type="password"
                required
                placeholder="••••••••"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">New Password</label>
              <input 
                type="password"
                required
                placeholder="••••••••"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <Button type="submit" disabled={isUpdating} className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-xl">
              {isUpdating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Lock className="h-4 w-4 mr-2" />}
              Update Password
            </Button>
          </form>
        </div>

      </div>
    </div>
  );
}