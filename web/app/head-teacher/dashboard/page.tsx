"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { 
  Users, 
  Stethoscope, 
  ClipboardList, 
  Clock, 
  ArrowUpRight, 
  Megaphone, 
  AlertCircle, 
  RefreshCw, 
  UserPlus, 
  Eye, 
  Search, 
  ShieldCheck, 
  Activity, 
  XCircle, 
  CheckCircle2,
  Calendar,
  AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function HeadTeacherDashboard() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCancelling, setIsCancelling] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No active session found. Please log in.");
      }

      // 👇 BINAGO: Pinalitan ang localhost at ginamit ang Environment Variable 👇
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/head-teacher/dashboard`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to load dashboard data");
      }
      
      setData(json);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleCancelReferral = async (referralId: string) => {
    if (!confirm("Are you sure you want to cancel this pending referral?")) return;

    setIsCancelling(referralId);
    try {
      const token = localStorage.getItem("token");
      // 👇 BINAGO: Pinalitan ang localhost at ginamit ang Environment Variable 👇
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/head-teacher/referrals/${referralId}/cancel`, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Failed to cancel referral");
      }

      // Refresh data
      await fetchDashboardData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsCancelling(null);
    }
  };

  // Client-side search filtering within authorized assigned students
  const filteredStudents = useMemo(() => {
    if (!data?.myStudents) return [];
    if (!searchQuery.trim()) return data.myStudents;
    const q = searchQuery.toLowerCase();
    return data.myStudents.filter((s: any) => 
      s.firstName?.toLowerCase().includes(q) ||
      s.lastName?.toLowerCase().includes(q) ||
      s.idNumber?.toLowerCase().includes(q)
    );
  }, [data?.myStudents, searchQuery]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  // LOADING SKELETON
  if (isLoading) {
    return (
      <div className="space-y-6 pb-12 animate-pulse">
        <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200">
          <div className="space-y-2">
            <div className="h-7 w-64 bg-slate-200 rounded-lg"></div>
            <div className="h-4 w-96 bg-slate-100 rounded-lg"></div>
          </div>
          <div className="flex gap-2">
            <div className="h-10 w-32 bg-slate-200 rounded-lg"></div>
            <div className="h-10 w-32 bg-slate-200 rounded-lg"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-28 bg-white border border-slate-200 rounded-2xl"></div>)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-64 bg-white border border-slate-200 rounded-2xl"></div>
            <div className="h-80 bg-white border border-slate-200 rounded-2xl"></div>
          </div>
          <div className="space-y-6">
            <div className="h-64 bg-white border border-slate-200 rounded-2xl"></div>
            <div className="h-64 bg-white border border-slate-200 rounded-2xl"></div>
          </div>
        </div>
      </div>
    );
  }

  // ERROR STATE
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-red-100 shadow-sm mt-6">
        <div className="p-4 bg-red-50 rounded-full mb-4">
          <AlertCircle className="h-10 w-10 text-red-600" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Unable to Load Dashboard</h2>
        <p className="text-slate-500 mt-2 mb-6 text-center max-w-md text-sm">{error}</p>
        <Button onClick={fetchDashboardData} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700">
          <RefreshCw className="h-4 w-4" /> Retry Connection
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      
      {/* 1. WELCOME HEADER & QUICK ACTIONS */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {greeting}, {data?.teacherName}! 👋
            </h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
              {data?.section}
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Here's an overview of your assigned students and clinic activities for <span className="font-semibold text-slate-700">{data?.section}</span>.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <Link href="/head-teacher/referrals/new" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white shadow-sm flex items-center gap-2">
              <UserPlus className="h-4 w-4" /> Refer Student
            </Button>
          </Link>
          <Link href="/head-teacher/students" className="w-full sm:w-auto">
            <Button variant="outline" className="w-full sm:w-auto border-slate-200 text-slate-700 bg-white hover:bg-slate-50 flex items-center gap-2">
              <Users className="h-4 w-4" /> View My Students
            </Button>
          </Link>
        </div>
      </div>

      {/* PRIVACY ASSURANCE BADGE */}
      <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-100/80 px-4 py-2 rounded-xl border border-slate-200">
        <ShieldCheck className="h-4 w-4 text-emerald-600 flex-shrink-0" />
        <span>
          <strong>Data Privacy Protection:</strong> Confidential medical diagnoses, treatments, and prescriptions are restricted to certified clinic personnel.
        </span>
      </div>

      {/* 2. STATISTICS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          icon={Users} 
          title="My Students" 
          value={data?.stats?.totalAssigned || 0} 
          subtitle="Assigned in Section" 
          color="blue" 
        />
        <StatCard 
          icon={Stethoscope} 
          title="Pending Referrals" 
          value={data?.stats?.pendingReferrals || 0} 
          subtitle="Awaiting Nurse Review" 
          color="indigo" 
        />
        <StatCard 
          icon={ClipboardList} 
          title="Active Requests" 
          value={data?.stats?.activeRequests || 0} 
          subtitle="Passes & Clearance" 
          color="emerald" 
        />
        <StatCard 
          icon={Clock} 
          title="Students in Clinic" 
          value={data?.stats?.inClinic || 0} 
          subtitle="Current Active Visits" 
          color="orange" 
        />
      </div>

      {/* 3. MAIN DASHBOARD CONTENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN (2 COLS) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* STUDENTS CURRENTLY IN CLINIC */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-orange-50/40">
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
                </span>
                <h3 className="font-bold text-slate-800 text-sm">Students Currently in Clinic</h3>
              </div>
              <span className="text-xs font-semibold text-orange-700 bg-orange-100 px-2.5 py-0.5 rounded-full">
                {data?.inClinicStudents?.length || 0} Active
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50/75 border-b border-slate-100 text-slate-500 font-semibold text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3.5">Student</th>
                    <th className="px-6 py-3.5">Grade & Section</th>
                    <th className="px-6 py-3.5">Time Admitted</th>
                    <th className="px-6 py-3.5 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {!data?.inClinicStudents || data?.inClinicStudents.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-slate-400 text-xs italic">
                        No assigned students are currently in the clinic.
                      </td>
                    </tr>
                  ) : (
                    data?.inClinicStudents.map((visit: any) => (
                      <tr key={visit.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-3.5 font-medium text-slate-900">
                          {visit.patient?.firstName} {visit.patient?.lastName}
                          <span className="block text-xs text-slate-400 font-normal">{visit.patient?.idNumber}</span>
                        </td>
                        <td className="px-6 py-3.5 text-slate-600 text-xs">
                          {visit.patient?.gradeLevel} - {visit.patient?.section}
                        </td>
                        <td className="px-6 py-3.5 text-slate-500 text-xs">
                          {new Date(visit.visitDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-6 py-3.5 text-right">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold tracking-wide bg-amber-100 text-amber-800">
                            IN CLINIC
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* MY STUDENTS DIRECTORY (SEARCHABLE) */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-600" /> Assigned Students Directory
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Showing students assigned to your section</p>
              </div>

              {/* Student Search Bar */}
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input 
                  placeholder="Search student or ID..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 text-xs border-slate-200"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50/75 border-b border-slate-100 text-slate-500 font-semibold text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3.5">Student ID</th>
                    <th className="px-6 py-3.5">Student Name</th>
                    <th className="px-6 py-3.5">Gender</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-slate-400 text-xs italic">
                        {searchQuery ? "No matching students found in your section." : "No students currently assigned to your section."}
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((student: any) => (
                      <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-3.5 font-mono text-xs text-slate-500">{student.idNumber}</td>
                        <td className="px-6 py-3.5 font-medium text-slate-900">
                          {student.firstName} {student.lastName}
                        </td>
                        <td className="px-6 py-3.5 text-slate-600 text-xs capitalize">{student.gender?.toLowerCase()}</td>
                        <td className="px-6 py-3.5 text-right">
                          <div className="flex justify-end items-center gap-1">
                            <Link href={`/head-teacher/students/${student.id}`}>
                              <Button variant="ghost" size="sm" className="h-7 px-2 text-blue-600 hover:text-blue-700 text-xs">
                                <Eye className="h-3.5 w-3.5 mr-1" /> View
                              </Button>
                            </Link>
                            <Link href={`/head-teacher/referrals/new?studentId=${student.id}`}>
                              <Button variant="outline" size="sm" className="h-7 px-2 text-indigo-600 border-indigo-200 hover:bg-indigo-50 text-xs">
                                <UserPlus className="h-3.5 w-3.5 mr-1" /> Refer
                              </Button>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            
            <div className="p-3 bg-slate-50 border-t border-slate-100 text-right">
              <Link href="/head-teacher/students" className="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center">
                View Full Student Directory <ArrowUpRight className="h-3.5 w-3.5 ml-1" />
              </Link>
            </div>
          </div>

          {/* PENDING & RECENT REFERRALS */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Stethoscope className="h-4 w-4 text-indigo-600" /> Submitted Clinic Referrals
              </h3>
              <Link href="/head-teacher/referrals" className="text-xs font-semibold text-blue-600 hover:text-blue-700">
                View All Referrals
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50/75 border-b border-slate-100 text-slate-500 font-semibold text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3.5">Student</th>
                    <th className="px-6 py-3.5">Reason</th>
                    <th className="px-6 py-3.5">Urgency</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {!data?.recentReferrals || data?.recentReferrals.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-slate-400 text-xs italic">
                        No clinic referrals submitted yet.
                      </td>
                    </tr>
                  ) : (
                    data?.recentReferrals.map((ref: any) => (
                      <tr key={ref.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-3.5 font-medium text-slate-900">
                          {ref.patient?.firstName} {ref.patient?.lastName}
                          <span className="block text-[11px] text-slate-400 font-normal">
                            {new Date(ref.createdAt).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 text-slate-600 text-xs max-w-xs truncate">
                          {ref.reason}
                        </td>
                        <td className="px-6 py-3.5">
                          <UrgencyBadge urgency={ref.urgency} />
                        </td>
                        <td className="px-6 py-3.5">
                          <StatusBadge status={ref.status} />
                        </td>
                        <td className="px-6 py-3.5 text-right">
                          {ref.status === 'PENDING' ? (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              disabled={isCancelling === ref.id}
                              onClick={() => handleCancelReferral(ref.id)}
                              className="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <XCircle className="h-3.5 w-3.5 mr-1" /> Cancel
                            </Button>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN (1 COL) */}
        <div className="space-y-6">

          {/* CLINIC REQUESTS */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-emerald-600" /> Clinic Requests
              </h3>
              <Link href="/head-teacher/clinic-requests" className="text-xs font-semibold text-blue-600 hover:text-blue-700">
                View All
              </Link>
            </div>

            <div className="space-y-3">
              {!data?.clinicRequests || data?.clinicRequests.length === 0 ? (
                <p className="text-center text-xs text-slate-400 py-6 italic">No pending clinic requests.</p>
              ) : (
                data?.clinicRequests.map((req: any) => (
                  <div key={req.id} className="p-3 border border-slate-100 rounded-xl bg-slate-50/60">
                    <div className="flex justify-between items-start mb-1">
                      <p className="font-semibold text-xs text-slate-800">
                        {req.patient?.firstName} {req.patient?.lastName}
                      </p>
                      <StatusBadge status={req.status} />
                    </div>
                    <p className="text-xs text-slate-500 truncate">{req.reason}</p>
                    <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(req.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* CLINIC ANNOUNCEMENTS */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl shadow-sm p-5 text-white">
            <h3 className="font-bold text-sm mb-4 flex items-center gap-2 text-slate-100">
              <Megaphone className="h-4 w-4 text-blue-400" /> Clinic Announcements
            </h3>
            <div className="space-y-3">
              {!data?.announcements || data?.announcements.length === 0 ? (
                <p className="text-center text-xs text-slate-400 py-4 italic">No active clinic announcements.</p>
              ) : (
                data?.announcements.map((ann: any) => (
                  <div key={ann.id} className="border-l-2 border-blue-400 pl-3 py-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-300">
                      {ann.category || 'General'}
                    </span>
                    <p className="font-semibold text-xs text-white mt-0.5">{ann.title}</p>
                    <p className="text-[11px] text-slate-300 mt-1 line-clamp-2 leading-relaxed">{ann.content}</p>
                    <p className="text-[10px] text-slate-400 mt-1.5">{new Date(ann.createdAt).toLocaleDateString()}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* RECENT ACTIVITIES */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
            <h3 className="font-bold text-slate-800 text-sm mb-4 flex items-center gap-2">
              <Activity className="h-4 w-4 text-slate-500" /> Recent Activity
            </h3>
            <div className="space-y-3">
              {!data?.recentActivities || data?.recentActivities.length === 0 ? (
                <p className="text-center text-xs text-slate-400 py-4 italic">No recent activity logged.</p>
              ) : (
                data?.recentActivities.map((act: any) => (
                  <div key={act.id} className="flex items-start gap-2.5 text-xs text-slate-600 pb-2 border-b border-slate-50 last:border-0 last:pb-0">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-slate-800 font-medium">{act.description}</p>
                      <span className="text-[10px] text-slate-400">{new Date(act.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

// Sub-components
function StatCard({ icon: Icon, title, value, subtitle, color }: any) {
  const styles: any = {
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    orange: "bg-orange-50 text-orange-600 border-orange-100",
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
        <p className="text-3xl font-extrabold text-slate-800 mt-1">{value !== undefined ? value : '-'}</p>
        <p className="text-[11px] text-slate-400 mt-1">{subtitle}</p>
      </div>
      <div className={`p-3.5 rounded-2xl border ${styles[color]}`}>
        <Icon className="h-6 w-6" />
      </div>
    </div>
  );
}

function UrgencyBadge({ urgency }: { urgency: string }) {
  const u = urgency?.toUpperCase();
  if (u === 'HIGH' || u === 'EMERGENCY') {
    return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-100 text-red-700">High</span>;
  }
  if (u === 'MEDIUM') {
    return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 text-amber-700">Medium</span>;
  }
  return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700">Low</span>;
}

function StatusBadge({ status }: { status: string }) {
  const s = status?.toUpperCase();
  const map: any = {
    PENDING: "bg-amber-100 text-amber-800",
    APPROVED: "bg-blue-100 text-blue-800",
    ACCEPTED: "bg-indigo-100 text-indigo-800",
    COMPLETED: "bg-emerald-100 text-emerald-800",
    CANCELLED: "bg-slate-100 text-slate-600",
    REJECTED: "bg-red-100 text-red-800",
  };
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${map[s] || "bg-slate-100 text-slate-600"}`}>
      {status || 'Unknown'}
    </span>
  );
}