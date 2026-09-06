"use client";

import { useState, useEffect } from "react";

interface ProfileUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  // 👇 IDINAGDAG: Para ma-pre-fill natin ang form gamit ang current info nila
  currentProfile?: {
    firstName?: string;
    lastName?: string;
    schoolId?: string;
    gradeLevel?: string;
    section?: string;
  };
}

export default function ProfileUpdateModal({ isOpen, onClose, currentProfile }: ProfileUpdateModalProps) {
  const [formData, setFormData] = useState({
    requestedFirstName: "",
    requestedLastName: "",
    requestedSchoolId: "",
    requestedGradeLevel: "",
    requestedSection: "",
    reason: ""
  });
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  // 👇 IDINAGDAG: Awtomatikong ilalagay ang current data nila kapag bumukas ang modal
  useEffect(() => {
    if (isOpen) {
      setFormData({
        requestedFirstName: currentProfile?.firstName || "",
        requestedLastName: currentProfile?.lastName || "",
        requestedSchoolId: currentProfile?.schoolId || "",
        requestedGradeLevel: currentProfile?.gradeLevel || "",
        requestedSection: currentProfile?.section || "",
        reason: "" // Laging blangko ang reason sa simula
      });
      setMessage(null);
    }
  }, [isOpen, currentProfile]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/student/profile-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to submit request.");
      }

      setMessage({ type: "success", text: "Request submitted! Please wait for the clinic to approve it." });
      
      // I-clear ang form at isara ang modal pagkatapos ng 2.5 segundo
      setTimeout(() => {
        onClose();
        setMessage(null);
      }, 2500);

    } catch (error: any) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    // 👇 DITO YUNG FIX: Ginawang z-[9999], bg-black/60, at nilagyan ng backdrop-blur-sm 👇
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-800">Request Profile Update</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold text-xl transition-colors">&times;</button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {message && (
            <div className={`p-3 rounded-lg text-sm font-medium ${message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
              {message.text}
            </div>
          )}

          <p className="text-sm text-slate-500 mb-4">
            Punan lamang ang mga impormasyon na nais mong ipabago. Iwanang blangko ang mga tama na.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">First Name</label>
              <input 
                type="text" 
                value={formData.requestedFirstName} 
                onChange={(e) => setFormData({...formData, requestedFirstName: e.target.value})}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all" 
                placeholder="New First Name" 
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Last Name</label>
              <input 
                type="text" 
                value={formData.requestedLastName} 
                onChange={(e) => setFormData({...formData, requestedLastName: e.target.value})}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all" 
                placeholder="New Last Name" 
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">School ID Number</label>
            <input 
              type="text" 
              value={formData.requestedSchoolId} 
              onChange={(e) => setFormData({...formData, requestedSchoolId: e.target.value})}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all" 
              placeholder="e.g., 2026-01234" 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Grade Level</label>
              <input 
                type="text" 
                value={formData.requestedGradeLevel} 
                onChange={(e) => setFormData({...formData, requestedGradeLevel: e.target.value})}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all" 
                placeholder="e.g., Grade 12" 
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Section</label>
              <input 
                type="text" 
                value={formData.requestedSection} 
                onChange={(e) => setFormData({...formData, requestedSection: e.target.value})}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all" 
                placeholder="e.g., STEM-A" 
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Reason for Update <span className="text-red-500">*</span></label>
            <textarea 
              required
              value={formData.reason} 
              onChange={(e) => setFormData({...formData, reason: e.target.value})}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all resize-none" 
              placeholder="Bakit mo gustong palitan ang profile mo? (e.g., Mali po ang nakuha ng Google)" 
              rows={3}
            ></textarea>
          </div>

          {/* Modal Footer */}
          <div className="pt-4 flex justify-end gap-3">
            <button 
              type="button" 
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-70 flex items-center gap-2"
            >
              {loading ? "Submitting..." : "Submit Request"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}