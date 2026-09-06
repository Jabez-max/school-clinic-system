"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Megaphone, AlertCircle, RefreshCw, Calendar, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HeadTeacherAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAnnouncements = async () => {
    setIsLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No active session found. Please log in.");

      const res = await fetch("http://localhost:5000/api/head-teacher/announcements", {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to fetch announcements");
      }
      
      setAnnouncements(json.announcements);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      
      {/* HEADER SECTION */}
      <div>
        <Link href="/head-teacher/dashboard" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors mb-4">
          <ChevronLeft className="h-4 w-4 mr-1" /> Back to Dashboard
        </Link>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Megaphone className="h-6 w-6 text-blue-600" /> Clinic Announcements
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Stay updated with the latest health campaigns, schedules, and clinic notices.
            </p>
          </div>
          <Button onClick={fetchAnnouncements} variant="outline" className="text-slate-600 bg-slate-50 hover:bg-slate-100 flex items-center gap-2">
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </div>
      </div>

      {/* ERROR STATE */}
      {error && (
        <div className="flex flex-col items-center justify-center py-12 bg-white rounded-2xl border border-red-100 shadow-sm">
          <AlertCircle className="h-10 w-10 text-red-500 mb-3" />
          <h2 className="text-lg font-bold text-slate-800">Unable to load announcements</h2>
          <p className="text-slate-500 mt-1 mb-4 text-sm text-center max-w-md">{error}</p>
          <Button onClick={fetchAnnouncements} variant="outline" className="text-slate-600">
            <RefreshCw className="h-4 w-4 mr-2" /> Try Again
          </Button>
        </div>
      )}

      {/* MAIN LIST SECTION */}
      {!error && (
        <div className="space-y-4">
          
          {/* LOADING STATE */}
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm animate-pulse">
                <div className="h-4 bg-slate-200 rounded w-24 mb-3"></div>
                <div className="h-6 bg-slate-200 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-slate-100 rounded w-full mb-2"></div>
                <div className="h-4 bg-slate-100 rounded w-5/6"></div>
              </div>
            ))
          ) : announcements.length === 0 ? (
            
            /* EMPTY STATE */
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm py-16 text-center flex flex-col items-center">
              <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
                <Megaphone className="h-8 w-8 text-slate-300" />
              </div>
              <h3 className="text-lg font-bold text-slate-700">No Announcements Yet</h3>
              <p className="text-slate-500 text-sm mt-1 max-w-sm">
                There are currently no active clinic announcements broadcasted for Head Teachers.
              </p>
            </div>
          ) : (
            
            /* DATA ROWS (ANNOUNCEMENT CARDS) */
            announcements.map((ann: any) => (
              <div key={ann.id} className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200 hover:border-blue-200 transition-colors group relative overflow-hidden">
                
                {/* Decorative left border */}
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-100 w-fit">
                    <Tag className="h-3 w-3" /> {ann.category}
                  </span>
                  <div className="flex items-center text-slate-400 text-xs font-medium">
                    <Calendar className="h-3.5 w-3.5 mr-1.5" />
                    {new Date(ann.createdAt).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </div>
                </div>
                
                <h2 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-blue-700 transition-colors">
                  {ann.title}
                </h2>
                
                <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">
                  {ann.description}
                </p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}