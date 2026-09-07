"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, User, Phone, Calendar, Activity, FileText, X, Save, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function StudentProfilePage() {
  const params = useParams();
  const router = useRouter();
  const [student, setStudent] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null); 
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // ================= MODAL STATES =================
  const [isVisitModalOpen, setIsVisitModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [visitForm, setVisitForm] = useState({
    reason: "",
    diagnosis: "",
    treatment: "",
    medicineUsed: ""
  });

  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    gender: "",
    contactNo: "",
    gradeLevel: "",
    section: ""
  });

  // FETCH TOTOONG DATA GALING SA BACKEND
  useEffect(() => {
    const fetchStudentProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No token found. Please login again.");

        // 👇 BINAGO: Pinalitan ang localhost at ginamit ang Environment Variable 👇
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/nurse/students/${params.id}`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load student profile");
        
        setStudent({ ...data.student, visits: data.student?.visits || [] });
        setSummary(data.summary);
        
        setEditForm({
          firstName: data.student.firstName || "",
          lastName: data.student.lastName || "",
          dateOfBirth: data.student.dateOfBirth ? new Date(data.student.dateOfBirth).toISOString().split('T')[0] : "",
          gender: data.student.gender || "",
          contactNo: data.student.contactNo || "",
          gradeLevel: data.student.gradeLevel || "",
          section: data.student.section || ""
        });

      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    if (params.id) {
      fetchStudentProfile();
    }
  }, [params.id]);

  // ================= FUNCTIONS =================
  const handleVisitFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setVisitForm({ ...visitForm, [e.target.name]: e.target.value });
  };

  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleLogVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      // 👇 BINAGO: Pinalitan ang localhost at ginamit ang Environment Variable 👇
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/nurse/students/${params.id}/visits`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify(visitForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to log visit");

      setStudent((prev: any) => ({ ...prev, visits: [data.visit, ...(prev.visits || [])] }));
      setIsVisitModalOpen(false);
      setVisitForm({ reason: "", diagnosis: "", treatment: "", medicineUsed: "" });
    } catch (err: any) {
      alert(err.message || "Failed to log visit.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      // 👇 BINAGO: Pinalitan ang localhost at ginamit ang Environment Variable 👇
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/nurse/students/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify(editForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update profile");

      // Optimistic Update ng UI
      setStudent((prev: any) => ({ ...prev, ...editForm, dateOfBirth: new Date(editForm.dateOfBirth) }));
      setIsEditModalOpen(false);
    } catch (err: any) {
      alert(err.message || "Failed to update profile.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="h-10 w-10 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500 font-medium">Loading medical record...</p>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 font-medium">{error || "Student not found"}</p>
        <Button onClick={() => router.back()} className="mt-4" variant="outline">Go Back</Button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-300 pb-12 relative">
      
      {/* Header & Back Button */}
      <div>
        <button onClick={() => router.back()} className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors mb-4">
          <ChevronLeft className="h-4 w-4 mr-1" /> Back to Directory
        </button>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <User className="h-6 w-6 text-blue-600" /> Student Medical Profile
          </h1>
          <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
            student.clearanceStatus === 'CLEARED' || !student.clearanceStatus ? 'bg-green-100 text-green-700' : 
            student.clearanceStatus === 'PENDING CLEARANCE' ? 'bg-orange-100 text-orange-700' : 
            'bg-red-100 text-red-700'
          }`}>
            {student.clearanceStatus || "CLEARED"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Column: Personal Info Card */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative">
            <button 
              onClick={() => setIsEditModalOpen(true)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
              title="Edit Profile"
            >
              <Pencil className="h-4 w-4" />
            </button>

            <div className="h-20 w-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-200">
              <User className="h-10 w-10 text-slate-400" />
            </div>
            <h2 className="text-xl font-bold text-center text-slate-800">{student.firstName} {student.lastName}</h2>
            <p className="text-center text-slate-500 text-sm mb-6">{student.idNumber}</p>
            
            <div className="space-y-4 border-t pt-4">
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <Calendar className="h-4 w-4 text-slate-400" />
                <span>Born: {student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString() : 'N/A'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <User className="h-4 w-4 text-slate-400" />
                <span>Gender: {student.gender || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <Phone className="h-4 w-4 text-slate-400" />
                <span>Contact: {student.contactNo || "N/A"}</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <FileText className="h-4 w-4 text-slate-400" /> Academic Details
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Grade/Course:</span>
                <span className="font-medium text-slate-700">{student.gradeLevel || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Section:</span>
                <span className="font-medium text-slate-700">{student.section || "N/A"}</span>
              </div>
              <div className="flex justify-between border-t pt-3 mt-3">
                <span className="text-slate-500">Account Status:</span>
                <span className={`font-medium ${student.user?.isActive === false ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {student.user?.isActive === false ? 'Archived' : 'Active'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Clinic Visits History */}
        <div className="md:col-span-2">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-full">
            <div className="flex items-center justify-between border-b pb-4 mb-4">
              <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-500" /> Clinic Visit History
              </h3>
              <Button onClick={() => setIsVisitModalOpen(true)} size="sm" className="bg-blue-50 text-blue-600 hover:bg-blue-100 h-8">
                + Log Visit
              </Button>
            </div>

            {student.visits && student.visits.length > 0 ? (
              <div className="space-y-4">
                {student.visits.map((visit: any) => (
                  <div key={visit.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100/50 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-semibold text-slate-700 text-base">{visit.reason}</span>
                      <span className="text-xs text-slate-500 bg-white px-2 py-1 rounded-md border border-slate-200">
                        {new Date(visit.visitDate || visit.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {visit.diagnosis && <p className="text-sm text-slate-600 mt-2"><span className="font-semibold">Diagnosis:</span> {visit.diagnosis}</p>}
                    {visit.treatment && <p className="text-sm text-slate-600 mt-1"><span className="font-semibold">Treatment:</span> {visit.treatment}</p>}
                    {visit.medicineUsed && <p className="text-sm text-slate-600 mt-1"><span className="font-semibold">Medicine:</span> {visit.medicineUsed}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 px-4">
                <Activity className="h-12 w-12 text-slate-200 mx-auto mb-3" />
                <h4 className="text-slate-700 font-medium">No clinic visits yet</h4>
                <p className="text-slate-500 text-sm mt-1">This student has a clean bill of health and no recorded clinic visits.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ================= MODAL: LOG VISIT ================= */}
      {isVisitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800">Log Clinic Visit</h2>
              <button onClick={() => setIsVisitModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors rounded-full p-1 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              <form id="visitForm" onSubmit={handleLogVisit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700">Reason for Visit <span className="text-red-500">*</span></label>
                  <input required name="reason" value={visitForm.reason} onChange={handleVisitFormChange} placeholder="e.g. Headache, Fever, Stomach ache" className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700">Diagnosis (Optional)</label>
                  <input name="diagnosis" value={visitForm.diagnosis} onChange={handleVisitFormChange} placeholder="e.g. Tension headache" className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700">Treatment Applied (Optional)</label>
                  <textarea name="treatment" value={visitForm.treatment} onChange={handleVisitFormChange} placeholder="e.g. Advised to rest for 30 minutes in the clinic bed." rows={3} className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-none" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700">Medicine Given (Optional)</label>
                  <input name="medicineUsed" value={visitForm.medicineUsed} onChange={handleVisitFormChange} placeholder="e.g. 1 tablet Paracetamol (Biogesic)" className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                </div>
              </form>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setIsVisitModalOpen(false)} disabled={isSubmitting}>Cancel</Button>
              <Button type="submit" form="visitForm" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white min-w-[120px]">
                {isSubmitting ? "Saving..." : <><Save className="h-4 w-4 mr-2" /> Save Record</>}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: EDIT PROFILE ================= */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800">Edit Patient Profile</h2>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors rounded-full p-1 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              <form id="editForm" onSubmit={handleUpdateProfile} className="space-y-4">
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700">First Name <span className="text-red-500">*</span></label>
                    <input required name="firstName" value={editForm.firstName} onChange={handleEditFormChange} className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700">Last Name <span className="text-red-500">*</span></label>
                    <input required name="lastName" value={editForm.lastName} onChange={handleEditFormChange} className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700">Date of Birth <span className="text-red-500">*</span></label>
                    <input required type="date" name="dateOfBirth" value={editForm.dateOfBirth} onChange={handleEditFormChange} className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700">Gender</label>
                    <select name="gender" value={editForm.gender} onChange={handleEditFormChange} className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white">
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700">Contact Number</label>
                  <input name="contactNo" value={editForm.contactNo} onChange={handleEditFormChange} placeholder="e.g. 09123456789" className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700">Grade/Course</label>
                    <input name="gradeLevel" value={editForm.gradeLevel} onChange={handleEditFormChange} placeholder="e.g. BSIT" className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700">Section</label>
                    <input name="section" value={editForm.section} onChange={handleEditFormChange} placeholder="e.g. 1A" className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                  </div>
                </div>

              </form>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)} disabled={isSubmitting}>Cancel</Button>
              <Button type="submit" form="editForm" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white min-w-[120px]">
                {isSubmitting ? "Saving..." : <><Save className="h-4 w-4 mr-2" /> Save Profile</>}
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}