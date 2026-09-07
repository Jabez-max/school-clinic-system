"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Settings, User, Shield, BookOpen, Mail, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HeadTeacherSettingsPage() {
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchProfile = async () => {
    setIsLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No active session found. Please log in.");

      // 👇 BINAGO: Pinalitan ang localhost at ginamit ang Environment Variable 👇
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/head-teacher/settings`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to fetch profile settings");
      }
      
      setProfile(json.profile);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      
      {/* HEADER SECTION */}
      <div>
        <Link href="/head-teacher/dashboard" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors mb-4">
          <ChevronLeft className="h-4 w-4 mr-1" /> Back to Dashboard
        </Link>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Settings className="h-6 w-6 text-slate-700" /> Account Settings
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              View your profile information and assigned section details.
            </p>
          </div>
          <Button onClick={fetchProfile} variant="outline" className="text-slate-600 bg-slate-50 hover:bg-slate-100 flex items-center gap-2">
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </div>
      </div>

      {/* ERROR STATE */}
      {error && (
        <div className="flex flex-col items-center justify-center py-12 bg-white rounded-2xl border border-red-100 shadow-sm">
          <AlertCircle className="h-10 w-10 text-red-500 mb-3" />
          <h2 className="text-lg font-bold text-slate-800">Unable to load profile</h2>
          <p className="text-slate-500 mt-1 mb-4 text-sm text-center max-w-md">{error}</p>
          <Button onClick={fetchProfile} variant="outline" className="text-slate-600">
            <RefreshCw className="h-4 w-4 mr-2" /> Try Again
          </Button>
        </div>
      )}

      {/* LOADING STATE */}
      {isLoading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm animate-pulse h-64"></div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm animate-pulse h-64"></div>
        </div>
      )}

      {/* MAIN CONTENT */}
      {!isLoading && !error && profile && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* PERSONAL INFO CARD */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
              <User className="h-5 w-5 text-blue-600" />
              <h2 className="font-bold text-slate-800">Personal Information</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Full Name</p>
                <p className="font-medium text-slate-900">{profile.firstName} {profile.lastName}</p>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-slate-400" />
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Email Address</p>
                  <p className="font-medium text-slate-900">{profile.email}</p>
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Account Role</p>
                <span className="inline-flex px-2.5 py-1 rounded-md text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                  {profile.role?.replace('_', ' ')}
                </span>
              </div>
            </div>
          </div>

          {/* ASSIGNED SECTION CARD */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-emerald-600" />
              <h2 className="font-bold text-slate-800">Assigned Section</h2>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-500 mb-4">
                You are currently assigned to manage the students in this section. Only students from this section will appear in your directory.
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Grade Level</p>
                  <p className="font-bold text-slate-900">{profile.handledGrade || "Unassigned"}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Section Name</p>
                  <p className="font-bold text-slate-900">{profile.handledSection || "Unassigned"}</p>
                </div>
              </div>
            </div>
          </div>

          {/* SECURITY CARD */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden md:col-span-2">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
              <Shield className="h-5 w-5 text-indigo-600" />
              <h2 className="font-bold text-slate-800">Security & Access</h2>
            </div>
            <div className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="font-medium text-slate-900">Need to update your details or change your password?</p>
                <p className="text-sm text-slate-500 mt-1 max-w-lg">
                  For security reasons, modifying personal information, email addresses, or section assignments must be done through the School Clinic Administrator.
                </p>
              </div>
              <Button disabled variant="outline" className="border-slate-200 text-slate-400 cursor-not-allowed">
                Contact Administrator
              </Button>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}