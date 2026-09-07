"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Activity, Calendar, Clock, FileText, Bell, Megaphone, 
  Plus, ArrowRight, HeartPulse, ShieldCheck, AlertCircle, Loader2, UserCog 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Tandaan: Baguhin ang path kung nai-save mo ito sa ibang folder (e.g., "@/components/ProfileUpdateModal")
import ProfileUpdateModal from "@/components/ProfileUpdateModal";

export default function StudentDashboardPage() {
  const router = useRouter(); 
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  
  // STATE PARA SA PROFILE UPDATE MODAL
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      
      if (!token) {
        router.push("/login"); 
        return;
      }

      // 👇 BINAGO: Pinalitan ang localhost at ginamit ang Environment Variable 👇
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/student/dashboard`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem("token");
        router.push("/login"); 
        return;
      }

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load dashboard data");
      
      setData(json);
    } catch (err: any) {
      setError(err.message || "Unable to connect to the server.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <div className="h-24 bg-slate-200 animate-pulse rounded-2xl w-full"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-64 bg-slate-200 animate-pulse rounded-2xl md:col-span-2"></div>
          <div className="h-64 bg-slate-200 animate-pulse rounded-2xl"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-48 bg-slate-200 animate-pulse rounded-2xl"></div>
          <div className="h-48 bg-slate-200 animate-pulse rounded-2xl"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] bg-white rounded-3xl border border-slate-100 shadow-sm">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-slate-800">Unable to load your clinic information</h2>
        <p className="text-slate-500 mt-2 mb-6 text-sm">{error}</p>
        <Button onClick={fetchDashboardData} className="bg-blue-600 hover:bg-blue-700 text-white">
          Retry Connection
        </Button>
      </div>
    );
  }

  if (!data) return null;

  const { student, healthSummary, activeRequest, recentVisits, announcements } = data;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      
      {/* WELCOME HEADER */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="relative z-10">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
            {getGreeting()}, <span className="text-blue-600">{student.firstName}</span>! 👋
          </h1>
          <p className="text-slate-500 mt-1.5 flex items-center gap-2 text-sm md:text-base">
            Here's your school clinic overview.
            <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200 hidden sm:inline-flex">
              {student.gradeLevel} - {student.section}
            </Badge>
          </p>
        </div>
        
        {/* ACTION BUTTONS SA HEADER */}
        <div className="flex flex-col sm:flex-row gap-3 relative z-10 w-full md:w-auto">
          <Button 
            onClick={() => setIsProfileModalOpen(true)}
            variant="outline"
            className="w-full sm:w-auto bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-blue-600 rounded-xl shadow-sm h-11 px-4 transition-colors"
          >
            <UserCog className="h-4 w-4 mr-2" /> Update Profile
          </Button>
          <Link href="/student/request-visit" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm h-11 px-6">
              <Plus className="h-4 w-4 mr-2" /> Request Clinic Visit
            </Button>
          </Link>
        </div>
        
        <div className="absolute right-0 top-0 w-64 h-full bg-gradient-to-l from-blue-50 to-transparent opacity-50 pointer-events-none rounded-r-3xl"></div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* MIDDLE LEFT: ACTIVE APPOINTMENT & HEALTH SUMMARY */}
        <div className="xl:col-span-2 space-y-6">
          
          {/* APPOINTMENT / ACTIVE REQUEST */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="font-bold text-slate-800 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600" /> Upcoming Appointment & Requests
              </h2>
              <Link href="/student/appointments" className="text-xs font-semibold text-blue-600 hover:text-blue-700">View All</Link>
            </div>
            
            <div className="p-6">
              {activeRequest ? (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-bold text-blue-900">{activeRequest.reason}</h3>
                      <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 uppercase tracking-wider text-[10px]">
                        {activeRequest.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-blue-700 flex items-center mt-2">
                      <Clock className="h-4 w-4 mr-1.5 opacity-70" /> 
                      Requested on {new Date(activeRequest.requestDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="w-full sm:w-auto">
                    <p className="text-xs text-blue-600 font-medium mb-2 sm:text-right">A nurse will review your request shortly.</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 bg-slate-50 border border-dashed border-slate-200 rounded-xl">
                  <Calendar className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-600 font-medium">No active appointments</p>
                  <p className="text-sm text-slate-500 mt-1 mb-4">You have no upcoming clinic visits scheduled.</p>
                  <Link href="/student/request-visit">
                    <Button variant="outline" size="sm" className="text-blue-600 border-blue-200 hover:bg-blue-50">
                      Schedule a Visit
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* RECENT CLINIC VISITS */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="font-bold text-slate-800 flex items-center gap-2">
                <Activity className="h-5 w-5 text-indigo-600" /> Recent Clinic Visits
              </h2>
              <Link href="/student/clinic-visits" className="text-xs font-semibold text-blue-600 hover:text-blue-700">View History</Link>
            </div>
            
            <div className="divide-y divide-slate-100">
              {recentVisits && recentVisits.length > 0 ? (
                recentVisits.map((visit: any) => (
                  <div key={visit.id} className="p-5 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                    <div>
                      <p className="font-bold text-slate-800 text-sm mb-1">{visit.reason}</p>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center"><Calendar className="h-3.5 w-3.5 mr-1" /> {new Date(visit.visitDate).toLocaleDateString()}</span>
                        {visit.diagnosis && <span className="truncate max-w-[200px] text-slate-400">• {visit.diagnosis}</span>}
                      </div>
                    </div>
                    <Badge variant="secondary" className="w-fit text-[10px] tracking-wider uppercase font-bold bg-slate-100 text-slate-600">
                      {visit.status}
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center">
                  <Activity className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-500 text-sm">No recent visits recorded.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: SUMMARY, ANNOUNCEMENTS, NOTIFICATIONS */}
        <div className="space-y-6">
          
          {/* PERSONAL HEALTH SUMMARY */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 relative overflow-hidden">
            <div className="absolute right-0 top-0 w-24 h-24 bg-rose-50 rounded-bl-full -z-0"></div>
            <h2 className="font-bold text-slate-800 flex items-center gap-2 mb-5 relative z-10">
              <HeartPulse className="h-5 w-5 text-rose-500" /> Health Summary
            </h2>
            
            <div className="space-y-4 relative z-10">
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-sm text-slate-500 font-medium">Clearance Status</span>
                <Badge className={`text-[10px] tracking-wider uppercase ${student.clearanceStatus === 'CLEARED' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`} variant="outline">
                  {student.clearanceStatus || "ACTIVE"}
                </Badge>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-sm text-slate-500 font-medium">Blood Type</span>
                <span className="text-sm font-bold text-slate-800">{healthSummary?.bloodType || "Unknown"}</span>
              </div>
              <div className="flex flex-col p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-sm text-slate-500 font-medium mb-1">Known Allergies</span>
                <span className="text-sm font-semibold text-slate-800">{healthSummary?.allergies || "None"}</span>
              </div>
              
              <Link href="/student/health" className="block mt-2">
                <Button variant="ghost" className="w-full text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-9 text-xs">
                  View Full Health Record <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                </Button>
              </Link>
            </div>
          </div>

          {/* ANNOUNCEMENTS */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
              <h2 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
                <Megaphone className="h-4 w-4 text-orange-500" /> Clinic Announcements
              </h2>
            </div>
            <div className="p-4 space-y-3">
              {announcements && announcements.length > 0 ? (
                announcements.map((ann: any) => (
                  <div key={ann.id} className="border border-slate-100 rounded-xl p-3 hover:border-slate-200 transition-colors">
                    <p className="text-xs text-orange-600 font-bold mb-1 uppercase tracking-wider">{ann.targetRole === 'ALL' ? 'General' : 'Students'}</p>
                    <p className="text-sm font-bold text-slate-800 line-clamp-1">{ann.title}</p>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{ann.content || ann.description}</p>
                  </div>
                ))
              ) : (
                <div className="text-center py-6">
                  <p className="text-xs text-slate-500">No new announcements.</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* RENDER MODAL */}
      <ProfileUpdateModal 
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        currentProfile={{
          firstName: student.firstName,
          lastName: student.lastName,
          schoolId: student.idNumber,
          gradeLevel: student.gradeLevel,
          section: student.section
        }}
      />

    </div>
  );
}