"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Search, Filter, Activity, Clock, Plus, Eye, MoreVertical, X, Save, CheckCircle2, Bed, ChevronLeft, ChevronRight, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ClinicVisitsPage() {
  const [visits, setVisits] = useState<any[]>([]);
  // 👇 INAYOS ANG STATS PARA SA SMART VIEW 👇
  const [stats, setStats] = useState({ isSearching: false, totalCount: 0, currentlyResting: 0 });
  const [isLoading, setIsLoading] = useState(true);
  
  // PAGINATION & FILTER STATES
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  // MODAL & MENU STATES
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // CUSTOM ERROR POPUP STATE
  const [errorModal, setErrorModal] = useState({ isOpen: false, message: "" });

  // SEARCH PATIENT DEBOUNCE (PARA SA MODAL)
  const [patientSearch, setPatientSearch] = useState("");
  const [patientResults, setPatientResults] = useState<any[]>([]);
  
  // FORM DATA 
  const [formData, setFormData] = useState({
    patientId: "",
    visitType: "General Consultation",
    reason: "",
    symptoms: "",
    temperature: "",
    bloodPressure: "",
  });

  // FETCH TOTOONG DATA MULA SA BACKEND (MAY SMART VIEW LOGIC NA)
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      
      // Kukunin natin lahat ng data para kayang i-filter ng buong history
      const resVisits = await fetch(`http://localhost:5000/api/nurse/clinic-visits`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const dataVisits = await resVisits.json();

      if (resVisits.ok) {
        let allVisits = dataVisits.visits || [];
        
        // Setup Date ngayon para mabilang ang visits today
        const today = new Date();
        const todayStr = today.getFullYear() + "-" + (today.getMonth() + 1) + "-" + today.getDate();

        // 1. Bilangin kung ilan ang pumasok NGAYONG ARAW
        const visitsTodayCount = allVisits.filter((v: any) => {
          const vDate = new Date(v.createdAt);
          const vDateStr = vDate.getFullYear() + "-" + (vDate.getMonth() + 1) + "-" + vDate.getDate();
          return vDateStr === todayStr;
        }).length;

        // 2. Tingnan kung may hinahanap si Nurse sa Search Bar o Status Filter
        const isSearching = searchTerm.trim().length > 0 || statusFilter !== "";

        if (searchTerm) {
          const lowerSearch = searchTerm.toLowerCase();
          allVisits = allVisits.filter((v: any) => 
            (v.patient?.firstName || "").toLowerCase().includes(lowerSearch) ||
            (v.patient?.lastName || "").toLowerCase().includes(lowerSearch) ||
            (v.id || "").toLowerCase().includes(lowerSearch)
          );
        }

        if (statusFilter) {
          allVisits = allVisits.filter((v: any) => v.status === statusFilter);
        }

        // Setup Pagination variables
        const totalItems = allVisits.length;
        setTotalPages(Math.ceil(totalItems / itemsPerPage) || 1);
        
        // Slicing para sa current page
        const startIndex = (page - 1) * itemsPerPage;
        const paginatedVisits = allVisits.slice(startIndex, startIndex + itemsPerPage);

        setVisits(paginatedVisits);

        // 3. Bilangin ang currently resting (Kahit ano pa ang petsa)
        const restingCount = allVisits.filter((v: any) => 
          ['WAITING', 'IN_CONSULTATION', 'PENDING'].includes(v.status)
        ).length;

        // 👇 4. SMART VIEW LOGIC: Kung nag-search, history ang bibilangin. Kung wala, ngayong araw lang.
        setStats({ 
          isSearching: isSearching,
          totalCount: isSearching ? totalItems : visitsTodayCount, 
          currentlyResting: restingCount 
        });
      }
    } catch (err) {
      console.error("Failed to load data", err);
    } finally {
      setIsLoading(false);
    }
  }, [page, searchTerm, statusFilter]);

  useEffect(() => {
    const delay = setTimeout(() => fetchData(), 300);
    return () => clearTimeout(delay);
  }, [fetchData]);

  // SEARCH PATIENT PARA SA DROPDOWN
  useEffect(() => {
    if (patientSearch.length > 2) {
      const delay = setTimeout(async () => {
        try {
          const token = localStorage.getItem("token");
          const res = await fetch(`http://localhost:5000/api/nurse/students?search=${patientSearch}&limit=5`, { 
            headers: { "Authorization": `Bearer ${token}` }
          });
          
          if (res.ok) {
            const data = await res.json();
            setPatientResults(data.students || []);
          }
        } catch (err) {
          console.error("Error searching patient:", err);
        }
      }, 300);
      return () => clearTimeout(delay);
    } else {
      setPatientResults([]);
    }
  }, [patientSearch]);

  // SUBMIT BAGONG VISIT
  const handleLogVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.patientId) {
      setErrorModal({ isOpen: true, message: "Please select a patient first." });
      return;
    }
    
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:5000/api/nurse/students/${formData.patientId}/visits`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({
          reason: formData.reason,
          diagnosis: formData.visitType, 
          treatment: formData.symptoms, 
        })
      });

      if (res.ok) {
        setPage(1); 
        await fetchData(); 
        setIsAddModalOpen(false);
        setFormData({ patientId: "", visitType: "General Consultation", reason: "", symptoms: "", temperature: "", bloodPressure: "" });
        setPatientSearch("");
      } else {
        const errData = await res.json();
        setErrorModal({ isOpen: true, message: errData.error || "Failed to log visit." });
      }
    } catch (err) {
      console.error("Error logging visit", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // I-UPDATE ANG STATUS
  const handleUpdateStatus = async (id: string, newStatus: string) => {
    setActiveMenuId(null);
    
    // Optimistic UI Update (Para mabilis magbago sa screen habang naglo-load pa yung backend)
    setVisits(prev => prev.map(v => v.id === id ? { ...v, status: newStatus } : v));

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:5000/api/nurse/clinic-visits/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) {
         const err = await res.json();
         setErrorModal({ isOpen: true, message: err.error || "Failed to update status" });
         fetchData(); 
      } else {
         fetchData(); 
      }
    } catch (err) {
      console.error("Error updating status", err);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-24 relative">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Clinic Visits log</h1>
          <p className="text-slate-500 text-sm mt-1">Track and manage daily student walk-ins and medical consultations.</p>
        </div>
        <Button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 px-4 py-2 rounded-lg shadow-sm transition-colors"
        >
          <Plus className="h-4 w-4" /> Log New Visit
        </Button>
      </div>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 transition-all duration-300">
          <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center border border-blue-100">
            <Activity className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            {/* 👇 DYNAMIC TITLE 👇 */}
            <p className="text-sm text-slate-500 font-medium">
              {stats.isSearching ? "Total Visits Found" : "Total Visits Today"}
            </p>
            <h3 className="text-2xl font-bold text-slate-800">{stats.totalCount}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-orange-50 flex items-center justify-center border border-orange-100">
            <Clock className="h-6 w-6 text-orange-600" />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Pending / Resting</p>
            <h3 className="text-2xl font-bold text-slate-800">{stats.currentlyResting}</h3>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Patient Name or Visit ID..."
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
          />
        </div>
        <select 
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-4 py-2.5 rounded-lg border border-slate-200 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Statuses</option>
          <option value="WAITING">Waiting</option>
          <option value="IN_CONSULTATION">In Consultation</option>
          <option value="COMPLETED">Completed</option>
          <option value="REFERRED">Referred</option>
          <option value="EMERGENCY">Emergency</option>
        </select>
      </div>

      {/* Data Table Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-visible">
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
              <tr>
                <th className="px-6 py-4">Visit ID</th>
                <th className="px-6 py-4">Patient Info</th>
                <th className="px-6 py-4">Time In</th>
                <th className="px-6 py-4">Chief Complaint</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-3" />
                      Loading visit logs...
                    </div>
                  </td>
                </tr>
              ) : visits.length > 0 ? (
                visits.map((visit) => {
                  const displayId = `V-${visit.id.slice(-4).toUpperCase()}`; 
                  const dateObj = new Date(visit.visitDate || visit.createdAt);
                  const timeString = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  const dateString = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                  
                  return (
                    <tr key={visit.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-6 py-4 text-slate-500 font-medium">{displayId}</td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-800">{visit.patient?.firstName} {visit.patient?.lastName}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{visit.patient?.idNumber}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-700">{timeString}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{dateString}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-700 truncate max-w-[200px]">{visit.reason}</div>
                        <div className="text-xs text-slate-500 mt-0.5 truncate max-w-[200px]">{visit.diagnosis || visit.visitType}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                          visit.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 
                          visit.status === 'WAITING' || visit.status === 'IN_CONSULTATION' || visit.status === 'PENDING' ? 'bg-orange-100 text-orange-700' : 
                          'bg-red-100 text-red-700'
                        }`}>
                          {visit.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link href={`/nurse/clinic-visits/${visit.id}`}>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:bg-blue-50" title="View Full Report">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>

                          <div className="relative inline-block">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-slate-400 hover:text-slate-600"
                              onClick={() => setActiveMenuId(activeMenuId === visit.id ? null : visit.id)}
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>

                            {activeMenuId === visit.id && (
                              <div className="absolute right-0 top-10 mt-1 w-44 bg-white border border-slate-200 rounded-lg shadow-xl z-50 overflow-hidden text-left">
                                <div className="px-3 py-2 bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                  Quick Status Update
                                </div>
                                <button onClick={() => handleUpdateStatus(visit.id, 'WAITING')} className="w-full px-4 py-2 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2">
                                  <Bed className="h-4 w-4" /> Set as Waiting
                                </button>
                                <button onClick={() => handleUpdateStatus(visit.id, 'COMPLETED')} className="w-full px-4 py-2 text-sm text-slate-700 hover:bg-green-50 hover:text-green-700 flex items-center gap-2 border-t border-slate-100">
                                  <CheckCircle2 className="h-4 w-4" /> Mark Completed
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
                    <p>No clinic visits found.</p>
                  </td>
                </tr>
              )}

            </tbody>
          </table>
        </div>

        {/* Server-Side Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex justify-between items-center bg-slate-50/50">
            <span className="text-sm text-slate-500">Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => Math.max(p - 1, 1))}><ChevronLeft className="h-4 w-4" /></Button>
              <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => Math.min(p + 1, totalPages))}><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </div>
        )}

      </div>

      {/* ================= MODAL OVERLAY PARA SA LOG NEW VISIT ================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800">Log New Clinic Visit</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors rounded-full p-1 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              <form id="visitForm" onSubmit={handleLogVisit} className="space-y-4">
                
                {/* SELECT PATIENT VIA SEARCH */}
                <div className="space-y-1.5 relative">
                  <label className="text-sm font-bold text-slate-700">Search Patient <span className="text-red-500">*</span></label>
                  {!formData.patientId ? (
                    <>
                      <input 
                        type="text" placeholder="Type at least 3 letters of name..." value={patientSearch} onChange={(e) => setPatientSearch(e.target.value)}
                        className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white"
                      />
                      {patientResults.length > 0 && (
                        <div className="absolute w-full mt-1 bg-white border rounded-md shadow-lg z-50 max-h-40 overflow-y-auto text-sm">
                          {patientResults.map(p => (
                            <div key={p.id} onClick={() => { setFormData({...formData, patientId: p.id}); setPatientSearch(`${p.firstName} ${p.lastName}`); setPatientResults([]); }}
                                 className="p-3 hover:bg-blue-50 cursor-pointer border-b last:border-0 flex justify-between items-center transition-colors">
                              <span className="font-semibold text-slate-700">{p.firstName} {p.lastName}</span> 
                              <span className="text-xs text-slate-400 font-mono bg-slate-100 px-2 py-0.5 rounded">{p.idNumber}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {patientSearch.length > 2 && patientResults.length === 0 && (
                        <div className="absolute w-full mt-1 bg-white border rounded-md shadow-lg z-50 p-3 text-sm text-center text-slate-500">
                          No patient found in directory.
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex justify-between items-center p-3 border rounded-md bg-blue-50 text-sm border-blue-100 shadow-inner">
                      <span className="font-bold text-blue-900 flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" /> {patientSearch}
                      </span>
                      <button type="button" onClick={() => { setFormData({...formData, patientId: ""}); setPatientSearch(""); }} className="text-xs text-blue-600 hover:text-blue-800 underline font-medium">Change Patient</button>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700">Visit Type <span className="text-red-500">*</span></label>
                  <select required value={formData.visitType} onChange={(e) => setFormData({...formData, visitType: e.target.value})} className="w-full px-3 py-2 border rounded-md bg-white text-sm outline-none focus:ring-2 focus:ring-blue-500">
                    <option>General Consultation</option><option>Minor Injury</option><option>First Aid</option><option>Illness</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700">Chief Complaint <span className="text-red-500">*</span></label>
                  <input required placeholder="e.g. Headache, Fever, Stomachache" className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-sm" value={formData.reason} onChange={(e) => setFormData({...formData, reason: e.target.value})} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700">Temp (°C)</label>
                    <input type="number" step="0.1" placeholder="36.5" className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-sm" value={formData.temperature} onChange={(e) => setFormData({...formData, temperature: e.target.value})} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700">BP (mmHg)</label>
                    <input type="text" placeholder="120/80" className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-sm" value={formData.bloodPressure} onChange={(e) => setFormData({...formData, bloodPressure: e.target.value})} />
                  </div>
                </div>

              </form>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)} disabled={isSubmitting}>Cancel</Button>
              <Button type="submit" form="visitForm" disabled={isSubmitting || !formData.patientId} className="bg-blue-600 hover:bg-blue-700 text-white min-w-[120px]">
                {isSubmitting ? "Saving..." : <><Save className="h-4 w-4 mr-2" /> Start Visit</>}
              </Button>
            </div>

          </div>
        </div>
      )}

      {/* ================= CUSTOM ERROR POPUP ================= */}
      {errorModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in zoom-in-95 duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="h-8 w-8 text-rose-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">Action Required</h3>
              <p className="text-sm text-slate-600">{errorModal.message}</p>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-center">
              <Button 
                onClick={() => setErrorModal({ isOpen: false, message: "" })} 
                className="bg-slate-900 hover:bg-slate-800 text-white min-w-[120px] rounded-xl"
              >
                Got it
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}