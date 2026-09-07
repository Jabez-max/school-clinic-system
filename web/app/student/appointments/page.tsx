"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  CalendarDays, Clock, AlertCircle, Loader2, 
  CheckCircle2, XCircle, FileText, CalendarClock
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function AppointmentsPage() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          router.push("/login");
          return;
        }

        // 👇 BINAGO: Pinalitan ang localhost at ginamit ang Environment Variable 👇
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/student/appointments`, {
          headers: { "Authorization": `Bearer ${token}` }
        });

        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem("token");
          router.push("/login");
          return;
        }

        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed to load appointments");

        setAppointments(json.appointments || []);
      } catch (err: any) {
        setError(err.message || "Unable to connect to the server.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAppointments();
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 bg-white rounded-3xl border border-rose-100 shadow-sm mt-6">
        <AlertCircle className="h-12 w-12 text-rose-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-800">Unable to load appointments</h2>
        <p className="text-slate-500 mt-2 text-sm">{error}</p>
        <Button onClick={() => window.location.reload()} className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white">
          Retry
        </Button>
      </div>
    );
  }

  // Function para sa kulay at icon ng bawat status
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return { color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: <CheckCircle2 className="h-4 w-4 mr-1" /> };
      case 'PENDING':
        return { color: 'bg-amber-100 text-amber-700 border-amber-200', icon: <Clock className="h-4 w-4 mr-1" /> };
      case 'CANCELLED':
      case 'REJECTED':
        return { color: 'bg-rose-100 text-rose-700 border-rose-200', icon: <XCircle className="h-4 w-4 mr-1" /> };
      default:
        return { color: 'bg-slate-100 text-slate-700 border-slate-200', icon: <AlertCircle className="h-4 w-4 mr-1" /> };
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12 max-w-5xl mx-auto">
      
      {/* HEADER SECTION */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="relative z-10 flex items-center gap-4">
          <div className="h-16 w-16 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600">
            <CalendarDays className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">My Appointments</h1>
            <p className="text-slate-500 mt-1 text-sm md:text-base">Track your clinic visit requests and schedules.</p>
          </div>
        </div>
        <div className="relative z-10 flex gap-3">
          <Button onClick={() => router.push('/student/request-visit')} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm">
            + New Request
          </Button>
        </div>
        <div className="absolute right-0 top-0 w-64 h-full bg-gradient-to-l from-indigo-50 to-transparent opacity-50 pointer-events-none rounded-r-3xl"></div>
      </div>

      {/* APPOINTMENTS LIST */}
      <div className="space-y-4">
        {appointments.length > 0 ? (
          appointments.map((apt) => {
            const statusDisplay = getStatusDisplay(apt.status);
            return (
              <div key={apt.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 md:p-6 hover:shadow-md transition-all flex flex-col md:flex-row gap-5 items-start md:items-center">
                
                {/* Date Badge */}
                <div className="flex-shrink-0 bg-slate-50 rounded-xl border border-slate-100 p-3 text-center min-w-[100px]">
                  <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
                    {new Date(apt.requestDate).toLocaleDateString('en-US', { month: 'short' })}
                  </p>
                  <p className="text-3xl font-black text-indigo-600">
                    {new Date(apt.requestDate).toLocaleDateString('en-US', { day: '2-digit' })}
                  </p>
                  <p className="text-xs font-medium text-slate-400 mt-1">
                    {new Date(apt.requestDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>

                {/* Details */}
                <div className="flex-grow space-y-2 w-full">
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-bold text-slate-800">{apt.reason}</h3>
                    <Badge variant="outline" className={`px-3 py-1 font-bold flex items-center ${statusDisplay.color}`}>
                      {statusDisplay.icon}
                      {apt.status}
                    </Badge>
                  </div>
                  
                  {apt.status === 'PENDING' && (
                    <p className="text-sm text-slate-500 flex items-center">
                      <Clock className="h-4 w-4 mr-2 opacity-70 text-amber-500" />
                      Waiting for clinic nurse approval.
                    </p>
                  )}
                  {apt.status === 'APPROVED' && (
                    <p className="text-sm text-slate-500 flex items-center">
                      <CheckCircle2 className="h-4 w-4 mr-2 opacity-70 text-emerald-500" />
                      Your appointment is confirmed. Please proceed to the clinic on time.
                    </p>
                  )}
                </div>

              </div>
            );
          })
        ) : (
          <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center">
            <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <CalendarClock className="h-10 w-10 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">No Appointments Yet</h3>
            <p className="text-slate-500 max-w-sm mx-auto mb-6">
              You don't have any pending or past clinic appointment requests.
            </p>
            <Button onClick={() => router.push('/student/request-visit')} variant="outline" className="rounded-xl border-indigo-200 text-indigo-700 hover:bg-indigo-50">
              Request a Clinic Visit
            </Button>
          </div>
        )}
      </div>

    </div>
  );
}