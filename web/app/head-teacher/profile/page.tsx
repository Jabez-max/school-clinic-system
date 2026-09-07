"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, User, Mail, BookOpen, AlertCircle, RefreshCw, BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HeadTeacherProfilePage() {
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
        throw new Error(json.error || "Failed to fetch profile");
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
    <div className="space-y-6 pb-12 max-w-3xl mx-auto">
      
      {/* HEADER SECTION */}
      <div>
        <Link href="/head-teacher/dashboard" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors mb-4">
          <ChevronLeft className="h-4 w-4 mr-1" /> Back to Dashboard
        </Link>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <User className="h-6 w-6 text-blue-600" /> My Profile
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              View your account details and assigned grade level.
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
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm animate-pulse flex flex-col items-center">
          <div className="h-24 w-24 bg-slate-200 rounded-full mb-4"></div>
          <div className="h-6 bg-slate-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-slate-200 rounded w-1/4"></div>
        </div>
      )}

      {/* MAIN CONTENT */}
      {!isLoading && !error && profile && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden relative">
          
          {/* Cover Photo / Top Banner */}
          <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
          
          <div className="px-6 sm:px-10 pb-10">
            {/* Avatar Section */}
            <div className="flex justify-between items-end -mt-12 mb-8">
              <div className="h-24 w-24 bg-white rounded-full p-1.5 shadow-md">
                <div className="h-full w-full bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-3xl font-bold">
                  {profile.firstName.charAt(0)}{profile.lastName.charAt(0)}
                </div>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 font-semibold text-xs rounded-full border border-emerald-200">
                <BadgeCheck className="h-4 w-4" />
                Active Account
              </div>
            </div>

            <div className="space-y-8">
              {/* Name & Role */}
              <div>
                <h2 className="text-2xl font-bold text-slate-900">{profile.firstName} {profile.lastName}</h2>
                <p className="text-slate-500 font-medium capitalize mt-1 flex items-center gap-2">
                  {profile.role?.replace('_', ' ').toLowerCase()}
                </p>
              </div>

              <hr className="border-slate-100" />

              {/* Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex gap-4">
                  <div className="mt-1 bg-slate-50 p-2 rounded-lg text-slate-400 h-fit border border-slate-100">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Email Address</p>
                    <p className="font-medium text-slate-900">{profile.email}</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="mt-1 bg-slate-50 p-2 rounded-lg text-slate-400 h-fit border border-slate-100">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Assigned Section</p>
                    <p className="font-medium text-slate-900">
                      {profile.handledGrade && profile.handledSection 
                        ? `${profile.handledGrade} - ${profile.handledSection}`
                        : 'Unassigned'}
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}