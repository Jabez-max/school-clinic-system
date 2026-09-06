"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Save, AlertCircle, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NewStudentPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Form State na tugma sa Prisma Schema mo
  const [formData, setFormData] = useState({
    idNumber: "",
    firstName: "",
    lastName: "",
    gender: "Male",
    dateOfBirth: "",
    contactNo: "",
    gradeLevel: "", // Halimbawa: "3rd Year"
    section: "",    // Halimbawa: "BSIT-MWA"
    clearanceStatus: "CLEARED"
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/nurse/students", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add student.");

      // Kapag success, ibalik sa Students Directory!
      router.push("/nurse/students");
    } catch (err: any) {
      setError(err.message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-300 pb-12">
      {/* Header */}
      <div>
        <button onClick={() => router.back()} className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors mb-4">
          <ChevronLeft className="h-4 w-4 mr-1" /> Back to Directory
        </button>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <UserPlus className="h-6 w-6 text-blue-600" /> Add New Student
        </h1>
        <p className="text-sm text-slate-500 mt-1">Create a new medical record profile for a student.</p>
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
          
          {error && (
            <div className="p-4 bg-red-50 text-red-700 text-sm rounded-lg flex items-start gap-3 border border-red-100">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Personal Information */}
            <div className="space-y-4 md:col-span-2">
              <h3 className="text-sm font-bold text-slate-800 border-b pb-2 uppercase tracking-wider">Personal Information</h3>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Student ID Number <span className="text-red-500">*</span></label>
              <input required type="text" name="idNumber" value={formData.idNumber} onChange={handleChange} placeholder="" className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Clearance Status</label>
              <select name="clearanceStatus" value={formData.clearanceStatus} onChange={handleChange} className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white">
                <option value="CLEARED">Cleared</option>
                <option value="PENDING CLEARANCE">Pending Clearance</option>
                <option value="MEDICAL LEAVE">Medical Leave</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">First Name <span className="text-red-500">*</span></label>
              <input required type="text" name="firstName" value={formData.firstName} onChange={handleChange} className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Last Name <span className="text-red-500">*</span></label>
              <input required type="text" name="lastName" value={formData.lastName} onChange={handleChange} className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Gender <span className="text-red-500">*</span></label>
              <select required name="gender" value={formData.gender} onChange={handleChange} className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white">
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Date of Birth <span className="text-red-500">*</span></label>
              <input required type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Contact Number</label>
              <input type="text" name="contactNo" value={formData.contactNo} onChange={handleChange} placeholder="e.g. 09123456789" className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
            </div>

            {/* Academic Information */}
            <div className="space-y-4 md:col-span-2 mt-4">
              <h3 className="text-sm font-bold text-slate-800 border-b pb-2 uppercase tracking-wider">Academic Information</h3>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Course / Grade Level</label>
              <input type="text" name="gradeLevel" value={formData.gradeLevel} onChange={handleChange} placeholder="" className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Section</label>
              <input type="text" name="section" value={formData.section} onChange={handleChange} placeholder="" className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
            </div>
          </div>

          <div className="pt-6 flex justify-end gap-3 border-t">
            <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white min-w-[140px]">
              {isSubmitting ? "Saving..." : <><Save className="h-4 w-4 mr-2" /> Save Record</>}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}