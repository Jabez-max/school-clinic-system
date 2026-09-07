"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarPlus, Stethoscope, Clock, AlertCircle, CheckCircle2, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function RequestVisitPage() {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [requestDate, setRequestDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      // 👇 BINAGO: Pinalitan ang localhost at ginamit ang Environment Variable 👇
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/student/request-visit`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({ 
          reason, 
          requestDate: requestDate || new Date().toISOString() 
        })
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Failed to submit request.");
      }

      setSuccess(true);
      // Ibalik sa appointments page pagkatapos ng 2 seconds
      setTimeout(() => {
        router.push("/student/appointments");
      }, 2000);

    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] animate-in zoom-in duration-500">
        <div className="h-24 w-24 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 className="h-12 w-12 text-emerald-600" />
        </div>
        <h2 className="text-3xl font-black text-slate-800 mb-2">Request Sent!</h2>
        <p className="text-slate-500 text-center max-w-md">
          Your clinic visit request has been successfully submitted. Please wait for the clinic nurse's approval.
        </p>
        <p className="text-sm text-slate-400 mt-6 animate-pulse">Redirecting you back to appointments...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12 max-w-3xl mx-auto">
      
      {/* HEADER */}
      <div className="flex items-center gap-4 mb-8">
        <Button onClick={() => router.back()} variant="outline" size="icon" className="rounded-xl">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Request Clinic Visit</h1>
          <p className="text-slate-500 mt-1 text-sm">Fill out the form below to schedule a consultation.</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
          <CalendarPlus className="h-48 w-48" />
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-3 text-sm font-medium">
            <AlertCircle className="h-5 w-5" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
          
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <Stethoscope className="h-4 w-4 text-indigo-500" /> Reason for Visit <span className="text-rose-500">*</span>
            </label>
            <textarea 
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              placeholder="e.g., I have a severe headache and slight fever since this morning."
              className="w-full min-h-[120px] p-4 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-slate-700 resize-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <Clock className="h-4 w-4 text-emerald-500" /> Preferred Schedule (Optional)
            </label>
            <p className="text-xs text-slate-500 mb-2">If left blank, we will set this request to immediately (Now).</p>
            <input 
              type="datetime-local" 
              value={requestDate}
              onChange={(e) => setRequestDate(e.target.value)}
              className="w-full p-4 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-slate-700"
            />
          </div>

          <div className="pt-4 border-t border-slate-100">
            <Button 
              type="submit" 
              disabled={isSubmitting || !reason.trim()} 
              className="w-full h-14 text-lg font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md transition-all"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Submitting Request...
                </>
              ) : (
                "Submit Request"
              )}
            </Button>
          </div>

        </form>
      </div>
    </div>
  );
}