"use client";

import React, { useState, useEffect } from "react";
import { Search, Plus, Filter, FileHeart, Download, Eye, MoreVertical, Activity, X, Save, ShieldAlert, CheckCircle2, AlertCircle, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";

// IDINAGDAG NATIN ITO PARA SA DIRECT PDF DOWNLOAD!
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas-pro"; 

export default function HealthRecordsPage() {
  const [records, setRecords] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalActive: 0, updatedThisMonth: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // STATES PARA SA MODALS & MENUS
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // STATE PARA SA BAGONG RECORD FORM
  const [formData, setFormData] = useState({
    patientId: "",
    bloodType: "",
    allergies: "None",
    conditionStatus: "HEALTHY",
    lastCheckup: ""
  });

  // STATE PARA SA FULL EDIT FORM
  const [editData, setEditData] = useState({
    bloodType: "",
    allergies: "",
    conditionStatus: "",
    weight: "",
    height: "",
    birthdate: "",
    gender: "",
    emergencyContactPerson: "",
    emergencyContactNumber: ""
  });

  // FETCH DATA MULA SA DATABASE
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        
        const resRecords = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/nurse/health-records`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const dataRecords = await resRecords.json();
        
        const resPatients = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/nurse/students`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const dataPatients = await resPatients.json();

        if (resRecords.ok) {
          setRecords(dataRecords.records || []);
          setStats(dataRecords.stats || { totalActive: 0, updatedThisMonth: 0 });
        }
        if (resPatients.ok) {
          setPatients(dataPatients.students || []);
        }

      } catch (err) {
        console.error("Failed to load data", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // SUBMIT BAGONG HEALTH RECORD
  const handleCreateRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/nurse/health-records`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (res.ok) {
        setRecords([data.record, ...records]); 
        setStats(prev => ({ ...prev, totalActive: prev.totalActive + 1 })); 
        setIsCreateModalOpen(false);
        setFormData({ patientId: "", bloodType: "", allergies: "None", conditionStatus: "HEALTHY", lastCheckup: "" });
      } else {
        alert(data.error || "Failed to create health record");
      }
    } catch (err) {
      console.error("Failed to submit record", err);
      alert("Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // OPEN EDIT MODAL AND POPULATE DATA
  const handleOpenEditModal = (record: any) => {
    setActiveMenuId(null);
    setSelectedRecord(record);
    setEditData({
      bloodType: record.bloodType || "",
      allergies: record.allergies || "None",
      conditionStatus: record.conditionStatus || "HEALTHY",
      weight: record.weight || "",
      height: record.height || "",
      // 👇 INAYOS: Kinonvert ang dateOfBirth para mabasa ng date picker natin
      birthdate: record.patient?.dateOfBirth ? new Date(record.patient.dateOfBirth).toISOString().split('T')[0] : "",
      gender: record.patient?.gender || "",
      emergencyContactPerson: record.patient?.emergencyContactPerson || "",
      emergencyContactNumber: record.patient?.emergencyContactNumber || ""
    });
    setIsEditModalOpen(true);
  };

  // SUBMIT EDITED RECORD
  const handleEditRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord) return;
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/nurse/health-records/${selectedRecord.id}/full-update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
            ...editData,
            // 👇 INAYOS: Ginamit natin mismo ang patientId mula sa record
            patientId: selectedRecord.patientId 
        })
      });

      const data = await res.json();

      if (res.ok) {
        // Update local state without refreshing page
        setRecords(prevRecords => prevRecords.map(rec => 
          rec.id === selectedRecord.id ? { 
            ...rec, 
            ...editData,
            patient: {
                ...rec.patient,
                dateOfBirth: editData.birthdate, // Itinama ang variable name
                gender: editData.gender,
                emergencyContactPerson: editData.emergencyContactPerson,
                emergencyContactNumber: editData.emergencyContactNumber
            } 
          } : rec
        ));
        setIsEditModalOpen(false);
        alert("Health Record updated successfully!");
      } else {
        alert(data.error || "Failed to update health record");
      }
    } catch (err) {
      console.error("Failed to update record", err);
      alert("Make sure you have created the /full-update route in your Express backend!");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3-DOTS UPDATE STATUS (QUICK ACTION)
  const handleUpdateStatus = async (recordId: string, newStatus: string) => {
    setActiveMenuId(null); 
    setRecords(prevRecords => prevRecords.map(rec => 
      rec.id === recordId ? { ...rec, conditionStatus: newStatus } : rec
    ));

    try {
      const token = localStorage.getItem("token");
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/nurse/health-records/${recordId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ conditionStatus: newStatus })
      });
    } catch (err) {
      console.error("Failed to update condition status in DB", err);
    }
  };

  // VIEW RECORD
  const handleViewRecord = (record: any) => {
    setSelectedRecord(record);
    setIsViewModalOpen(true);
  };

  // PDF DOWNLOAD LOGIC
  const handleDownloadPDF = async (record: any) => {
    setSelectedRecord(record); 
    
    setTimeout(async () => {
      const element = document.getElementById("pdf-content");
      if (!element) return;

      try {
        const canvas = await html2canvas(element, { scale: 2 });
        const imgData = canvas.toDataURL("image/png");

        const pdf = new jsPDF("p", "mm", "a4");
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

        pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
        pdf.save(`Health_Record_${record.patient.firstName}_${record.patient.lastName}.pdf`);
      } catch (error) {
        console.error("Error generating PDF:", error);
        alert("Failed to generate PDF.");
      }
    }, 300); 
  };

  // SEARCH FILTER LOGIC
  const filteredRecords = records.filter(record => {
    const fullName = `${record.patient?.firstName} ${record.patient?.lastName}`.toLowerCase();
    const idNumber = (record.patient?.idNumber || "").toLowerCase();
    const condition = (record.conditionStatus || "").toLowerCase();
    const search = searchTerm.toLowerCase();
    return fullName.includes(search) || idNumber.includes(search) || condition.includes(search);
  });

  const getConditionStyle = (status: string) => {
    const s = (status || "").toUpperCase();
    if (s.includes("HEALTHY")) return "bg-green-100 text-green-700";
    if (s.includes("MONITOR")) return "bg-orange-100 text-orange-700";
    if (s.includes("CHRONIC")) return "bg-pink-100 text-pink-700";
    if (s.includes("NEEDS ATTENTION")) return "bg-red-100 text-red-700";
    return "bg-slate-100 text-slate-700";
  };

  return (
    <>
      <div className="space-y-6 animate-in fade-in duration-300 pb-24 relative print:hidden">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Health Records</h1>
            <p className="text-slate-500 text-sm mt-1">Comprehensive medical histories and ongoing health tracking.</p>
          </div>
          <Button 
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 px-4 py-2 rounded-lg transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" /> Add New Record
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-rose-50 text-rose-600 rounded-lg">
              <FileHeart className="h-6 w-6" />
            </div>
            <div>
              <p className="text-slate-500 text-sm font-medium">Total Active Records</p>
              <p className="text-2xl font-bold text-slate-800">
                {isLoading ? "..." : stats.totalActive.toLocaleString()}
              </p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
              <Activity className="h-6 w-6" />
            </div>
            <div>
              <p className="text-slate-500 text-sm font-medium">Updated This Month</p>
              <p className="text-2xl font-bold text-slate-800">
                {isLoading ? "..." : stats.updatedThisMonth.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Patient Name, ID, or Condition..."
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" className="flex items-center gap-2 text-slate-600 border-slate-200 hover:bg-slate-50 py-2.5">
            <Filter className="h-4 w-4" /> Filter
          </Button>
        </div>

        {/* Health Records Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-visible">
          <div className="overflow-x-auto min-h-[300px]">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
                <tr>
                  <th className="px-6 py-4">Record ID</th>
                  <th className="px-6 py-4">Patient Info</th>
                  <th className="px-6 py-4">Blood Type</th>
                  <th className="px-6 py-4">Allergies</th>
                  <th className="px-6 py-4">Last Checkup</th>
                  <th className="px-6 py-4">Condition Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center">
                        <div className="h-8 w-8 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin mb-3"></div>
                        Loading health records...
                      </div>
                    </td>
                  </tr>
                ) : filteredRecords.length > 0 ? (
                  filteredRecords.map((record) => {
                    const displayId = `HR-${record.id.slice(-4).toUpperCase()}`; 
                    const dateString = record.lastCheckup 
                      ? new Date(record.lastCheckup).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) 
                      : "N/A";

                    return (
                      <tr key={record.id} className="hover:bg-slate-50/80 transition-colors group">
                        <td className="px-6 py-4 font-medium text-slate-500">{displayId}</td>
                        <td className="px-6 py-4">
                          <p className="font-semibold text-slate-800">{record.patient?.firstName} {record.patient?.lastName}</p>
                          <p className="text-xs text-slate-400">{record.patient?.idNumber}</p>
                        </td>
                        <td className="px-6 py-4">
                          {record.bloodType ? (
                            <span className="px-2.5 py-1 bg-red-50 text-red-600 rounded-md font-bold text-xs border border-red-100">
                              {record.bloodType}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs">N/A</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          {!record.allergies || record.allergies.toLowerCase() === "none" ? (
                            <span className="text-slate-400 italic">None</span>
                          ) : (
                            <span className="text-orange-600 font-medium">{record.allergies}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-slate-600">{dateString}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider inline-block text-center ${getConditionStyle(record.conditionStatus)}`}>
                            {record.conditionStatus || "HEALTHY"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-blue-600 hover:bg-blue-50" 
                              title="View Full Record"
                              onClick={() => handleViewRecord(record)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>

                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-slate-600 hover:bg-slate-100" 
                              title="Download PDF"
                              onClick={() => handleDownloadPDF(record)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>

                            <div className="relative">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-slate-400 hover:text-slate-600"
                                onClick={() => setActiveMenuId(activeMenuId === record.id ? null : record.id)}
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>

                              {activeMenuId === record.id && (
                                <div className="absolute right-0 top-10 mt-1 w-56 bg-white border border-slate-200 rounded-lg shadow-xl z-50 overflow-hidden text-left">
                                  <div className="px-3 py-2 bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    Update Condition
                                  </div>
                                  <button onClick={() => handleUpdateStatus(record.id, 'HEALTHY')} className="w-full px-4 py-2.5 text-sm text-slate-700 hover:bg-green-50 hover:text-green-700 flex items-center gap-2 transition-colors">
                                    <CheckCircle2 className="h-4 w-4" /> Mark as Healthy
                                  </button>
                                  <button onClick={() => handleUpdateStatus(record.id, 'MONITOR (ALLERGIES)')} className="w-full px-4 py-2.5 text-sm text-slate-700 hover:bg-orange-50 hover:text-orange-700 flex items-center gap-2 transition-colors">
                                    <AlertCircle className="h-4 w-4" /> Monitor (Allergies)
                                  </button>
                                  <button onClick={() => handleUpdateStatus(record.id, 'CHRONIC (ASTHMA)')} className="w-full px-4 py-2.5 text-sm text-slate-700 hover:bg-pink-50 hover:text-pink-700 flex items-center gap-2 transition-colors">
                                    <ShieldAlert className="h-4 w-4" /> Chronic (Asthma)
                                  </button>
                                  <button onClick={() => handleUpdateStatus(record.id, 'NEEDS ATTENTION')} className="w-full px-4 py-2.5 text-sm text-slate-700 hover:bg-red-50 hover:text-red-700 flex items-center gap-2 transition-colors">
                                    <AlertCircle className="h-4 w-4" /> Needs Attention
                                  </button>
                                  
                                  {/* BAGONG EDIT FULL RECORD BUTTON */}
                                  <div className="border-t border-slate-100 mt-1"></div>
                                  <button 
                                    onClick={() => handleOpenEditModal(record)} 
                                    className="w-full px-4 py-3 text-sm text-blue-700 font-semibold hover:bg-blue-50 flex items-center gap-2 transition-colors"
                                  >
                                    <Edit className="h-4 w-4" /> Edit Full Record
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
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                      <p>No health records found.</p>
                    </td>
                  </tr>
                )}

              </tbody>
            </table>
          </div>
        </div>

        {/* ================= MODAL OVERLAY PARA SA CREATE HEALTH RECORD ================= */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                <h2 className="text-lg font-bold text-slate-800">Add New Health Record</h2>
                <button 
                  onClick={() => setIsCreateModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 transition-colors rounded-full p-1 hover:bg-slate-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto">
                <form id="healthRecordForm" onSubmit={handleCreateRecord} className="space-y-4">
                  
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

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-slate-700">Blood Type</label>
                      <select 
                        className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white"
                        value={formData.bloodType}
                        onChange={(e) => setFormData({...formData, bloodType: e.target.value})}
                      >
                        <option value="">Unknown</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                      </select>
                    </div>
                    
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-slate-700">Last Checkup Date</label>
                      <input 
                        type="date"
                        className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                        value={formData.lastCheckup}
                        onChange={(e) => setFormData({...formData, lastCheckup: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700">Condition Status <span className="text-red-500">*</span></label>
                    <select 
                      required 
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white"
                      value={formData.conditionStatus}
                      onChange={(e) => setFormData({...formData, conditionStatus: e.target.value})}
                    >
                      <option value="HEALTHY">Healthy</option>
                      <option value="MONITOR (ALLERGIES)">Monitor (Allergies)</option>
                      <option value="CHRONIC (ASTHMA)">Chronic (Asthma)</option>
                      <option value="NEEDS ATTENTION">Needs Attention</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700">Allergies</label>
                    <input 
                      placeholder="e.g. Peanuts, Dust, Pollen (Leave 'None' if none)" 
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-sm" 
                      value={formData.allergies}
                      onChange={(e) => setFormData({...formData, allergies: e.target.value})}
                    />
                  </div>

                </form>
              </div>

              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button type="submit" form="healthRecordForm" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white min-w-[120px]">
                  {isSubmitting ? "Saving..." : <><Save className="h-4 w-4 mr-2" /> Save Record</>}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ================= MODAL OVERLAY PARA SA FULL EDIT RECORD ================= */}
        {isEditModalOpen && selectedRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-blue-50 text-blue-900">
                <div className="flex items-center gap-2">
                  <Edit className="h-5 w-5" />
                  <h2 className="text-lg font-bold">Edit Health Record: {selectedRecord.patient?.firstName}</h2>
                </div>
                <button 
                  onClick={() => setIsEditModalOpen(false)}
                  className="text-blue-400 hover:text-blue-600 transition-colors rounded-full p-1"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto">
                <form id="editRecordForm" onSubmit={handleEditRecord} className="space-y-6">
                  
                  {/* MEDICAL INFO SECTION */}
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 border-b pb-2 mb-3">Medical Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase">Blood Type</label>
                        <select 
                          className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white"
                          value={editData.bloodType}
                          onChange={(e) => setEditData({...editData, bloodType: e.target.value})}
                        >
                          <option value="">Unknown</option>
                          <option value="O+">O+</option>
                          <option value="O-">O-</option>
                          <option value="A+">A+</option>
                          <option value="A-">A-</option>
                          <option value="B+">B+</option>
                          <option value="B-">B-</option>
                          <option value="AB+">AB+</option>
                          <option value="AB-">AB-</option>
                        </select>
                      </div>
                      
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase">Condition Status</label>
                        <select 
                          required 
                          className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white"
                          value={editData.conditionStatus}
                          onChange={(e) => setEditData({...editData, conditionStatus: e.target.value})}
                        >
                          <option value="HEALTHY">Healthy</option>
                          <option value="MONITOR (ALLERGIES)">Monitor (Allergies)</option>
                          <option value="CHRONIC (ASTHMA)">Chronic (Asthma)</option>
                          <option value="NEEDS ATTENTION">Needs Attention</option>
                        </select>
                      </div>

                      <div className="col-span-2 space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase">Allergies</label>
                        <input 
                          placeholder="e.g. Peanuts, Dust, Pollen (Leave 'None' if none)" 
                          className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-sm" 
                          value={editData.allergies}
                          onChange={(e) => setEditData({...editData, allergies: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>

                  {/* VITAL & PERSONAL STATS SECTION */}
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 border-b pb-2 mb-3">Vital & Personal Stats</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase">Weight (kg)</label>
                        <input 
                          type="number" step="0.1" placeholder="e.g. 55.5"
                          className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                          value={editData.weight}
                          onChange={(e) => setEditData({...editData, weight: e.target.value})}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase">Height (cm)</label>
                        <input 
                          type="number" step="0.1" placeholder="e.g. 165"
                          className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                          value={editData.height}
                          onChange={(e) => setEditData({...editData, height: e.target.value})}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase">Birthdate</label>
                        <input 
                          type="date"
                          className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                          value={editData.birthdate}
                          onChange={(e) => setEditData({...editData, birthdate: e.target.value})}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase">Gender</label>
                        <select 
                          className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white"
                          value={editData.gender}
                          onChange={(e) => setEditData({...editData, gender: e.target.value})}
                        >
                          <option value="">Not Specified</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* EMERGENCY CONTACT SECTION */}
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 border-b pb-2 mb-3">Emergency Contact</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase">Contact Person Name</label>
                        <input 
                          placeholder="Full Name"
                          className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                          value={editData.emergencyContactPerson}
                          onChange={(e) => setEditData({...editData, emergencyContactPerson: e.target.value})}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase">Contact Number</label>
                        <input 
                          placeholder="e.g. 09123456789"
                          className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                          value={editData.emergencyContactNumber}
                          onChange={(e) => setEditData({...editData, emergencyContactNumber: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>

                </form>
              </div>

              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button type="submit" form="editRecordForm" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white min-w-[120px]">
                  {isSubmitting ? "Saving Updates..." : <><Save className="h-4 w-4 mr-2" /> Save Changes</>}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ================= MODAL OVERLAY PARA SA VIEW RECORD ================= */}
        {isViewModalOpen && selectedRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
              
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
                <div className="flex items-center gap-2 text-slate-800">
                  <FileHeart className="h-5 w-5 text-blue-600" />
                  <h2 className="text-lg font-bold">Health Record Details</h2>
                </div>
                <button onClick={() => setIsViewModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors rounded-full p-1 hover:bg-slate-200">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Record ID</p>
                    <p className="text-sm font-medium text-slate-800">HR-{selectedRecord.id.slice(-4).toUpperCase()}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Last Update</p>
                    <p className="text-sm font-medium text-slate-800">
                      {new Date(selectedRecord.updatedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                </div>
                
                <hr className="border-slate-100 my-2" />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Patient Name</p>
                    <p className="text-sm font-bold text-slate-800">{selectedRecord.patient?.firstName} {selectedRecord.patient?.lastName}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Student ID</p>
                    <p className="text-sm font-medium text-slate-800">{selectedRecord.patient?.idNumber}</p>
                  </div>
                </div>

                <hr className="border-slate-100 my-2" />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Blood Type</p>
                    {selectedRecord.bloodType ? (
                      <span className="px-2.5 py-1 bg-red-50 text-red-600 rounded-md font-bold text-sm border border-red-100 inline-block">
                        {selectedRecord.bloodType}
                      </span>
                    ) : (
                      <span className="text-sm text-slate-500">Unknown</span>
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Allergies</p>
                    <p className="text-sm font-medium text-orange-600">
                      {(!selectedRecord.allergies || selectedRecord.allergies.toLowerCase() === 'none') ? "None" : selectedRecord.allergies}
                    </p>
                  </div>
                </div>

                <hr className="border-slate-100 my-2" />

                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Current Condition Status</p>
                  <span className={`px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider inline-block mt-1 ${getConditionStyle(selectedRecord.conditionStatus)}`}>
                    {selectedRecord.conditionStatus || "HEALTHY"}
                  </span>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setIsViewModalOpen(false)}>Close</Button>
                <Button onClick={() => handleDownloadPDF(selectedRecord)} className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Download className="h-4 w-4 mr-2" /> Download PDF
                </Button>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* ================= TRUE PDF LAYOUT (OFF-SCREEN PARA SA html2canvas) ================= */}
      {selectedRecord && (
        <div 
          id="pdf-content" 
          className="absolute bg-white text-black p-8 font-sans w-[800px]"
          style={{ top: '-10000px', left: '-10000px' }}
        >
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black uppercase tracking-widest text-slate-900">CLINNOVATE</h1>
            <h2 className="text-lg font-semibold text-slate-600 mt-1">PATIENT HEALTH RECORD</h2>
            <div className="mt-4 border-b-2 border-black w-full"></div>
          </div>

          <div className="flex justify-between items-start mb-8 text-sm">
            <div>
              <p className="mb-2"><span className="font-bold w-28 inline-block">Record ID:</span> HR-{selectedRecord.id.slice(-4).toUpperCase()}</p>
              <p><span className="font-bold w-28 inline-block">Last Checkup:</span> {selectedRecord.lastCheckup ? new Date(selectedRecord.lastCheckup).toLocaleDateString('en-US') : 'N/A'}</p>
            </div>
            <div className="text-right">
              <p className="mb-2"><span className="font-bold text-slate-600">Status:</span> {selectedRecord.conditionStatus}</p>
            </div>
          </div>

          <div className="mb-8 border border-slate-300 p-5 rounded-lg">
            <h3 className="font-bold text-lg mb-4 border-b pb-2">Patient Demographics</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <p><span className="font-bold text-slate-600 block">Full Name:</span> {selectedRecord.patient?.firstName} {selectedRecord.patient?.lastName}</p>
              <p><span className="font-bold text-slate-600 block">Student ID Number:</span> {selectedRecord.patient?.idNumber}</p>
            </div>
          </div>

          <div className="mb-8 border border-slate-300 p-5 rounded-lg">
            <h3 className="font-bold text-lg mb-4 border-b pb-2">Medical Profile</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <p><span className="font-bold text-slate-600 block mb-1">Blood Type:</span> {selectedRecord.bloodType || 'Unknown'}</p>
              <p><span className="font-bold text-slate-600 block mb-1">Known Allergies:</span> {(!selectedRecord.allergies || selectedRecord.allergies.toLowerCase() === 'none') ? "None reported" : selectedRecord.allergies}</p>
            </div>
          </div>

          <div className="mt-32 flex justify-start items-end">
            <div className="text-center w-64">
              <div className="border-t border-black mb-1"></div>
              <p className="font-bold text-sm">School Nurse / Medical Staff</p>
              <p className="text-xs text-slate-500">Verified Signature over Printed Name</p>
            </div>
          </div>

        </div>
      )}
    </>
  );
}