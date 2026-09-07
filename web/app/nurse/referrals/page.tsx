"use client";

import React, { useState, useEffect } from "react";
import { Search, Plus, Filter, Hospital, Printer, FileText, MoreVertical, CheckCircle2, Clock, XCircle, X, Save } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ReferralsPage() {
  const [referrals, setReferrals] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]); 
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // STATES PARA SA MENUS AT MODALS
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // STATE PARA SA SELECTED REFERRAL (Para sa View at Print)
  const [selectedReferral, setSelectedReferral] = useState<any | null>(null);

  // STATE PARA SA BAGONG REFERRAL FORM
  const [formData, setFormData] = useState({
    patientId: "",
    referredTo: "",
    reason: ""
  });

  // FETCH DATA MULA SA BACKEND
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        
        // 👇 BINAGO: Pinalitan ang localhost at ginamit ang Environment Variable 👇
        const resReferrals = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/nurse/referrals`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const dataReferrals = await resReferrals.json();
        
        // 👇 BINAGO: Pinalitan ang localhost at ginamit ang Environment Variable 👇
        const resPatients = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/nurse/students`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const dataPatients = await resPatients.json();

        if (resReferrals.ok) setReferrals(dataReferrals.referrals || []);
        if (resPatients.ok) setPatients(dataPatients.students || []);

      } catch (err) {
        console.error("Failed to load data", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // FUNCTION PARA I-SAVE ANG BAGONG REFERRAL
  const handleCreateReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("token");
      // 👇 BINAGO: Pinalitan ang localhost at ginamit ang Environment Variable 👇
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/nurse/referrals`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (res.ok) {
        setReferrals([data.referral, ...referrals]);
        setIsCreateModalOpen(false);
        setFormData({ patientId: "", referredTo: "", reason: "" });
      } else {
        alert(data.error || "Failed to create referral");
      }
    } catch (err) {
      console.error("Failed to submit referral", err);
      alert("Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // FUNCTION PARA I-UPDATE ANG STATUS
  const handleUpdateStatus = async (referralId: string, newStatus: string) => {
    setActiveMenuId(null); 
    setReferrals(prevReferrals => prevReferrals.map(ref => 
      ref.id === referralId ? { ...ref, status: newStatus } : ref
    ));

    try {
      const token = localStorage.getItem("token");
      // 👇 BINAGO: Pinalitan ang localhost at ginamit ang Environment Variable 👇
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/nurse/referrals/${referralId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
    } catch (err) {
      console.error("Failed to update status in DB", err);
    }
  };

  // ==========================================
  // BAGONG FUNCTIONS: VIEW AT PRINT
  // ==========================================
  const handleViewDocument = (ref: any) => {
    setSelectedReferral(ref);
    setIsViewModalOpen(true);
  };

  const handlePrintSlip = (ref: any) => {
    setSelectedReferral(ref);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  // SEARCH FILTER LOGIC
  const filteredReferrals = referrals.filter(ref => {
    const fullName = `${ref.patient?.firstName} ${ref.patient?.lastName}`.toLowerCase();
    const hospital = (ref.referredTo || "").toLowerCase();
    const search = searchTerm.toLowerCase();
    return fullName.includes(search) || hospital.includes(search) || ref.id.toLowerCase().includes(search);
  });

  return (
    <>
      <div className="space-y-6 animate-in fade-in duration-300 pb-24 relative print:hidden">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Medical Referrals</h1>
            <p className="text-slate-500 text-sm mt-1">Manage and track patient transfers to external hospitals or clinics.</p>
          </div>
          
          <Button 
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 px-4 py-2 rounded-lg transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" /> Create Referral
          </Button>
        </div>

        {/* Search and Filter */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Patient Name or Hospital..."
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" className="flex items-center gap-2 text-slate-600 border-slate-200 hover:bg-slate-50 py-2.5">
            <Filter className="h-4 w-4" /> Filter Records
          </Button>
        </div>

        {/* Referrals Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-visible">
          <div className="overflow-x-auto min-h-[400px]">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
                <tr>
                  <th className="px-6 py-4">Referral ID</th>
                  <th className="px-6 py-4">Patient Info</th>
                  <th className="px-6 py-4">Referred To</th>
                  <th className="px-6 py-4">Reason</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center">
                        <div className="h-8 w-8 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin mb-3"></div>
                        Loading referral records...
                      </div>
                    </td>
                  </tr>
                ) : filteredReferrals.length > 0 ? (
                  filteredReferrals.map((ref) => {
                    const displayId = `REF-${ref.id.slice(-4).toUpperCase()}`; 
                    const dateObj = new Date(ref.createdAt);
                    const dateString = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                    
                    const isCompleted = ref.status === 'COMPLETED';
                    const isPending = ref.status === 'PENDING';
                    
                    return (
                      <tr key={ref.id} className="hover:bg-slate-50/80 transition-colors group">
                        <td className="px-6 py-4">
                          <p className="font-medium text-slate-800">{displayId}</p>
                          <p className="text-xs text-slate-400">{dateString}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-semibold text-slate-800">{ref.patient?.firstName} {ref.patient?.lastName}</p>
                          <p className="text-xs text-slate-500">{ref.patient?.idNumber}</p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-slate-700 font-medium">
                            <Hospital className="h-4 w-4 text-slate-400" />
                            {ref.referredTo || "Unknown Hospital"}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-600 max-w-[200px] truncate" title={ref.reason}>
                          {ref.reason}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                            isPending ? 'bg-orange-100 text-orange-700' :
                            isCompleted ? 'bg-green-100 text-green-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {ref.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          
                          <div className="flex items-center justify-end gap-1">
                            
                            {/* ACTION 1: VIEW DOCUMENT */}
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-blue-600 hover:bg-blue-50" 
                              title="View Document"
                              onClick={() => handleViewDocument(ref)}
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                            
                            {/* ACTION 2: PRINT SLIP */}
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-slate-600 hover:bg-slate-100" 
                              title="Print Referral Slip"
                              onClick={() => handlePrintSlip(ref)}
                            >
                              <Printer className="h-4 w-4" />
                            </Button>

                            {/* 3-DOTS DROPDOWN MENU */}
                            <div className="relative">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-slate-400 hover:text-slate-600"
                                onClick={() => setActiveMenuId(activeMenuId === ref.id ? null : ref.id)}
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>

                              {/* Dropdown Popup */}
                              {activeMenuId === ref.id && (
                                <div className="absolute right-0 top-10 mt-1 w-48 bg-white border border-slate-200 rounded-lg shadow-xl z-50 overflow-hidden text-left">
                                  <div className="px-3 py-2 bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    Update Status
                                  </div>
                                  <button onClick={() => handleUpdateStatus(ref.id, 'PENDING')} className="w-full px-4 py-2.5 text-sm text-slate-700 hover:bg-orange-50 hover:text-orange-700 flex items-center gap-2 transition-colors">
                                    <Clock className="h-4 w-4" /> Mark as Pending
                                  </button>
                                  <button onClick={() => handleUpdateStatus(ref.id, 'COMPLETED')} className="w-full px-4 py-2.5 text-sm text-slate-700 hover:bg-green-50 hover:text-green-700 flex items-center gap-2 transition-colors">
                                    <CheckCircle2 className="h-4 w-4" /> Mark as Completed
                                  </button>
                                  <button onClick={() => handleUpdateStatus(ref.id, 'CANCELLED')} className="w-full px-4 py-2.5 text-sm text-slate-700 hover:bg-red-50 hover:text-red-700 flex items-center gap-2 transition-colors">
                                    <XCircle className="h-4 w-4" /> Mark as Cancelled
                                  </button>
                                </div>
                              )}
                            </div>

                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                      <p>No medical referrals found.</p>
                    </td>
                  </tr>
                )}

              </tbody>
            </table>
          </div>
        </div>

        {/* ================= MODAL OVERLAY PARA SA CREATE REFERRAL ================= */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                <h2 className="text-lg font-bold text-slate-800">Create Medical Referral</h2>
                <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors rounded-full p-1 hover:bg-slate-100">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto">
                <form id="referralForm" onSubmit={handleCreateReferral} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700">Select Patient <span className="text-red-500">*</span></label>
                    <select required className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white" value={formData.patientId} onChange={(e) => setFormData({...formData, patientId: e.target.value})}>
                      <option value="" disabled>-- Select a student --</option>
                      {patients.map(patient => (
                        <option key={patient.id} value={patient.id}>
                          {patient.firstName} {patient.lastName} ({patient.idNumber})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700">Referred To (Hospital/Clinic) <span className="text-red-500">*</span></label>
                    <input required placeholder="e.g. PGH Care or Celestia Medical Center" className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-sm" value={formData.referredTo} onChange={(e) => setFormData({...formData, referredTo: e.target.value})} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700">Reason for Referral <span className="text-red-500">*</span></label>
                    <textarea required placeholder="State the medical reason or chief complaint..." rows={4} className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-none" value={formData.reason} onChange={(e) => setFormData({...formData, reason: e.target.value})} />
                  </div>
                </form>
              </div>

              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)} disabled={isSubmitting}>Cancel</Button>
                <Button type="submit" form="referralForm" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white min-w-[120px]">
                  {isSubmitting ? "Creating..." : <><Save className="h-4 w-4 mr-2" /> Create Referral</>}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ================= MODAL OVERLAY PARA SA VIEW DOCUMENT ================= */}
        {isViewModalOpen && selectedReferral && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
              
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
                <div className="flex items-center gap-2 text-slate-800">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <h2 className="text-lg font-bold">Referral Details</h2>
                </div>
                <button onClick={() => setIsViewModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors rounded-full p-1 hover:bg-slate-200">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Referral ID</p>
                    <p className="text-sm font-medium text-slate-800">REF-{selectedReferral.id.slice(-4).toUpperCase()}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Date Created</p>
                    <p className="text-sm font-medium text-slate-800">
                      {new Date(selectedReferral.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                </div>
                
                <hr className="border-slate-100 my-2" />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Patient Name</p>
                    <p className="text-sm font-bold text-slate-800">{selectedReferral.patient.firstName} {selectedReferral.patient.lastName}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Student ID</p>
                    <p className="text-sm font-medium text-slate-800">{selectedReferral.patient.idNumber}</p>
                  </div>
                </div>

                <hr className="border-slate-100 my-2" />

                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Referred To (Destination)</p>
                  <div className="flex items-center gap-2">
                    <Hospital className="h-4 w-4 text-slate-400" />
                    <p className="text-sm font-medium text-slate-800">{selectedReferral.referredTo || "Unknown Hospital"}</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Medical Reason / Notes</p>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-sm text-slate-700 min-h-[80px]">
                    {selectedReferral.reason}
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setIsViewModalOpen(false)}>Close</Button>
                <Button onClick={() => handlePrintSlip(selectedReferral)} className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Printer className="h-4 w-4 mr-2" /> Print Slip
                </Button>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* ================= PRINTABLE LAYOUT ================= */}
      {selectedReferral && (
        <div className="hidden print:block absolute top-0 left-0 w-full h-full bg-white text-black p-8 font-sans">
          
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black uppercase tracking-widest text-slate-900">CLINNOVATE</h1>
            <h2 className="text-lg font-semibold text-slate-600 mt-1">MEDICAL REFERRAL SLIP</h2>
            <div className="mt-4 border-b-2 border-black w-full"></div>
          </div>

          <div className="flex justify-between items-start mb-8 text-sm">
            <div>
              <p className="mb-2"><span className="font-bold w-24 inline-block">Referral ID:</span> REF-{selectedReferral.id.slice(-4).toUpperCase()}</p>
              <p><span className="font-bold w-24 inline-block">Date:</span> {new Date(selectedReferral.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
            </div>
          </div>

          <div className="mb-8 border border-slate-300 p-4 rounded-lg">
            <h3 className="font-bold text-lg mb-4 border-b pb-2">Patient Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <p><span className="font-bold text-slate-600 block">Patient Name:</span> {selectedReferral.patient.firstName} {selectedReferral.patient.lastName}</p>
              <p><span className="font-bold text-slate-600 block">Student ID Number:</span> {selectedReferral.patient.idNumber}</p>
            </div>
          </div>

          <div className="mb-8 border border-slate-300 p-4 rounded-lg">
            <h3 className="font-bold text-lg mb-4 border-b pb-2">Referral Details</h3>
            <p className="text-sm mb-4"><span className="font-bold text-slate-600 block mb-1">Referred To (Hospital/Clinic):</span> {selectedReferral.referredTo || "Unknown"}</p>
            <p className="text-sm"><span className="font-bold text-slate-600 block mb-1">Reason for Referral / Chief Complaint:</span></p>
            <div className="min-h-[100px] text-sm italic">
              {selectedReferral.reason}
            </div>
          </div>

          <div className="mt-24 flex justify-between items-end">
            <div className="text-center w-64">
              <div className="border-t border-black mb-1"></div>
              <p className="font-bold text-sm">School Nurse / Physician</p>
              <p className="text-xs text-slate-500">Signature over Printed Name</p>
            </div>
            <div className="text-center w-64">
              <div className="border-t border-black mb-1"></div>
              <p className="font-bold text-sm">Receiving Hospital</p>
              <p className="text-xs text-slate-500">Signature over Printed Name / Date</p>
            </div>
          </div>

        </div>
      )}
    </>
  );
}