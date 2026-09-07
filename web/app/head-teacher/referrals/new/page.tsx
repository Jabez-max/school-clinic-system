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

        // 👇 BINAGO: Pinalitan ang localhost at ginamit ang Environment Variable 👇
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
      // 👇 BINAGO: Pinalitan ang localhost at ginamit ang Environment Variable 👇
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
        // Ibalik sa Referrals Table imbes na sa Dashboard
        router.push("/head-teacher/referrals"); 
      }, 2000);

    } catch (err: any) {
      setError(err.message);
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-xl mx-auto mt-20 p-8 bg-white rounded-2xl shadow-sm border border-green-100 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-300">
        <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <CheckCircle2 className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800">Referral Submitted!</h2>
        <p className="text-slate-500 mt-2 mb-6">
          The clinic referral has been successfully sent to the nurse. You will be redirected to the referrals list momentarily.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12 animate-in fade-in duration-300">
      
      {/* HEADER */}
      <div>
        <button onClick={() => router.back()} className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors mb-4">
          <ChevronLeft className="h-4 w-4 mr-1" /> Back to Referrals
        </button>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Stethoscope className="h-6 w-6 text-blue-600" /> Clinic Referral Form
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Refer an assigned student to the clinic for medical attention.
        </p>
      </div>

      {/* FORM CARD */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
          
          {error && (
            <div className="p-4 bg-red-50 text-red-700 text-sm rounded-lg flex items-start gap-3 border border-red-100">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {/* STUDENT SELECTION */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Select Student <span className="text-red-500">*</span></label>
            <select
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              disabled={isLoadingStudents || isSubmitting}
              className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              required
            >
              <option value="" disabled>-- Select a student --</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.firstName} {s.lastName} (ID: {s.idNumber})
                </option>
              ))}
            </select>
            {isLoadingStudents && <p className="text-xs text-blue-600 animate-pulse">Loading assigned students...</p>}
          </div>

          {/* URGENCY LEVEL */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Urgency Level <span className="text-red-500">*</span></label>
            <select
              value={urgency}
              onChange={(e) => setUrgency(e.target.value)}
              disabled={isSubmitting}
              className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="LOW">Low - Routine check or minor concern</option>
              <option value="MEDIUM">Medium - Needs attention today</option>
              <option value="HIGH">High - Needs immediate attention</option>
              <option value="EMERGENCY">Emergency - Severe situation</option>
            </select>
          </div>

          {/* REASON */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Reason for Referral <span className="text-red-500">*</span></label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please describe the student's symptoms or reason for visiting the clinic..."
              rows={4}
              disabled={isSubmitting}
              className="flex w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 resize-y"
              required
            />
            <p className="text-xs text-slate-400">Keep it brief. Avoid making medical diagnoses.</p>
          </div>

          {/* ACTIONS */}
          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => router.back()}
              disabled={isSubmitting}
              className="border-slate-200 text-slate-600"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || !patientId || !reason}
              className="bg-blue-600 hover:bg-blue-700 text-white min-w-[140px]"
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