"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Search, Plus, Filter, MoreVertical, FileText, AlertCircle, CheckCircle2, Clock, Activity, Archive } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function StudentsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [gradeFilter, setGradeFilter] = useState("");
  const [students, setStudents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // STATE PARA SA 3-DOTS MENU
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // STATE PARA SA SERVER-SIDE PAGINATION
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalStudents, setTotalStudents] = useState(0);
  const itemsPerPage = 10; 

  // FETCH TOTOONG DATA GALING SA BACKEND
  const fetchStudents = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      
      if (!token) {
        throw new Error("No authentication token found. Please login again.");
      }

      // 👇 BINAGO: Pinalitan ang localhost at ginamit ang Environment Variable 👇
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/nurse/students?page=${currentPage}&limit=${itemsPerPage}&search=${searchTerm}&grade=${gradeFilter}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load students");
      
      setStudents(data.students || []);
      setTotalPages(data.totalPages || 1);
      // Fallback in case total isn't returned by backend
      setTotalStudents(data.total || data.students?.length || 0); 
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, itemsPerPage, searchTerm, gradeFilter]);

  // Debounce search effect 
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchStudents();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [fetchStudents]);

  // I-reset ang page sa 1 kapag nag-search o nag-filter ang user
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleGradeFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setGradeFilter(e.target.value);
    setCurrentPage(1);
  };

  // FUNCTION PARA SA STATUS UPDATE
  const handleUpdateStatus = async (studentId: string, newStatus: string) => {
    setActiveMenuId(null); 
    
    // Optimistic Update
    setStudents(prevStudents => 
      prevStudents.map(student => 
        student.id === studentId ? { ...student, clearanceStatus: newStatus } : student
      )
    );

    try {
      const token = localStorage.getItem("token");
      // 👇 BINAGO: Pinalitan ang localhost at ginamit ang Environment Variable 👇
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/nurse/students/${studentId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ clearanceStatus: newStatus })
      });
    } catch (err) {
      console.error("Failed to update status in DB", err);
    }
  };

  // FUNCTION PARA SA ARCHIVE 
  const handleArchive = async (studentId: string, studentName: string) => {
    setActiveMenuId(null);
    if (!confirm(`Are you sure you want to archive ${studentName}? They will be removed from the active list.`)) return;
    
    try {
      const token = localStorage.getItem("token");
      // 👇 BINAGO: Pinalitan ang localhost at ginamit ang Environment Variable 👇
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/nurse/students/${studentId}/archive`, {
        method: "PATCH",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        fetchStudents(); 
      } else {
        const errorData = await res.json();
        alert(errorData.error || "Failed to archive student");
      }
    } catch (err) {
      alert("Failed to archive student");
    }
  };

  // Pagination display math
  const indexOfFirstItem = (currentPage - 1) * itemsPerPage;
  const currentEnd = Math.min(currentPage * itemsPerPage, totalStudents);

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-24">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Students Directory</h1>
          <p className="text-slate-500 text-sm mt-1">Manage and view student medical records and clinic clearances.</p>
        </div>
        <Link href="/nurse/students/new">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 px-4 py-2 rounded-lg transition-colors shadow-sm">
            <Plus className="h-4 w-4" /> Add Student Record
          </Button>
        </Link>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by ID or Name..."
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all"
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>
        <select 
          value={gradeFilter}
          onChange={handleGradeFilterChange}
          className="px-4 py-2.5 rounded-lg border border-slate-200 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Grades</option>
          <option value="Grade 7">Grade 7</option>
          <option value="Grade 8">Grade 8</option>
          <option value="Grade 9">Grade 9</option>
          <option value="Grade 10">Grade 10</option>
          <option value="Grade 11">Grade 11</option>
          <option value="Grade 12">Grade 12</option>
        </select>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 text-sm rounded-lg flex items-start gap-3 border border-red-100">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Data Table Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-visible">
        <div className="overflow-x-auto min-h-[350px]">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
              <tr>
                <th className="px-6 py-4">Student ID</th>
                <th className="px-6 py-4">Full Name</th>
                <th className="px-6 py-4">Grade & Section</th>
                <th className="px-6 py-4">Clearance Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <div className="h-8 w-8 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin mb-3"></div>
                      Fetching student records...
                    </div>
                  </td>
                </tr>
              ) : students.length > 0 ? (
                students.map((student) => {
                  const status = student.clearanceStatus || 'CLEARED';

                  return (
                    <tr key={student.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-6 py-4 font-semibold text-slate-800">{student.idNumber}</td>
                      <td className="px-6 py-4 text-slate-600">{student.lastName}, {student.firstName}</td>
                      <td className="px-6 py-4 text-slate-500">{student.gradeLevel || '-'} {student.section || ''}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                          status.toUpperCase() === 'CLEARED' ? 'bg-green-100 text-green-700' : 
                          status.toUpperCase() === 'PENDING CLEARANCE' ? 'bg-orange-100 text-orange-700' : 
                          'bg-red-100 text-red-700'
                        }`}>
                          {status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* VIEW PROFILE BUTTON */}
                          <Link href={`/nurse/students/${student.id}`}>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:bg-blue-50" title="View Medical Record">
                              <FileText className="h-4 w-4" />
                            </Button>
                          </Link>
                          
                          {/* 3-DOTS DROPDOWN MENU */}
                          <div className="relative">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-slate-400 hover:text-slate-600" 
                              onClick={() => setActiveMenuId(activeMenuId === student.id ? null : student.id)}
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>

                            {/* Popup Menu */}
                            {activeMenuId === student.id && (
                              <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-xl z-50 overflow-hidden text-left">
                                <div className="px-3 py-2 bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                  Change Status
                                </div>
                                <button onClick={() => handleUpdateStatus(student.id, 'CLEARED')} className="w-full px-4 py-2.5 text-sm text-slate-700 hover:bg-green-50 hover:text-green-700 flex items-center gap-2 transition-colors">
                                  <CheckCircle2 className="h-4 w-4" /> Set as Cleared
                                </button>
                                <button onClick={() => handleUpdateStatus(student.id, 'PENDING CLEARANCE')} className="w-full px-4 py-2.5 text-sm text-slate-700 hover:bg-orange-50 hover:text-orange-700 flex items-center gap-2 transition-colors">
                                  <Clock className="h-4 w-4" /> Set as Pending
                                </button>
                                <button onClick={() => handleUpdateStatus(student.id, 'MEDICAL LEAVE')} className="w-full px-4 py-2.5 text-sm text-slate-700 hover:bg-red-50 hover:text-red-700 flex items-center gap-2 transition-colors border-b border-slate-100">
                                  <Activity className="h-4 w-4" /> Medical Leave
                                </button>
                                
                                {/* ARCHIVE ACTION */}
                                <button onClick={() => handleArchive(student.id, student.firstName)} className="w-full px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 hover:text-rose-700 flex items-center gap-2 transition-colors">
                                  <Archive className="h-4 w-4" /> Archive Student
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
                    <p>No student records found.</p>
                  </td>
                </tr>
              )}

            </tbody>
          </table>
        </div>
        
        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-100 text-xs text-slate-500 flex justify-between items-center bg-slate-50/50">
          <span>
            {totalStudents > 0 ? (
              <>Showing <b>{indexOfFirstItem + 1}</b> to <b>{currentEnd}</b> of <b>{totalStudents}</b> students</>
            ) : (
              "Showing 0 students"
            )}
          </span>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 px-3 text-xs border-slate-200" 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            >
              Previous
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 px-3 text-xs border-slate-200" 
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            >
              Next
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}