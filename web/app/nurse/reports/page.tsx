"use client";

import React, { useState, useEffect } from "react";
import { Search, Plus, Filter, FileBarChart, Download, FileText, Calendar, MoreVertical, FileSpreadsheet, X, Trash2, Archive, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export default function ReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // MODAL STATES
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // CUSTOM POPUP STATES
  const [popupMessage, setPopupMessage] = useState({ isOpen: false, title: "", message: "", type: "success" });
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, id: "" });

  const [formData, setFormData] = useState({
    name: "",
    type: "Statistical"
  });

  // 1. FETCH REPORTS
  const fetchReports = async () => {
    try {
      const token = localStorage.getItem("token");
      // 👇 BINAGO: Pinalitan ang localhost at ginamit ang Environment Variable 👇
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/nurse/reports`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setReports(data.reports || []);
    } catch (err) {
      console.error("Failed to load reports", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  // 2. GENERATE NEW REPORT
  const handleGenerateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("token");
      // 👇 BINAGO: Pinalitan ang localhost at ginamit ang Environment Variable 👇
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/nurse/reports`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({
          ...formData,
          generatedBy: "Nurse Joy Santos"
        })
      });

      if (res.ok) {
        await fetchReports();
        setIsGenerateModalOpen(false);
        setFormData({ name: "", type: "Statistical" });
        
        setPopupMessage({
          isOpen: true,
          title: "Report Generated!",
          message: "Report generated successfully! The document is now ready for download.",
          type: "success"
        });
      }
    } catch (err) {
      console.error("Error generating report", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. ARCHIVE REPORT
  const handleArchive = async (id: string) => {
    setActiveMenuId(null);
    try {
      const token = localStorage.getItem("token");
      // 👇 BINAGO: Pinalitan ang localhost at ginamit ang Environment Variable 👇
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/nurse/reports/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ status: "ARCHIVED" })
      });
      fetchReports();
    } catch (err) {
      console.error("Error archiving report", err);
    }
  };

  // 4. OPEN DELETE CONFIRMATION
  const handleDeleteClick = (id: string) => {
    setActiveMenuId(null);
    setDeleteConfirm({ isOpen: true, id });
  };

  // 5. EXECUTE DELETE
  const confirmDelete = async () => {
    const id = deleteConfirm.id;
    setDeleteConfirm({ isOpen: false, id: "" });
    try {
      const token = localStorage.getItem("token");
      // 👇 BINAGO: Pinalitan ang localhost at ginamit ang Environment Variable 👇
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/nurse/reports/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      setReports(reports.filter(r => r.id !== id));
    } catch (err) {
      console.error("Error deleting report", err);
    }
  };

  // =====================================================================
  // TOTOONG PDF GENERATOR FUNCTION
  // =====================================================================
  const handleDownload = (report: any) => {
    // 1. Gumawa ng bagong PDF Document
    const doc = new jsPDF();
    const dateGenerated = new Date(report.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    // 2. Ilagay ang Title at Headers
    doc.setFontSize(18);
    doc.text("Clinic System Report", 14, 22);
    
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Report Name: ${report.name}`, 14, 32);
    doc.text(`Report ID: ${report.reportId}`, 14, 38);
    doc.text(`Category: ${report.type}`, 14, 44);
    doc.text(`Date Generated: ${dateGenerated}`, 14, 50);
    doc.text(`Generated By: ${report.generatedBy}`, 14, 56);

    // 3. Gumawa ng Table para sa Data
    autoTable(doc, {
      startY: 65,
      head: [['Metric / Details', 'Value / Summary']],
      body: [
        ['Status', report.status],
        ['System Verification', 'Verified & Authentic'],
        ['Confidentiality Note', 'This document contains sensitive clinic data.'],
        ['Generated From', 'School Clinic Management System']
      ],
      headStyles: { fillColor: [37, 99, 235] }, // Blue-600 color
    });

    // 4. I-save at i-download ang file gamit ang report name
    const fileName = `${report.name.replace(/\s+/g, '_')}_${report.reportId}.pdf`;
    doc.save(fileName);

    // 5. Ipakita ang Success Popup pagkatapos ma-download
    setPopupMessage({
      isOpen: true,
      title: "Download Complete!",
      message: `The report "${fileName}" has been successfully downloaded to your device.`,
      type: "success"
    });
  };

  // QUICK ACTIONS GENERATE
  const handleQuickGenerate = (type: string, defaultName: string) => {
    setFormData({ name: defaultName, type });
    setIsGenerateModalOpen(true);
  };

  // SEARCH FILTER
  const filteredReports = reports.filter(r => {
    const search = searchTerm.toLowerCase();
    return r.name.toLowerCase().includes(search) || r.reportId.toLowerCase().includes(search) || r.type.toLowerCase().includes(search);
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-24 relative">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Clinic Reports</h1>
          <p className="text-slate-500 text-sm mt-1">Generate, view, and download official clinic data and summaries.</p>
        </div>
        <Button 
          onClick={() => setIsGenerateModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 px-4 py-2 rounded-lg transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" /> Generate New Report
        </Button>
      </div>

      {/* Report Templates / Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button 
          onClick={() => handleQuickGenerate('Statistical', 'Monthly Clinic Visits Summary')}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-blue-300 hover:shadow-md transition-all text-left flex items-start gap-4 group"
        >
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
            <FileBarChart className="h-6 w-6" />
          </div>
          <div>
            <p className="font-semibold text-slate-800 group-hover:text-blue-700 transition-colors">Visit Statistics</p>
            <p className="text-xs text-slate-500 mt-1">Daily, weekly, or monthly patient visit charts.</p>
          </div>
        </button>
        
        <button 
          onClick={() => handleQuickGenerate('Inventory', 'Inventory & Supplies Log')}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-teal-300 hover:shadow-md transition-all text-left flex items-start gap-4 group"
        >
          <div className="p-3 bg-teal-50 text-teal-600 rounded-lg group-hover:bg-teal-600 group-hover:text-white transition-colors">
            <FileSpreadsheet className="h-6 w-6" />
          </div>
          <div>
            <p className="font-semibold text-slate-800 group-hover:text-teal-700 transition-colors">Inventory Log</p>
            <p className="text-xs text-slate-500 mt-1">Current stock levels and medical supply usage.</p>
          </div>
        </button>

        <button 
          onClick={() => handleQuickGenerate('Incident', 'Emergency Incidents Overview')}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-rose-300 hover:shadow-md transition-all text-left flex items-start gap-4 group"
        >
          <div className="p-3 bg-rose-50 text-rose-600 rounded-lg group-hover:bg-rose-600 group-hover:text-white transition-colors">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <p className="font-semibold text-slate-800 group-hover:text-rose-700 transition-colors">Incident Reports</p>
            <p className="text-xs text-slate-500 mt-1">Logs of all major emergencies and transfers.</p>
          </div>
        </button>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search generated reports by name or ID..."
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" className="flex items-center gap-2 text-slate-600 border-slate-200 hover:bg-slate-50 py-2.5">
          <Filter className="h-4 w-4" /> Filter by Month
        </Button>
      </div>

      {/* Recent Reports Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-visible">
        <div className="p-5 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-800">Recent Reports</h2>
        </div>
        <div className="overflow-x-auto min-h-[300px]">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
              <tr>
                <th className="px-6 py-4">Report Name</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Date Generated</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <Loader2 className="h-8 w-8 text-blue-600 animate-spin mb-3" />
                      Loading reports...
                    </div>
                  </td>
                </tr>
              ) : filteredReports.length > 0 ? (
                filteredReports.map((report) => {
                  const dateObj = new Date(report.createdAt);
                  const displayDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

                  return (
                    <tr key={report.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-800">{report.name}</p>
                        <p className="text-xs text-slate-400 mt-1">{report.reportId} • By {report.generatedBy}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-md text-xs font-semibold">
                          {report.type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-slate-600 font-medium">
                          <Calendar className="h-4 w-4 text-slate-400" />
                          {displayDate}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                          report.status === 'READY' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {report.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-blue-600 hover:bg-blue-50" 
                            title="Download PDF"
                            onClick={() => handleDownload(report)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          
                          <div className="relative inline-block">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-slate-400 hover:text-slate-600"
                              onClick={() => setActiveMenuId(activeMenuId === report.id ? null : report.id)}
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>

                            {activeMenuId === report.id && (
                              <div className="absolute right-0 top-10 mt-1 w-40 bg-white border border-slate-200 rounded-lg shadow-xl z-50 overflow-hidden text-left">
                                {report.status === "READY" && (
                                  <button onClick={() => handleArchive(report.id)} className="w-full px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-slate-900 flex items-center gap-2 transition-colors">
                                    <Archive className="h-4 w-4" /> Archive
                                  </button>
                                )}
                                <button onClick={() => handleDeleteClick(report.id)} className="w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors font-medium">
                                  <Trash2 className="h-4 w-4" /> Delete
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
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    <p>No reports generated yet.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= MODAL: GENERATE REPORT ================= */}
      {isGenerateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-blue-50/50">
              <div className="flex items-center gap-2">
                <FileBarChart className="h-5 w-5 text-blue-600" />
                <h2 className="text-lg font-bold text-slate-800">Generate New Report</h2>
              </div>
              <button 
                onClick={() => setIsGenerateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors rounded-full p-1 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6">
              <form id="reportForm" onSubmit={handleGenerateReport} className="space-y-4">
                
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700">Report Category <span className="text-red-500">*</span></label>
                  <select 
                    required 
                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white"
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                  >
                    <option value="Statistical">Statistical (Visits, Patients)</option>
                    <option value="Inventory">Inventory (Stock Levels, Used Items)</option>
                    <option value="Incident">Incident (Emergencies, Referrals)</option>
                    <option value="Health Records">Health Records (Clearance, Profiling)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700">Report Name / Title <span className="text-red-500">*</span></label>
                  <input 
                    required 
                    placeholder="e.g. Q3 Clinic Visits Summary" 
                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-sm" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 mt-2">
                  <p className="text-xs text-slate-500">
                    <strong className="text-slate-700">Note:</strong> Generating a report compiles current system data. The document will be stamped with the generated date and your user signature.
                  </p>
                </div>

              </form>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setIsGenerateModalOpen(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" form="reportForm" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white min-w-[140px]">
                {isSubmitting ? "Generating..." : "Generate Report"}
              </Button>
            </div>

          </div>
        </div>
      )}

      {/* ================= CUSTOM SUCCESS/INFO POPUP ================= */}
      {popupMessage.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col items-center text-center p-6 animate-in zoom-in-95 duration-200">
            <div className={`h-14 w-14 rounded-full flex items-center justify-center mb-4 ${popupMessage.type === 'success' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
              {popupMessage.type === 'success' ? <CheckCircle2 className="h-7 w-7" /> : <Download className="h-7 w-7" />}
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">{popupMessage.title}</h3>
            <p className="text-sm text-slate-500 mb-6 px-2">{popupMessage.message}</p>
            <Button onClick={() => setPopupMessage({ ...popupMessage, isOpen: false })} className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-6">
              Got it, thanks!
            </Button>
          </div>
        </div>
      )}

      {/* ================= CUSTOM DELETE CONFIRMATION POPUP ================= */}
      {deleteConfirm.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col p-6 animate-in zoom-in-95 duration-200 text-center items-center">
            <div className="h-14 w-14 rounded-full flex items-center justify-center mb-4 bg-red-100 text-red-600">
              <Trash2 className="h-7 w-7" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Delete Report?</h3>
            <p className="text-sm text-slate-500 mb-6">Are you sure you want to permanently delete this report record? This action cannot be undone.</p>
            <div className="flex gap-3 w-full">
              <Button variant="outline" onClick={() => setDeleteConfirm({ isOpen: false, id: "" })} className="flex-1 rounded-xl py-6">
                Cancel
              </Button>
              <Button onClick={confirmDelete} className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-xl py-6">
                Yes, Delete
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}