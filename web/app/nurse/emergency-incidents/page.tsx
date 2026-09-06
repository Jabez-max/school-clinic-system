"use client";

import React, { useState, useEffect } from "react";
import { Search, Filter, Siren, AlertOctagon, MapPin, Clock, FileText, MoreVertical, PhoneCall, X, Save, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function EmergencyIncidentsPage() {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalThisYear: 0, hospitalTransfers: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // MODAL STATES
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<any | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // FORM STATES
  const [formData, setFormData] = useState({
    patientId: "",
    incidentType: "",
    location: "",
    status: "UNDER OBSERVATION",
    description: ""
  });

  // FETCH DATA
  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token");
      
      // Fetch Incidents
      const resIncidents = await fetch("http://localhost:5000/api/nurse/emergency-incidents", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const dataIncidents = await resIncidents.json();

      // Fetch Students/Patients for the dropdown
      const resPatients = await fetch("http://localhost:5000/api/nurse/students", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const dataPatients = await resPatients.json();

      if (resIncidents.ok) {
        setIncidents(dataIncidents.incidents || []);
        setStats(dataIncidents.stats || { totalThisYear: 0, hospitalTransfers: 0 });
      }
      if (resPatients.ok) setPatients(dataPatients.students || []);

    } catch (err) {
      console.error("Failed to load data", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // SUBMIT NEW EMERGENCY
  const handleLogEmergency = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/nurse/emergency-incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        await fetchData(); // Refresh table and stats
        setIsAddModalOpen(false);
        setFormData({ patientId: "", incidentType: "", location: "", status: "UNDER OBSERVATION", description: "" });
      } else {
        alert("Failed to log emergency.");
      }
    } catch (err) {
      console.error("Error logging emergency", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // UPDATE STATUS
  const handleUpdateStatus = async (id: string, newStatus: string) => {
    setActiveMenuId(null);
    setIncidents(prev => prev.map(inc => inc.id === id ? { ...inc, status: newStatus } : inc));

    try {
      const token = localStorage.getItem("token");
      await fetch(`http://localhost:5000/api/nurse/emergency-incidents/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus })
      });
      fetchData(); // Refresh to update "Hospital Transfers" stat if needed
    } catch (err) {
      console.error("Error updating status", err);
    }
  };

  // VIEW RECORD
  const handleViewRecord = (incident: any) => {
    setSelectedIncident(incident);
    setIsViewModalOpen(true);
  };

  // SEARCH FILTER
  const filteredIncidents = incidents.filter(inc => {
    const search = searchTerm.toLowerCase();
    const patientName = inc.patient ? `${inc.patient.firstName} ${inc.patient.lastName}`.toLowerCase() : "";
    const type = (inc.incidentType || "").toLowerCase();
    const loc = (inc.location || "").toLowerCase();
    return patientName.includes(search) || type.includes(search) || loc.includes(search);
  });

  // BADGE COLORS
  const getStatusStyle = (status: string) => {
    const s = (status || "").toUpperCase();
    if (s === "RESOLVED") return "bg-green-100 text-green-700";
    if (s === "HOSPITAL TRANSFER") return "bg-red-100 text-red-700";
    if (s === "UNDER OBSERVATION") return "bg-orange-100 text-orange-700";
    return "bg-slate-100 text-slate-700";
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-24 relative">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Emergency Incidents</h1>
          <p className="text-slate-500 text-sm mt-1">Log and track critical medical emergencies and immediate responses.</p>
        </div>
        <Button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-2 px-4 py-2 rounded-lg transition-colors shadow-sm"
        >
          <Siren className="h-4 w-4" /> Log Emergency
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-red-50 text-red-600 rounded-lg">
            <AlertOctagon className="h-6 w-6" />
          </div>
          <div>
            <p className="text-slate-500 text-sm font-medium">Total Emergencies (This Year)</p>
            <p className="text-2xl font-bold text-slate-800">{isLoading ? "..." : stats.totalThisYear}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <PhoneCall className="h-6 w-6" />
          </div>
          <div>
            <p className="text-slate-500 text-sm font-medium">Hospital Transfers</p>
            <p className="text-2xl font-bold text-slate-800">{isLoading ? "..." : stats.hospitalTransfers}</p>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Patient Name, Incident Type, or Location..."
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" className="flex items-center gap-2 text-slate-600 border-slate-200 hover:bg-slate-50 py-2.5">
          <Filter className="h-4 w-4" /> Filter Records
        </Button>
      </div>

      {/* Incidents Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-visible">
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
              <tr>
                <th className="px-6 py-4">Incident ID</th>
                <th className="px-6 py-4">Patient Involved</th>
                <th className="px-6 py-4">Incident Details</th>
                <th className="px-6 py-4">Date & Time</th>
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
                      Loading emergencies...
                    </div>
                  </td>
                </tr>
              ) : filteredIncidents.length > 0 ? (
                filteredIncidents.map((incident) => {
                  const dateObj = new Date(incident.createdAt);
                  const displayDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                  const displayTime = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                  const displayId = `EMG-${dateObj.getFullYear().toString().slice(-2)}-${incident.id.slice(-3).toUpperCase()}`;

                  return (
                    <tr key={incident.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-6 py-4">
                        <p className="font-medium text-slate-500">{displayId}</p>
                      </td>
                      <td className="px-6 py-4">
                        {incident.patient ? (
                          <>
                            <p className="font-bold text-slate-800">{incident.patient.firstName} {incident.patient.lastName}</p>
                            <p className="text-xs text-slate-400">{incident.patient.idNumber}</p>
                          </>
                        ) : (
                          <p className="font-medium text-slate-500 italic">Unknown Patient</p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-slate-800 font-semibold">{incident.incidentType}</p>
                        <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                          <MapPin className="h-3.5 w-3.5" /> {incident.location}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-slate-700 font-medium">{displayDate}</p>
                        <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                          <Clock className="h-3.5 w-3.5" /> {displayTime}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`whitespace-nowrap inline-block px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${getStatusStyle(incident.status)}`}>
                          {incident.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          
                          {/* VIEW RECORD */}
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-blue-600 hover:bg-blue-50" 
                            title="View Incident Report"
                            onClick={() => handleViewRecord(incident)}
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                          
                          {/* 3-DOTS MENU */}
                          <div className="relative inline-block">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-slate-400 hover:text-slate-600"
                              onClick={() => setActiveMenuId(activeMenuId === incident.id ? null : incident.id)}
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>

                            {activeMenuId === incident.id && (
                              <div className="absolute right-0 top-10 mt-1 w-48 bg-white border border-slate-200 rounded-lg shadow-xl z-50 overflow-hidden text-left">
                                <div className="px-3 py-2 bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                  Update Status
                                </div>
                                <button onClick={() => handleUpdateStatus(incident.id, 'UNDER OBSERVATION')} className="w-full px-4 py-2.5 text-sm text-slate-700 hover:bg-orange-50 hover:text-orange-700 flex items-center gap-2 transition-colors">
                                  <AlertCircle className="h-4 w-4" /> Under Observation
                                </button>
                                <button onClick={() => handleUpdateStatus(incident.id, 'RESOLVED')} className="w-full px-4 py-2.5 text-sm text-slate-700 hover:bg-green-50 hover:text-green-700 flex items-center gap-2 transition-colors">
                                  <CheckCircle2 className="h-4 w-4" /> Resolved
                                </button>
                                <button onClick={() => handleUpdateStatus(incident.id, 'HOSPITAL TRANSFER')} className="w-full px-4 py-2.5 text-sm text-red-700 hover:bg-red-50 flex items-center gap-2 transition-colors font-semibold">
                                  <PhoneCall className="h-4 w-4" /> Hospital Transfer
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
                    <p>No emergency incidents logged yet.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= MODAL: LOG EMERGENCY ================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-red-50">
              <div className="flex items-center gap-2">
                <Siren className="h-5 w-5 text-red-600" />
                <h2 className="text-lg font-bold text-red-800">Log Emergency Incident</h2>
              </div>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="text-red-400 hover:text-red-600 transition-colors rounded-full p-1 hover:bg-red-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              <form id="emergencyForm" onSubmit={handleLogEmergency} className="space-y-4">
                
                {/* Select Patient */}
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700">Patient Involved (Optional)</label>
                  <select 
                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-red-500 outline-none text-sm bg-white"
                    value={formData.patientId}
                    onChange={(e) => setFormData({...formData, patientId: e.target.value})}
                  >
                    <option value="">-- Unknown / Guest / Select Patient --</option>
                    {patients.map(patient => (
                      <option key={patient.id} value={patient.id}>
                        {patient.firstName} {patient.lastName} ({patient.idNumber})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700">Incident Type <span className="text-red-500">*</span></label>
                    <input 
                      required 
                      placeholder="e.g. Sports Injury, Severe Asthma Attack" 
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-red-500 outline-none text-sm" 
                      value={formData.incidentType}
                      onChange={(e) => setFormData({...formData, incidentType: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700">Location <span className="text-red-500">*</span></label>
                    <input 
                      required 
                      placeholder="e.g. Gymnasium, Room 304" 
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-red-500 outline-none text-sm" 
                      value={formData.location}
                      onChange={(e) => setFormData({...formData, location: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700">Current Status</label>
                    <select 
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-red-500 outline-none text-sm bg-white"
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value})}
                    >
                      <option value="UNDER OBSERVATION">Under Observation</option>
                      <option value="RESOLVED">Resolved</option>
                      <option value="HOSPITAL TRANSFER">Hospital Transfer</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700">Description / Actions Taken <span className="text-red-500">*</span></label>
                  <textarea 
                    required
                    placeholder="Briefly describe the situation and immediate first-aid provided..." 
                    rows={3}
                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-red-500 outline-none text-sm resize-none" 
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                  />
                </div>

              </form>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" form="emergencyForm" disabled={isSubmitting} className="bg-red-600 hover:bg-red-700 text-white min-w-[120px]">
                {isSubmitting ? "Logging..." : <><Save className="h-4 w-4 mr-2" /> Log Incident</>}
              </Button>
            </div>

          </div>
        </div>
      )}

      {/* ================= MODAL: VIEW INCIDENT REPORT ================= */}
      {isViewModalOpen && selectedIncident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2 text-slate-800">
                <AlertOctagon className="h-5 w-5 text-red-600" />
                <h2 className="text-lg font-bold">Emergency Report Details</h2>
              </div>
              <button onClick={() => setIsViewModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors rounded-full p-1 hover:bg-slate-200">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Incident ID</p>
                  <p className="text-sm font-bold text-slate-800">
                    EMG-{new Date(selectedIncident.createdAt).getFullYear().toString().slice(-2)}-{selectedIncident.id.slice(-3).toUpperCase()}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Date / Time</p>
                  <p className="text-sm font-medium text-slate-800">
                    {new Date(selectedIncident.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
              
              <hr className="border-slate-100 my-2" />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Patient Name</p>
                  <p className="text-sm font-bold text-slate-800">
                    {selectedIncident.patient ? `${selectedIncident.patient.firstName} ${selectedIncident.patient.lastName}` : 'Unknown / Guest'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Student ID</p>
                  <p className="text-sm font-medium text-slate-800">
                    {selectedIncident.patient?.idNumber || 'N/A'}
                  </p>
                </div>
              </div>

              <hr className="border-slate-100 my-2" />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Incident Type</p>
                  <p className="text-sm font-semibold text-slate-800">{selectedIncident.incidentType}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Location</p>
                  <div className="flex items-center gap-1 mt-1 text-slate-800 text-sm font-medium">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                    {selectedIncident.location}
                  </div>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 mt-2">Current Status</p>
                <span className={`px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider inline-block mt-1 ${getStatusStyle(selectedIncident.status)}`}>
                  {selectedIncident.status}
                </span>
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 mt-2">Description / Actions Taken</p>
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 text-sm text-slate-700 min-h-[80px] whitespace-pre-wrap">
                  {selectedIncident.description || "No description provided."}
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