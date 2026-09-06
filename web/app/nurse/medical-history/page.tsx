"use client";

import React, { useState, useEffect } from "react";
import { Search, Plus, Filter, History, Calendar, Stethoscope, MoreVertical, FileText, X, Save, CheckCircle2, AlertCircle, Activity, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function MedicalHistoryPage() {
  const [histories, setHistories] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // MODALS & MENUS STATES
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedHistory, setSelectedHistory] = useState<any | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // FORM STATE
  const [formData, setFormData] = useState({
    patientId: "",
    condition: "",
    notes: "",
    dateOrYear: "",
    severity: "ONGOING"
  });

  // FETCH DATA MULA SA DATABASE
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        
        // Fetch Medical Histories
        const resHistories = await fetch("http://localhost:5000/api/nurse/medical-history", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const dataHistories = await resHistories.json();
        
        // Fetch Students for dropdown
        const resPatients = await fetch("http://localhost:5000/api/nurse/students", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const dataPatients = await resPatients.json();

        if (resHistories.ok) setHistories(dataHistories.histories || []);
        if (resPatients.ok) setPatients(dataPatients.students || []);

      } catch (err) {
        console.error("Failed to load data", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // SUBMIT BAGONG MEDICAL HISTORY
  const handleCreateHistory = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/nurse/medical-history", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (res.ok) {
        setHistories([data.history, ...histories]);
        setIsCreateModalOpen(false);
        setFormData({ patientId: "", condition: "", notes: "", dateOrYear: "", severity: "ONGOING" });
      } else {
        alert(data.error || "Failed to add medical history");
      }
    } catch (err) {
      console.error("Failed to submit record", err);
      alert("Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // UPDATE SEVERITY (3-DOTS)
  const handleUpdateSeverity = async (historyId: string, newSeverity: string) => {
    setActiveMenuId(null);
    setHistories(prev => prev.map(h => h.id === historyId ? { ...h, severity: newSeverity } : h));

    try {
      const token = localStorage.getItem("token");
      await fetch(`http://localhost:5000/api/nurse/medical-history/${historyId}/severity`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ severity: newSeverity })
      });
    } catch (err) {
      console.error("Failed to update severity in DB", err);
    }
  };

  // VIEW RECORD
  const handleViewRecord = (history: any) => {
    setSelectedHistory(history);
    setIsViewModalOpen(true);
  };

  // SEARCH FILTER LOGIC
  const filteredHistories = histories.filter(h => {
    const fullName = `${h.patient?.firstName} ${h.patient?.lastName}`.toLowerCase();
    const idNum = (h.patient?.idNumber || "").toLowerCase();
    const cond = (h.condition || "").toLowerCase();
    const search = searchTerm.toLowerCase();
    return fullName.includes(search) || idNum.includes(search) || cond.includes(search);
  });

  // BADGE COLORS
  const getSeverityStyle = (severity: string) => {
    const s = (severity || "").toUpperCase();
    if (s === "RESOLVED") return "bg-green-100 text-green-700";
    if (s === "MILD") return "bg-yellow-100 text-yellow-700";
    if (s === "ONGOING") return "bg-orange-100 text-orange-700";
    if (s === "SEVERE") return "bg-red-100 text-red-700";
    return "bg-slate-100 text-slate-700";
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-24 relative">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Medical History</h1>
          <p className="text-slate-500 text-sm mt-1">Review past surgeries, chronic illnesses, and major health events.</p>
        </div>
        <Button 
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 px-4 py-2 rounded-lg transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" /> Log Past Illness
        </Button>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Patient Name or Condition..."
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" className="flex items-center gap-2 text-slate-600 border-slate-200 hover:bg-slate-50 py-2.5">
          <Filter className="h-4 w-4" /> Filter History
        </Button>
      </div>

      {/* Medical History Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-visible">
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
              <tr>
                <th className="px-6 py-4">History ID</th>
                <th className="px-6 py-4">Patient Info</th>
                <th className="px-6 py-4">Condition / Illness</th>
                <th className="px-6 py-4">Date / Year</th>
                <th className="px-6 py-4">Severity</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <div className="h-8 w-8 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin mb-3"></div>
                      Loading medical histories...
                    </div>
                  </td>
                </tr>
              ) : filteredHistories.length > 0 ? (
                filteredHistories.map((item) => {
                  const displayId = `MH-${item.id.slice(-3).toUpperCase()}`; 
                  const dateObj = new Date(item.dateOrYear);
                  const displayDate = dateObj.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-6 py-4">
                        <p className="font-medium text-slate-500">{displayId}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-800">{item.patient?.firstName} {item.patient?.lastName}</p>
                        <p className="text-xs text-slate-400">{item.patient?.idNumber}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-2">
                          <Stethoscope className="h-4 w-4 text-slate-400 mt-0.5" />
                          <div>
                            <p className="font-semibold text-slate-700">{item.condition}</p>
                            <p className="text-xs text-slate-500 max-w-[200px] truncate" title={item.notes}>{item.notes || "No additional notes"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-slate-600">
                          <Calendar className="h-4 w-4 text-slate-400" />
                          {displayDate}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider inline-block text-center ${getSeverityStyle(item.severity)}`}>
                          {item.severity}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          
                          {/* VIEW REPORT ICON */}
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-blue-600 hover:bg-blue-50" 
                            title="View Full Report"
                            onClick={() => handleViewRecord(item)}
                          >
                            <FileText className="h-4 w-4" />
                          </Button>

                          {/* 3-DOTS MENU */}
                          <div className="relative inline-block">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-slate-400 hover:text-slate-600"
                              onClick={() => setActiveMenuId(activeMenuId === item.id ? null : item.id)}
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>

                            {activeMenuId === item.id && (
                              <div className="absolute right-0 top-10 mt-1 w-48 bg-white border border-slate-200 rounded-lg shadow-xl z-50 overflow-hidden text-left">
                                <div className="px-3 py-2 bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                  Update Severity
                                </div>
                                <button onClick={() => handleUpdateSeverity(item.id, 'RESOLVED')} className="w-full px-4 py-2.5 text-sm text-slate-700 hover:bg-green-50 hover:text-green-700 flex items-center gap-2 transition-colors">
                                  <CheckCircle2 className="h-4 w-4" /> Resolved
                                </button>
                                <button onClick={() => handleUpdateSeverity(item.id, 'MILD')} className="w-full px-4 py-2.5 text-sm text-slate-700 hover:bg-yellow-50 hover:text-yellow-700 flex items-center gap-2 transition-colors">
                                  <AlertCircle className="h-4 w-4" /> Mild
                                </button>
                                <button onClick={() => handleUpdateSeverity(item.id, 'ONGOING')} className="w-full px-4 py-2.5 text-sm text-slate-700 hover:bg-orange-50 hover:text-orange-700 flex items-center gap-2 transition-colors">
                                  <Activity className="h-4 w-4" /> Ongoing
                                </button>
                                <button onClick={() => handleUpdateSeverity(item.id, 'SEVERE')} className="w-full px-4 py-2.5 text-sm text-slate-700 hover:bg-red-50 hover:text-red-700 flex items-center gap-2 transition-colors">
                                  <AlertTriangle className="h-4 w-4" /> Severe
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
                    <p>No medical histories found.</p>
                  </td>
                </tr>
              )}

            </tbody>
          </table>
        </div>
      </div>

      {/* ================= MODAL OVERLAY PARA SA LOG ILLNESS ================= */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800">Log Past Illness / Event</h2>
              <button 
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors rounded-full p-1 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              <form id="historyForm" onSubmit={handleCreateHistory} className="space-y-4">
                
                {/* Select Patient */}
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700">Select Patient <span className="text-red-500">*</span></label>
                  <select 
                    required 
                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white"
                    value={formData.patientId}
                    onChange={(e) => setFormData({...formData, patientId: e.target.value})}
                  >
                    <option value="" disabled>-- Select a student --</option>
                    {patients.map(patient => (
                      <option key={patient.id} value={patient.id}>
                        {patient.firstName} {patient.lastName} ({patient.idNumber})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Condition */}
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700">Condition / Illness <span className="text-red-500">*</span></label>
                  <input 
                    required 
                    placeholder="e.g. Appendectomy (Surgery) or Dengue Fever" 
                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-sm" 
                    value={formData.condition}
                    onChange={(e) => setFormData({...formData, condition: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Date/Year */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700">Date / Year <span className="text-red-500">*</span></label>
                    <input 
                      type="date"
                      required
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                      value={formData.dateOrYear}
                      onChange={(e) => setFormData({...formData, dateOrYear: e.target.value})}
                    />
                  </div>
                  
                  {/* Severity */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700">Severity</label>
                    <select 
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white"
                      value={formData.severity}
                      onChange={(e) => setFormData({...formData, severity: e.target.value})}
                    >
                      <option value="RESOLVED">Resolved</option>
                      <option value="MILD">Mild</option>
                      <option value="ONGOING">Ongoing</option>
                      <option value="SEVERE">Severe</option>
                    </select>
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700">Notes / Details</label>
                  <textarea 
                    placeholder="e.g. Fully recovered, no complications..." 
                    rows={3}
                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-none" 
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  />
                </div>

              </form>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" form="historyForm" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white min-w-[120px]">
                {isSubmitting ? "Saving..." : <><Save className="h-4 w-4 mr-2" /> Log Illness</>}
              </Button>
            </div>

          </div>
        </div>
      )}

      {/* ================= MODAL OVERLAY PARA SA VIEW RECORD ================= */}
      {isViewModalOpen && selectedHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2 text-slate-800">
                <History className="h-5 w-5 text-blue-600" />
                <h2 className="text-lg font-bold">Medical History Details</h2>
              </div>
              <button onClick={() => setIsViewModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors rounded-full p-1 hover:bg-slate-200">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">History ID</p>
                  <p className="text-sm font-medium text-slate-800">MH-{selectedHistory.id.slice(-3).toUpperCase()}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Date / Year</p>
                  <p className="text-sm font-medium text-slate-800">
                    {new Date(selectedHistory.dateOrYear).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>
              
              <hr className="border-slate-100 my-2" />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Patient Name</p>
                  <p className="text-sm font-bold text-slate-800">{selectedHistory.patient.firstName} {selectedHistory.patient.lastName}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Student ID</p>
                  <p className="text-sm font-medium text-slate-800">{selectedHistory.patient.idNumber}</p>
                </div>
              </div>

              <hr className="border-slate-100 my-2" />

              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Condition / Illness</p>
                <div className="flex items-center gap-2 mt-1">
                  <Stethoscope className="h-4 w-4 text-slate-400" />
                  <p className="text-base font-semibold text-slate-800">{selectedHistory.condition}</p>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Severity Status</p>
                <span className={`px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider inline-block mt-1 ${getSeverityStyle(selectedHistory.severity)}`}>
                  {selectedHistory.severity}
                </span>
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Medical Notes</p>
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 text-sm text-slate-700 min-h-[80px]">
                  {selectedHistory.notes || "No additional notes provided."}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <Button type="button" variant="outline" onClick={() => setIsViewModalOpen(false)}>Close</Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}