"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Send, AlertCircle, Stethoscope, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NewReferralPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preSelectedStudentId = searchParams.get("studentId"); // Kinukuha ang ID kung galing sa directory

  const [students, setStudents] = useState<any[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Form State
  const [patientId, setPatientId] = useState(preSelectedStudentId || "");
  const [urgency, setUrgency] = useState("MEDIUM");
  const [reason, setReason] = useState("");

  // 1. Kunin ang listahan ng mga assigned students para sa Dropdown
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No active session found.");

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/head-teacher/students/search`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed to fetch students");
        
        setStudents(json.students);
      } catch (err: any) {
        setError("Could not load student list. Please try again.");
      } finally {
        setIsLoadingStudents(false);
      }
    };

    fetchStudents();
  }, []);

  // 2. Submit Action papunta sa Backend API
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId || !reason.trim()) {
      setError("Please select a student and provide a reason for referral.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/head-teacher/referrals`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ patientId, reason, urgency })
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Failed to submit referral");
      }

      // Kapag Success
      setSuccess(true);
      setTimeout(() => {
        router.push("/head-teacher/dashboard"); // Ibalik sa dashboard pagkatapos
      }, 2000);

    } catch (err: any) {
      setError(err.message);
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-xl mx-auto mt-20 p-8 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-emerald-100 dark:border-emerald-900 flex flex-col items-center justify-center text-center transition-colors">
        <div className="h-16 w-16 bg-emerald-100 dark:bg-emerald-900/50 rounded-full flex items-center justify-center mb-4">
          <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Referral Submitted!</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-2 mb-6">
          The clinic referral has been successfully sent to the nurse. You will be redirected to your dashboard momentarily.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      
      {/* HEADER */}
      <div>
        <button onClick={() => router.back()} className="inline-flex items-center text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors mb-4">
          <ChevronLeft className="h-4 w-4 mr-1" /> Back
        </button>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <Stethoscope className="h-6 w-6 text-indigo-600 dark:text-indigo-400" /> Clinic Referral Form
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Refer an assigned student to the clinic for medical attention.
        </p>
      </div>

      {/* FORM CARD */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden transition-colors">
        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
          
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-sm rounded-lg flex items-start gap-3 border border-red-100 dark:border-red-900/50">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {/* STUDENT SELECTION */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-200">Select Student <span className="text-red-500">*</span></label>
            <select
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              disabled={isLoadingStudents || isSubmitting}
              className="flex h-10 w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
              required
            >
              <option value="" disabled>-- Select a student --</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.firstName} {s.lastName} (ID: {s.idNumber})
                </option>
              ))}
            </select>
            {isLoadingStudents && <p className="text-xs text-blue-600 dark:text-blue-400 animate-pulse">Loading assigned students...</p>}
          </div>

          {/* URGENCY LEVEL */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-200">Urgency Level <span className="text-red-500">*</span></label>
            <select
              value={urgency}
              onChange={(e) => setUrgency(e.target.value)}
              disabled={isSubmitting}
              className="flex h-10 w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
            >
              <option value="LOW">Low - Routine check or minor concern</option>
              <option value="MEDIUM">Medium - Needs attention today</option>
              <option value="HIGH">High - Needs immediate attention</option>
              <option value="EMERGENCY">Emergency - Severe situation</option>
            </select>
          </div>

          {/* REASON */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-200">Reason for Referral <span className="text-red-500">*</span></label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please describe the student's symptoms or reason for visiting the clinic..."
              rows={4}
              disabled={isSubmitting}
              className="flex w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 resize-y transition-colors"
              required
            />
            <p className="text-xs text-slate-500 dark:text-slate-400">Keep it brief. Avoid making medical diagnoses.</p>
          </div>

          {/* ACTIONS */}
          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-700">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => router.back()}
              disabled={isSubmitting}
              className="border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || !patientId || !reason}
              className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[140px]"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Submitting...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Send className="h-4 w-4" /> Submit Referral
                </span>
              )}
            </Button>
          </div>

        </form>
      </div>
    </div>
  );
}