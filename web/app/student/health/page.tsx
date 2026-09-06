"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  HeartPulse, User, Activity, AlertTriangle, Droplet, 
  Scale, Ruler, PhoneCall, Calendar, ShieldCheck, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function MyHealthPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchHealthData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          router.push("/login");
          return;
        }

        const res = await fetch("http://localhost:5000/api/student/health", {
          headers: { "Authorization": `Bearer ${token}` }
        });

        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem("token");
          router.push("/login");
          return;
        }

        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed to load health records");

        setData(json);
      } catch (err: any) {
        setError(err.message || "Unable to connect to the server.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchHealthData();
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-10 w-10 animate-spin text-rose-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 bg-white rounded-3xl border border-rose-100 shadow-sm mt-6">
        <AlertTriangle className="h-12 w-12 text-rose-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-800">{error}</h2>
        <Button onClick={() => window.location.reload()} className="mt-4 bg-rose-600 hover:bg-rose-700 text-white">
          Retry
        </Button>
      </div>
    );
  }

  if (!data) return null;

  const { patient, healthRecord } = data;
  const bmi = healthRecord?.weight && healthRecord?.height 
    ? (healthRecord.weight / Math.pow(healthRecord.height / 100, 2)).toFixed(1) 
    : "N/A";

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12 max-w-5xl mx-auto">
      
      {/* HEADER SECTION */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="relative z-10 flex items-center gap-4">
          <div className="h-16 w-16 bg-rose-100 rounded-2xl flex items-center justify-center text-rose-600">
            <HeartPulse className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">My Health Record</h1>
            <p className="text-slate-500 mt-1 text-sm md:text-base">Confidential Medical Profile • {patient.idNumber}</p>
          </div>
        </div>
        <div className="relative z-10 w-full md:w-auto">
          <Badge className={`px-4 py-2 text-sm font-bold tracking-wider uppercase ${healthRecord.conditionStatus === 'HEALTHY' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
            Status: {healthRecord.conditionStatus || "ACTIVE"}
          </Badge>
        </div>
        {/* Decorative background element */}
        <div className="absolute right-0 top-0 w-64 h-full bg-gradient-to-l from-rose-50 to-transparent opacity-50 pointer-events-none rounded-r-3xl"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: VITAL STATS */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
              <Activity className="h-5 w-5 text-indigo-500" /> Vital Statistics
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
                <Scale className="h-6 w-6 mx-auto text-blue-500 mb-2" />
                <p className="text-xs text-slate-500 font-medium">Weight</p>
                <p className="text-lg font-bold text-slate-800">{healthRecord.weight ? `${healthRecord.weight} kg` : '--'}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
                <Ruler className="h-6 w-6 mx-auto text-emerald-500 mb-2" />
                <p className="text-xs text-slate-500 font-medium">Height</p>
                <p className="text-lg font-bold text-slate-800">{healthRecord.height ? `${healthRecord.height} cm` : '--'}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center col-span-2">
                <p className="text-xs text-slate-500 font-medium mb-1">Body Mass Index (BMI)</p>
                <div className="flex items-end justify-center gap-2">
                  <p className="text-2xl font-black text-indigo-900">{bmi}</p>
                  <p className="text-sm font-medium text-slate-400 mb-1">kg/m²</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
              <User className="h-5 w-5 text-blue-500" /> Personal Info
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <span className="text-sm text-slate-500 flex items-center"><Calendar className="h-4 w-4 mr-2" /> Birthdate</span>
                <span className="text-sm font-bold text-slate-800">
                  {patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString() : 'Not set'}
                </span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <span className="text-sm text-slate-500 flex items-center"><User className="h-4 w-4 mr-2" /> Gender</span>
                <span className="text-sm font-bold text-slate-800">{patient.gender || 'Not set'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: MEDICAL INFO & EMERGENCY CONTACT */}
        <div className="md:col-span-2 space-y-6">
          
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-6">
              <ShieldCheck className="h-5 w-5 text-rose-500" /> Medical Information
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-rose-50 p-4 rounded-xl border border-rose-100">
                <div className="flex items-center gap-2 mb-2">
                  <Droplet className="h-5 w-5 text-rose-600" />
                  <p className="text-sm font-bold text-rose-900">Blood Type</p>
                </div>
                <p className="text-2xl font-black text-rose-700 ml-7">{healthRecord.bloodType || 'N/A'}</p>
              </div>

              <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                  <p className="text-sm font-bold text-amber-900">Known Allergies</p>
                </div>
                <p className="text-base font-semibold text-amber-800 ml-7">{healthRecord.allergies || 'None Recorded'}</p>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 sm:col-span-2 mt-2">
                <p className="text-sm font-bold text-slate-700 mb-2">Pre-existing Medical Conditions</p>
                <p className="text-sm text-slate-600">{healthRecord.medicalConditions || 'No pre-existing conditions reported.'}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
              <PhoneCall className="h-5 w-5 text-green-500" /> Emergency Contact
            </h3>
            <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Contact Person</p>
                <p className="text-base font-bold text-slate-800">{patient.emergencyContactName || 'Not Provided'}</p>
              </div>
              <div className="sm:text-right">
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Contact Number</p>
                <p className="text-base font-bold text-slate-800">{patient.emergencyContactNumber || 'Not Provided'}</p>
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-4 text-center">
              * Please contact the clinic administrator if you need to update your emergency contact details.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}