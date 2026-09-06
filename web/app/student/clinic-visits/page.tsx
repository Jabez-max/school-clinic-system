"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Activity, Calendar, Clock, FileText, 
  Stethoscope, AlertCircle, Loader2, Pill
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function ClinicVisitsPage() {
  const router = useRouter();
  const [visits, setVisits] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchVisits = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          router.push("/login");
          return;
        }

        const res = await fetch("http://localhost:5000/api/student/clinic-visits", {
          headers: { "Authorization": `Bearer ${token}` }
        });

        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem("token");
          router.push("/login");
          return;
        }

        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed to load clinic visits");

        setVisits(json.visits || []);
      } catch (err: any) {
        setError(err.message || "Unable to connect to the server.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchVisits();
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 bg-white rounded-3xl border border-rose-100 shadow-sm mt-6">
        <AlertCircle className="h-12 w-12 text-rose-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-800">Unable to load history</h2>
        <p className="text-slate-500 mt-2 text-sm">{error}</p>
        <Button onClick={() => window.location.reload()} className="mt-4 bg-blue-600 hover:bg-blue-700 text-white">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12 max-w-5xl mx-auto">
      
      {/* HEADER SECTION */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="relative z-10 flex items-center gap-4">
          <div className="h-16 w-16 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600">
            <Activity className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Clinic Visits History</h1>
            <p className="text-slate-500 mt-1 text-sm md:text-base">Record of your past consultations and treatments.</p>
          </div>
        </div>
        <div className="relative z-10">
          <Badge variant="outline" className="px-4 py-2 text-sm bg-slate-50 text-slate-600 border-slate-200 font-medium">
            Total Records: {visits.length}
          </Badge>
        </div>
        <div className="absolute right-0 top-0 w-64 h-full bg-gradient-to-l from-blue-50 to-transparent opacity-50 pointer-events-none rounded-r-3xl"></div>
      </div>

      {/* VISITS LIST */}
      <div className="space-y-4">
        {visits.length > 0 ? (
          visits.map((visit) => (
            <div key={visit.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex flex-col md:flex-row justify-between gap-4">
                
                {/* Left Side: Date and Reason */}
                <div className="md:w-1/3 border-b md:border-b-0 md:border-r border-slate-100 pb-4 md:pb-0 md:pr-6">
                  <div className="flex justify-between items-start mb-2">
                    <Badge className={`uppercase text-[10px] tracking-wider ${
                      visit.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : 
                      visit.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : 
                      'bg-slate-100 text-slate-700'
                    }`} variant="outline">
                      {visit.status}
                    </Badge>
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 mb-1 leading-tight">{visit.reason}</h3>
                  <p className="text-sm text-slate-500 flex items-center mt-3">
                    <Calendar className="h-4 w-4 mr-2 opacity-70 text-blue-500" />
                    {new Date(visit.visitDate).toLocaleDateString('en-US', { 
                      weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' 
                    })}
                  </p>
                  <p className="text-sm text-slate-500 flex items-center mt-1">
                    <Clock className="h-4 w-4 mr-2 opacity-70 text-amber-500" />
                    {new Date(visit.visitDate).toLocaleTimeString('en-US', { 
                      hour: '2-digit', minute: '2-digit' 
                    })}
                  </p>
                </div>

                {/* Right Side: Medical Details */}
                <div className="md:w-2/3 md:pl-2 space-y-4">
                  <div>
                    <h4 className="text-sm font-bold text-slate-700 flex items-center mb-1">
                      <Stethoscope className="h-4 w-4 mr-2 text-indigo-500" /> Diagnosis
                    </h4>
                    <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                      {visit.diagnosis || 'Pending assessment by the clinic nurse.'}
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-bold text-slate-700 flex items-center mb-1">
                      <Pill className="h-4 w-4 mr-2 text-rose-500" /> Treatment & Medication
                    </h4>
                    <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                      {visit.treatment || 'No specific treatment recorded.'}
                    </p>
                  </div>

                  {visit.notes && (
                    <div>
                      <h4 className="text-sm font-bold text-slate-700 flex items-center mb-1">
                        <FileText className="h-4 w-4 mr-2 text-slate-400" /> Additional Notes
                      </h4>
                      <p className="text-sm text-slate-500 italic">
                        "{visit.notes}"
                      </p>
                    </div>
                  )}
                </div>

              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center">
            <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="h-10 w-10 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">No Clinic Visits Found</h3>
            <p className="text-slate-500 max-w-sm mx-auto">
              You haven't visited the clinic yet. Your consultation records and treatments will appear here once you have an appointment.
            </p>
          </div>
        )}
      </div>

    </div>
  );
}