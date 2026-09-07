"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ClipboardList, AlertCircle, RefreshCw, Calendar, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ClinicRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchRequests = async () => {
    setIsLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No active session found. Please log in.");

      // 👇 BINAGO: Pinalitan ang localhost at ginamit ang Environment Variable 👇
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/head-teacher/clinic-requests`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to fetch clinic requests");
      }
      
      setRequests(json.clinicRequests);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  return (
    <div className="space-y-6 pb-12">
      
      {/* HEADER SECTION */}
      <div>
        <Link href="/head-teacher/dashboard" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-emerald-600 transition-colors mb-4">
          <ChevronLeft className="h-4 w-4 mr-1" /> Back to Dashboard
        </Link>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <ClipboardList className="h-6 w-6 text-emerald-600" /> Clinic Requests
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Track passes, clearances, and other clinic requests for your assigned students.
            </p>
          </div>
          <Button onClick={fetchRequests} variant="outline" className="text-slate-600 bg-slate-50 hover:bg-slate-100 flex items-center gap-2">
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} /> Refresh Data
          </Button>
        </div>
      </div>

      {/* ERROR STATE */}
      {error && (
        <div className="flex flex-col items-center justify-center py-12 bg-white rounded-2xl border border-red-100 shadow-sm">
          <AlertCircle className="h-10 w-10 text-red-500 mb-3" />
          <h2 className="text-lg font-bold text-slate-800">Failed to load requests</h2>
          <p className="text-slate-500 mt-1 mb-4 text-sm text-center max-w-md">{error}</p>
          <Button onClick={fetchRequests} variant="outline" className="text-slate-600">
            <RefreshCw className="h-4 w-4 mr-2" /> Try Again
          </Button>
        </div>
      )}

      {/* MAIN LIST SECTION */}
      {!error && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Student</th>
                  <th className="px-6 py-4">Reason / Request Details</th>
                  <th className="px-6 py-4">Date Requested</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                
                {/* LOADING STATE */}
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-6 py-4">
                        <div className="h-4 bg-slate-200 rounded w-32 mb-1"></div>
                        <div className="h-3 bg-slate-100 rounded w-20"></div>
                      </td>
                      <td className="px-6 py-4"><div className="h-4 bg-slate-200 rounded w-48"></div></td>
                      <td className="px-6 py-4"><div className="h-4 bg-slate-200 rounded w-24"></div></td>
                      <td className="px-6 py-4"><div className="h-6 bg-slate-200 rounded-full w-20"></div></td>
                    </tr>
                  ))
                ) : requests.length === 0 ? (
                  
                  /* EMPTY STATE */
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <ClipboardList className="h-10 w-10 text-slate-300 mb-3" />
                        <p className="text-slate-500 font-medium">No clinic requests yet</p>
                        <p className="text-slate-400 text-xs mt-1">
                          There are currently no passes or clearance requests for your assigned students.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  
                  /* DATA ROWS */
                  requests.map((req: any) => (
                    <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-800">
                          {req.patient?.firstName} {req.patient?.lastName}
                        </p>
                        <p className="text-xs text-slate-500 font-mono mt-0.5">{req.patient?.idNumber}</p>
                      </td>
                      <td className="px-6 py-4 text-slate-600 text-sm max-w-sm">
                        {req.reason}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-slate-600 text-sm">
                          <Calendar className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
                          {new Date(req.createdAt).toLocaleDateString()}
                        </div>
                        <div className="flex items-center text-slate-500 text-xs mt-1">
                          <Clock className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
                          {new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={req.status} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// Sub-component for beautiful status badges
function StatusBadge({ status }: { status: string }) {
  const s = status?.toUpperCase();
  const map: any = {
    PENDING: "bg-amber-100 text-amber-800 border-amber-200",
    APPROVED: "bg-blue-100 text-blue-800 border-blue-200",
    COMPLETED: "bg-emerald-100 text-emerald-800 border-emerald-200",
    CANCELLED: "bg-slate-100 text-slate-600 border-slate-200",
    REJECTED: "bg-red-100 text-red-800 border-red-200",
    RESCHEDULED: "bg-purple-100 text-purple-800 border-purple-200",
  };
  return (
    <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider border ${map[s] || "bg-slate-100 text-slate-600 border-slate-200"}`}>
      {status || 'Unknown'}
    </span>
  );
}