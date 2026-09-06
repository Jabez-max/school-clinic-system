"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { 
  ArrowLeft, 
  User, 
  Phone, 
  Calendar, 
  Activity, 
  FileText, 
  Clock, 
  ShieldAlert,
  Plus,
  X,
  Stethoscope,
  CheckCircle2,
  Loader2,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function StudentProfilePage() {
  const params = useParams();
  const studentId = params?.id as string;

  // ================= STATES PARA SA DATA FETCHING =================
  const [student, setStudent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // ================= STATES PARA SA REFERRAL MODAL =================
  const [isReferModalOpen, setIsReferModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [referralData, setReferralData] = useState({
    reason: "",
    urgency: "MEDIUM"
  });

  // ================= FETCH TOTOONG STUDENT DATA MULA SA DB =================
  const fetchStudentProfile = async () => {
    setIsLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:5000/api/head-teacher/students/${studentId}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (res.ok) {
        setStudent(data.student);
      } else {
        setError(data.error || "Failed to load student profile");
      }
    } catch (err) {
      setError("Failed to connect to the server.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (studentId) {
      fetchStudentProfile();
    }
  }, [studentId]);

  // Utility function para makuha ang totoong edad
  const calculateAge = (dob: string) => {
    if (!dob) return "N/A";
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // ================= FUNCTION PARA I-SUBMIT ANG REFERRAL =================
  const handleSubmitReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!referralData.reason) return;

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/head-teacher/referrals", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          patientId: studentId, 
          reason: referralData.reason,
          urgency: referralData.urgency
        })
      });

      const data = await res.json();

      if (res.ok) {
        setSuccessMessage("Student successfully referred to the clinic!");
        // Refresh ang profile data para lumabas agad sa History ang bagong referral!
        fetchStudentProfile();

        setTimeout(() => {
          setIsReferModalOpen(false);
          setSuccessMessage("");
          setReferralData({ reason: "", urgency: "MEDIUM" });
        }, 2000);
      } else {
        alert(data.error || "Failed to submit referral");
      }
    } catch (err) {
      console.error("Referral error:", err);
      alert("An error occurred while submitting the referral.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ================= LOADING & ERROR STATES =================
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="h-10 w-10 text-blue-600 animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Loading student record...</p>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="flex flex-col items-center justify-center py-12 bg-white rounded-2xl border border-red-100 shadow-sm mt-6">
        <AlertCircle className="h-12 w-12 text-red-500 mb-3" />
        <h2 className="text-xl font-bold text-slate-800">Profile Not Found</h2>
        <p className="text-slate-500 mt-2 mb-6">{error || "This student might not belong to your section."}</p>
        <Link href="/head-teacher/students">
          <Button variant="outline" className="text-slate-600">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Directory
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* HEADER & BACK BUTTON */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <Link className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-blue-600 mb-2 transition-colors" href="/head-teacher/students">
            <ArrowLeft className="mr-1.5 h-4 w-4"/>
            Back to Directory
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Student Profile</h1>
          <p className="text-sm text-slate-500">View student details and clinic referral history.</p>
        </div>
        
        <Button onClick={() => setIsReferModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
          <Plus className="mr-2 h-4 w-4"/> Refer to Clinic
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: STUDENT INFO CARD */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 text-center border-b border-slate-100 bg-slate-50/50">
              <div className="h-20 w-20 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold border-4 border-white shadow-sm">
                {student.firstName[0]}{student.lastName[0]}
              </div>
              <h2 className="text-xl font-bold text-slate-900">{student.firstName} {student.lastName}</h2>
              <p className="text-sm text-slate-500 font-medium mb-3">ID: {student.idNumber || student.id.slice(-6).toUpperCase()}</p>
              <Badge className="bg-green-50 text-green-700 border-green-200 uppercase font-bold tracking-wider text-[10px]" variant="outline">
                {student.clearanceStatus || "ACTIVE"}
              </Badge>
            </div>
            
            <div className="p-5 space-y-4">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Grade & Section</p>
                <p className="text-sm font-medium text-slate-800 flex items-center">
                  <User className="mr-2 h-4 w-4 text-slate-400"/>
                  {student.gradeLevel} - {student.section}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Demographics</p>
                <p className="text-sm font-medium text-slate-800 flex items-center capitalize">
                  <Calendar className="mr-2 h-4 w-4 text-slate-400"/>
                  {student.gender?.toLowerCase() || "N/A"}, {calculateAge(student.dateOfBirth)} yrs old
                </p>
              </div>
            </div>
          </div>

          {/* EMERGENCY CONTACT CARD */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center">
              <ShieldAlert className="mr-2 h-4 w-4 text-orange-500"/> 
              Emergency Contact
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Phone Number</p>
                <p className="text-sm font-medium text-slate-800 flex items-center">
                  <Phone className="mr-2 h-4 w-4 text-slate-400"/>
                  {student.contactNo || "No contact info available"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: HISTORY & ACTIVITY */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
            <ShieldAlert className="h-5 w-5 text-blue-600 mt-0.5 shrink-0"/>
            <div>
              <h4 className="text-sm font-bold text-blue-900">Data Privacy & Confidentiality</h4>
              <p className="text-xs text-blue-700 mt-1">
                For data privacy reasons, you can only view clinic referrals initiated by you or general clearance statuses. Detailed medical notes, diagnoses, and treatments are restricted to certified clinic personnel.
              </p>
            </div>
          </div>

          {/* REAL REFERRAL HISTORY GALING DATABASE */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center">
                <Activity className="mr-2 h-5 w-5 text-slate-400"/>
                Clinic Referral History
              </h3>
            </div>
            
            <div className="divide-y divide-slate-100">
              {student.referrals && student.referrals.length > 0 ? (
                student.referrals.map((referral: any) => (
                  <div key={referral.id} className="p-6 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-slate-900 text-sm">{referral.reason}</span>
                        <Badge className="text-[10px] font-bold uppercase" variant="secondary">
                          {referral.urgency}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500 flex items-center">
                        <Clock className="mr-1.5 h-3.5 w-3.5"/>
                        Referred on {new Date(referral.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge 
                      className={`px-3 py-1 text-xs font-semibold tracking-wider uppercase ${
                        referral.status === "COMPLETED" || referral.status === "CLEARED" 
                          ? "bg-green-100 text-green-700 hover:bg-green-100" 
                          : referral.status === "CANCELLED"
                          ? "bg-red-100 text-red-700 hover:bg-red-100"
                          : "bg-amber-100 text-amber-700 hover:bg-amber-100"
                      }`}
                      variant="secondary"
                    >
                      {referral.status}
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-slate-500">
                  <FileText className="h-8 w-8 text-slate-300 mx-auto mb-3"/>
                  <p className="text-sm font-medium">No referral history found.</p>
                  <p className="text-xs mt-1">This student has not been referred to the clinic recently.</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* ================= REFERRAL MODAL POPUP ================= */}
      {isReferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="font-bold text-slate-800 flex items-center gap-2">
                <Stethoscope className="h-5 w-5 text-blue-600" /> Clinic Referral
              </h2>
              <button 
                onClick={() => setIsReferModalOpen(false)} 
                className="text-slate-400 hover:text-slate-600 bg-white hover:bg-slate-100 p-1 rounded-full transition-colors"
                disabled={isSubmitting}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6">
              {successMessage ? (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <CheckCircle2 className="h-12 w-12 text-green-500 mb-3" />
                  <h3 className="text-lg font-bold text-slate-800">Success!</h3>
                  <p className="text-slate-500 text-sm mt-1">{successMessage}</p>
                </div>
              ) : (
                <form id="referralFormProfile" onSubmit={handleSubmitReferral} className="space-y-4">
                  
                  <div className="bg-blue-50/50 border border-blue-100 p-3 rounded-lg flex items-center gap-3">
                    <div className="h-10 w-10 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold">
                      {student.firstName[0]}{student.lastName[0]}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">{student.firstName} {student.lastName}</p>
                      <p className="text-xs text-slate-500">{student.gradeLevel} - {student.section}</p>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Reason for Referral <span className="text-red-500">*</span></label>
                    <textarea 
                      required
                      rows={3}
                      placeholder="e.g. Complaining of severe headache and fever..."
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      value={referralData.reason}
                      onChange={(e) => setReferralData({...referralData, reason: e.target.value})}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Urgency Level</label>
                    <select 
                      className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      value={referralData.urgency}
                      onChange={(e) => setReferralData({...referralData, urgency: e.target.value})}
                    >
                      <option value="LOW">Low (Minor discomfort)</option>
                      <option value="MEDIUM">Medium (Needs medical attention soon)</option>
                      <option value="HIGH">High (Immediate attention required)</option>
                    </select>
                  </div>
                </form>
              )}
            </div>

            {!successMessage && (
              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setIsReferModalOpen(false)} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button type="submit" form="referralFormProfile" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white min-w-[120px]">
                  {isSubmitting ? "Sending..." : "Submit Referral"}
                </Button>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}