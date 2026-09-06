"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { User, Activity, AlertCircle, Save, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NewVisitPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Student Picker Logic
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  useEffect(() => {
    if (searchQuery.length > 2) {
      const delay = setTimeout(async () => {
        const token = localStorage.getItem("token");
        const res = await fetch(`http://localhost:5000/api/students?search=${searchQuery}&limit=5`, { headers: { "Authorization": `Bearer ${token}` }});
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.students);
        }
      }, 400);
      return () => clearTimeout(delay);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  // Form State
  const [formData, setFormData] = useState({
    visitType: "General Consultation", reason: "", symptoms: "",
    temperature: "", bloodPressure: "", heartRate: "", weight: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return setError("Please search and select a student first.");
    setIsSubmitting(true);
    
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/clinic-visits", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ patientId: selectedStudent.id, ...formData })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      // Auto-redirect to the detailed consultation view
      router.push(`/nurse/clinic-visits/${data.visit.id}`);
    } catch (err: any) {
      setError(err.message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-24">
      <div className="flex items-center gap-4">
        <Button onClick={() => router.back()} variant="outline" size="icon" className="rounded-xl"><ArrowLeft className="h-5 w-5" /></Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Log New Visit</h1>
          <p className="text-slate-500 text-sm">Create a new clinic consultation record.</p>
        </div>
      </div>

      {error && <div className="p-4 bg-rose-50 text-rose-700 flex gap-3 rounded-xl border border-rose-100"><AlertCircle className="h-5 w-5" />{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* STEP 1: SELECT STUDENT */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><User className="h-5 w-5 text-indigo-500" /> 1. Select Student</h3>
          {!selectedStudent ? (
            <div className="relative">
              <input 
                type="text" placeholder="Type name or ID number to search..." 
                value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              {searchResults.length > 0 && (
                <div className="absolute w-full mt-2 bg-white border shadow-xl rounded-xl z-50 max-h-60 overflow-y-auto">
                  {searchResults.map(s => (
                    <div key={s.id} onClick={() => { setSelectedStudent(s); setSearchResults([]); setSearchQuery(""); }}
                         className="p-3 hover:bg-slate-50 cursor-pointer border-b last:border-0">
                      <p className="font-bold">{s.lastName}, {s.firstName}</p>
                      <p className="text-xs text-slate-500">{s.idNumber} - {s.gradeLevel}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex justify-between items-center p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
              <div>
                <p className="font-bold text-indigo-900">{selectedStudent.lastName}, {selectedStudent.firstName}</p>
                <p className="text-sm text-indigo-700">{selectedStudent.idNumber} | {selectedStudent.gradeLevel}</p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => setSelectedStudent(null)}>Change Student</Button>
            </div>
          )}
        </div>

        {/* STEP 2: VISIT DETAILS & VITALS */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Activity className="h-5 w-5 text-rose-500" /> 2. Triage & Vitals</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="text-sm font-bold text-slate-700">Visit Type *</label>
              <select required className="w-full mt-1 p-3 border rounded-xl outline-none bg-white" value={formData.visitType} onChange={e => setFormData({...formData, visitType: e.target.value})}>
                <option>General Consultation</option><option>Minor Injury</option><option>Illness</option><option>First Aid</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-bold text-slate-700">Chief Complaint (Reason) *</label>
              <input required type="text" placeholder="e.g. Headache" className="w-full mt-1 p-3 border rounded-xl outline-none" value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})} />
            </div>
          </div>

          <p className="text-sm font-bold text-slate-700 mb-2 border-t pt-4">Vital Signs (Optional)</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div><label className="text-xs text-slate-500">Temp (°C)</label><input type="number" step="0.1" className="w-full p-2 border rounded-lg outline-none" value={formData.temperature} onChange={e => setFormData({...formData, temperature: e.target.value})} /></div>
            <div><label className="text-xs text-slate-500">BP (mmHg)</label><input type="text" placeholder="120/80" className="w-full p-2 border rounded-lg outline-none" value={formData.bloodPressure} onChange={e => setFormData({...formData, bloodPressure: e.target.value})} /></div>
            <div><label className="text-xs text-slate-500">Heart Rate</label><input type="number" className="w-full p-2 border rounded-lg outline-none" value={formData.heartRate} onChange={e => setFormData({...formData, heartRate: e.target.value})} /></div>
            <div><label className="text-xs text-slate-500">Weight (kg)</label><input type="number" className="w-full p-2 border rounded-lg outline-none" value={formData.weight} onChange={e => setFormData({...formData, weight: e.target.value})} /></div>
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting || !selectedStudent} className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[150px]">
            {isSubmitting ? "Creating..." : <><Save className="h-4 w-4 mr-2" /> Start Consultation</>}
          </Button>
        </div>
      </form>
    </div>
  );
}