"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { User, Activity, FileText, CheckCircle2, AlertCircle, Save, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ClinicVisitDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [visit, setVisit] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Custom Error/Success Modal State
  const [modal, setModal] = useState({ isOpen: false, type: "error", message: "" });

  // 👈 PINAGSAMA NA ANG CLINICAL NOTES AT VITALS SA ISANG STATE
  const [formData, setFormData] = useState({ 
    diagnosis: "", 
    treatment: "", 
    medicineUsed: "", 
    disposition: "", 
    privateNotes: "",
    temperature: "",
    bloodPressure: "",
    heartRate: "",
    weight: ""
  });

  const fetchVisit = async () => {
    try {
      const token = localStorage.getItem("token");
      // 👇 BINAGO: Pinalitan ang localhost at ginamit ang Environment Variable 👇
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clinic-visits/${params.id}`, { headers: { "Authorization": `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setVisit(data.visit);
      
      // I-populate ang form data mula sa database
      setFormData({
        diagnosis: data.visit.diagnosis || "", 
        treatment: data.visit.treatment || "",
        medicineUsed: data.visit.medicineUsed || "", 
        disposition: data.visit.disposition || "",
        privateNotes: data.visit.privateNotes || "",
        temperature: data.visit.temperature || "",
        bloodPressure: data.visit.bloodPressure || "",
        heartRate: data.visit.heartRate || "",
        weight: data.visit.weight || ""
      });
    } catch (err: any) { 
      setModal({ isOpen: true, type: "error", message: err.message }); 
    } finally { 
      setIsLoading(false); 
    }
  };

  useEffect(() => { fetchVisit(); }, [params.id]);

  // 👈 ISAHANG PAG-SAVE NG VITALS AT CLINICAL NOTES
  const handleUpdateClinicalAndVitals = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true); 
    setModal({ isOpen: false, type: "error", message: "" });
    try {
      const token = localStorage.getItem("token");

      // I-format ang numbers para tanggapin ng Prisma nang walang error
      const payload = {
        ...formData,
        temperature: formData.temperature ? parseFloat(formData.temperature.toString()) : null,
        heartRate: formData.heartRate ? parseInt(formData.heartRate.toString()) : null,
        weight: formData.weight ? parseFloat(formData.weight.toString()) : null,
      };

      // 👇 BINAGO: Pinalitan ang localhost at ginamit ang Environment Variable 👇
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clinic-visits/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) throw new Error((await res.json()).error);
      
      setModal({ isOpen: true, type: "success", message: "Consultation record and vitals updated successfully!" });
      fetchVisit();
    } catch (err: any) { 
      setModal({ isOpen: true, type: "error", message: err.message }); 
    } finally { 
      setIsSaving(false); 
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    try {
      const token = localStorage.getItem("token");
      // 👇 BINAGO: Pinalitan ang localhost at ginamit ang Environment Variable 👇
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clinic-visits/${params.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      fetchVisit();
    } catch (err: any) { 
      setModal({ isOpen: true, type: "error", message: err.message }); 
    }
  };

  if (isLoading) return <div className="text-center py-20"><Activity className="animate-spin h-8 w-8 mx-auto text-indigo-500" /></div>;
  if (!visit) return <div className="text-center py-20 text-rose-500">Record not found</div>;

  const isReadOnly = visit.status === 'COMPLETED';

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-24 relative">
      <div className="flex items-center gap-4">
        <Button onClick={() => router.back()} variant="outline" size="icon" className="rounded-xl"><ArrowLeft className="h-5 w-5" /></Button>
        <div className="flex-grow">
          <h1 className="text-2xl font-bold text-slate-800">Consultation Details</h1>
          <p className="text-slate-500 text-sm">Ref ID: {visit.id}</p>
        </div>
        
        {/* STATUS ACTIONS */}
        <div className="flex gap-2">
          {visit.status !== 'COMPLETED' && (
            <Button onClick={() => handleStatusUpdate('IN_CONSULTATION')} variant={visit.status === 'IN_CONSULTATION' ? 'default' : 'outline'} className={visit.status === 'IN_CONSULTATION' ? 'bg-blue-600' : ''}>
              In Consultation
            </Button>
          )}
          {visit.status !== 'COMPLETED' ? (
            <Button onClick={() => handleStatusUpdate('COMPLETED')} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <CheckCircle2 className="h-4 w-4 mr-2" /> Complete Visit
            </Button>
          ) : (
            <div className="px-4 py-2 bg-emerald-100 text-emerald-700 font-bold rounded-lg flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" /> THIS VISIT IS COMPLETED
            </div>
          )}
        </div>
      </div>

      {/* 👈 ISANG BUONG FORM NA SUMASAKOP SA VITALS AT CLINICAL NOTES */}
      <form onSubmit={handleUpdateClinicalAndVitals} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: INFO & VITALS */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><User className="h-5 w-5 text-indigo-500" /> Patient Info</h3>
            <p className="font-bold text-lg">{visit.patient.lastName}, {visit.patient.firstName}</p>
            <p className="text-sm text-slate-500">{visit.patient.idNumber} | {visit.patient.gradeLevel}</p>
            
            <div className="mt-4 pt-4 border-t space-y-2 text-sm">
              <p><span className="text-slate-500">Date:</span> {new Date(visit.visitDate).toLocaleDateString()}</p>
              <p><span className="text-slate-500">Type:</span> <span className="font-bold">{visit.visitType}</span></p>
              <p><span className="text-slate-500">Reason:</span> {visit.reason}</p>
            </div>
          </div>

          {/* 👈 EDITABLE VITALS */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Activity className="h-5 w-5 text-rose-500" /> Recorded Vitals</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Temp (°C)</label>
                <input disabled={isReadOnly} type="number" step="0.1" value={formData.temperature} onChange={e=>setFormData({...formData, temperature: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">BP (mmHg)</label>
                <input disabled={isReadOnly} type="text" value={formData.bloodPressure} onChange={e=>setFormData({...formData, bloodPressure: e.target.value})} placeholder="120/80" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">HR (bpm)</label>
                <input disabled={isReadOnly} type="number" value={formData.heartRate} onChange={e=>setFormData({...formData, heartRate: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Weight (kg)</label>
                <input disabled={isReadOnly} type="number" step="0.1" value={formData.weight} onChange={e=>setFormData({...formData, weight: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all" />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: CLINICAL NOTES */}
        <div className="lg:col-span-2">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-full flex flex-col">
            <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2 border-b pb-4"><FileText className="h-5 w-5 text-indigo-500" /> Clinical Assessment</h3>
            
            <div className="space-y-4 flex-grow">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-bold text-slate-700">Diagnosis / Assessment *</label>
                  <textarea disabled={isReadOnly} required value={formData.diagnosis} onChange={e=>setFormData({...formData, diagnosis: e.target.value})} className="w-full mt-1 p-3 border rounded-xl outline-none min-h-[100px] resize-none focus:ring-2 focus:ring-indigo-500" placeholder="Clinical findings..." />
                </div>
                <div>
                  <label className="text-sm font-bold text-slate-700">Treatment Applied</label>
                  <textarea disabled={isReadOnly} value={formData.treatment} onChange={e=>setFormData({...formData, treatment: e.target.value})} className="w-full mt-1 p-3 border rounded-xl outline-none min-h-[100px] resize-none focus:ring-2 focus:ring-indigo-500" placeholder="What was done in the clinic?" />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-bold text-slate-700">Medicine Administered</label>
                  <input disabled={isReadOnly} type="text" value={formData.medicineUsed} onChange={e=>setFormData({...formData, medicineUsed: e.target.value})} className="w-full mt-1 p-3 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. Paracetamol" />
                </div>
                <div>
                  <label className="text-sm font-bold text-slate-700">Disposition *</label>
                  <select disabled={isReadOnly} required value={formData.disposition} onChange={e=>setFormData({...formData, disposition: e.target.value})} className="w-full mt-1 p-3 border rounded-xl outline-none bg-white focus:ring-2 focus:ring-indigo-500">
                    <option value="">Select Disposition</option>
                    <option>Returned to Class</option><option>Rest / Observation</option>
                    <option>Sent Home</option><option>Referred</option><option>Emergency</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm font-bold text-slate-700">Private Nurse Notes (Not visible to Students/Teachers)</label>
                <textarea disabled={isReadOnly} value={formData.privateNotes} onChange={e=>setFormData({...formData, privateNotes: e.target.value})} className="w-full mt-1 p-3 border rounded-xl outline-none min-h-[80px] resize-none bg-amber-50 focus:bg-white focus:ring-2 focus:ring-indigo-500" placeholder="Internal remarks..." />
              </div>
            </div>

            {!isReadOnly && (
              <div className="flex justify-end pt-6 mt-6 border-t">
                <Button type="submit" disabled={isSaving} className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[160px]">
                  {isSaving ? "Saving..." : <><Save className="h-4 w-4 mr-2" /> Save Changes</>}
                </Button>
              </div>
            )}
          </div>
        </div>
      </form>

      {/* ================= CUSTOM SUCCESS/ERROR POPUP ================= */}
      {modal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in zoom-in-95 duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col">
            <div className="p-6 text-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${modal.type === 'error' ? 'bg-rose-100' : 'bg-emerald-100'}`}>
                {modal.type === 'error' ? (
                  <AlertCircle className="h-8 w-8 text-rose-600" />
                ) : (
                  <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                )}
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">
                {modal.type === 'error' ? 'Action Required' : 'Success'}
              </h3>
              <p className="text-sm text-slate-600">{modal.message}</p>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-center">
              <Button 
                onClick={() => setModal({ isOpen: false, type: "error", message: "" })} 
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