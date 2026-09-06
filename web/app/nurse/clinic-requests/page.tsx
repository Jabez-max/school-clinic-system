"use client";

import React, { useEffect, useState } from "react";
import { FileCheck, Search, PlusCircle, Calendar, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function NurseClinicRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]); // Para sa dropdown selection
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [reason, setReason] = useState("");

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      
      // Kunin ang mga nagawang requests
      const reqRes = await fetch("http://localhost:5000/api/nurse/clinic-requests", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const reqJson = await reqRes.json();
      if (reqRes.ok) setRequests(reqJson.clinicRequests);

      // Kunin ang listahan ng lahat ng students/patients para sa dropdown form
      const patRes = await fetch("http://localhost:5000/api/nurse/patients", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const patJson = await patRes.json();
      if (patRes.ok) setPatients(patJson.patients || patJson);

    } catch (error) {
      console.error("Failed to load data", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleIssueClearance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId || !reason) return alert("Please fill all required fields.");
    
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/nurse/clinic-requests", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          patientId: selectedPatientId,
          reason: reason,
          status: "APPROVED" // Automatic approved kasi Nurse ang gumawa
        })
      });

      if (res.ok) {
        setIsModalOpen(false);
        setSelectedPatientId("");
        setReason("");
        fetchData(); // Refresh table
      } else {
        const errorData = await res.json();
        alert(errorData.error || "Failed to issue clearance");
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* HEADER */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileCheck className="h-6 w-6 text-emerald-600" /> Clearances & Passes
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Issue medical clearances or admit-to-class passes to students.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchData} variant="outline" className="text-slate-600">
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh
          </Button>
          <Button onClick={() => setIsModalOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            <PlusCircle className="h-4 w-4 mr-2" /> Issue Clearance
          </Button>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold text-xs uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4">Student Name</th>
              <th className="px-6 py-4">Grade & Section</th>
              <th className="px-6 py-4">Clearance Reason</th>
              <th className="px-6 py-4">Date Issued</th>
              <th className="px-6 py-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">Loading records...</td></tr>
            ) : requests.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500">No clearances issued yet.</td></tr>
            ) : (
              requests.map((req: any) => (
                <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-semibold text-slate-900">
                    {req.patient?.firstName} {req.patient?.lastName}
                  </td>
                  <td className="px-6 py-4 text-slate-600 text-xs">
                    {req.patient?.gradeLevel} - {req.patient?.section}
                  </td>
                  <td className="px-6 py-4 text-slate-600">{req.reason}</td>
                  <td className="px-6 py-4 text-slate-500 text-xs flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" /> 
                    {new Date(req.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
                      {req.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ISSUE CLEARANCE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="font-bold text-slate-800 flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-emerald-600" /> Issue Medical Clearance
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleIssueClearance} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Select Student</label>
                <select 
                  className="w-full h-10 px-3 rounded-md border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  required
                >
                  <option value="" disabled>-- Choose a student --</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.firstName} {p.lastName} ({p.gradeLevel} - {p.section})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Clearance Details / Reason</label>
                <Input 
                  placeholder="e.g. Cleared to attend class after 3 days of fever"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  required
                />
              </div>

              <div className="pt-4 flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  {isSubmitting ? "Saving..." : "Save & Issue Clearance"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}