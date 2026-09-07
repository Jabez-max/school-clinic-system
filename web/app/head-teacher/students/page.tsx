"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Users, Search, AlertCircle, RefreshCw, Eye, UserPlus, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function HeadTeacherStudentsDirectory() {
  const [students, setStudents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchStudents = async (query: string = "") => {
    setIsLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No active session found. Please log in.");

      // 👇 BINAGO: Pinalitan ang localhost at ginamit ang Environment Variable 👇
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/head-teacher/students/search?query=${encodeURIComponent(query)}`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to fetch students");
      }
      
      setStudents(json.students);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Debounced Search: Hihintayin muna nitong tumigil sa pag-type ang user (500ms) bago mag-fetch sa API
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchStudents(searchQuery);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  return (
    <div className="space-y-6 pb-12">
      
      {/* HEADER SECTION */}
      <div>
        <Link href="/head-teacher/dashboard" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors mb-4">
          <ChevronLeft className="h-4 w-4 mr-1" /> Back to Dashboard
        </Link>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Users className="h-6 w-6 text-blue-600" /> My Students Directory
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              View and manage all students currently assigned to your section.
            </p>
          </div>
          
          {/* SEARCH BAR */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search by name or ID number..." 
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 border-slate-200 shadow-sm"
            />
          </div>
        </div>
      </div>

      {/* ERROR STATE */}
      {error && (
        <div className="flex flex-col items-center justify-center py-12 bg-white rounded-2xl border border-red-100 shadow-sm">
          <AlertCircle className="h-10 w-10 text-red-500 mb-3" />
          <h2 className="text-lg font-bold text-slate-800">Failed to load directory</h2>
          <p className="text-slate-500 mt-1 mb-4 text-sm text-center max-w-md">{error}</p>
          <Button onClick={() => fetchStudents(searchQuery)} variant="outline" className="text-slate-600">
            <RefreshCw className="h-4 w-4 mr-2" /> Try Again
          </Button>
        </div>
      )}

      {/* MAIN TABLE SECTION */}
      {!error && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Student ID</th>
                  <th className="px-6 py-4">Full Name</th>
                  <th className="px-6 py-4">Grade & Section</th>
                  <th className="px-6 py-4">Gender</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                
                {/* LOADING STATE */}
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-6 py-4"><div className="h-4 bg-slate-200 rounded w-20"></div></td>
                      <td className="px-6 py-4"><div className="h-4 bg-slate-200 rounded w-40"></div></td>
                      <td className="px-6 py-4"><div className="h-4 bg-slate-200 rounded w-24"></div></td>
                      <td className="px-6 py-4"><div className="h-4 bg-slate-200 rounded w-16"></div></td>
                      <td className="px-6 py-4 flex justify-end gap-2">
                        <div className="h-8 bg-slate-200 rounded w-16"></div>
                        <div className="h-8 bg-slate-200 rounded w-20"></div>
                      </td>
                    </tr>
                  ))
                ) : students.length === 0 ? (
                  
                  /* EMPTY STATE */
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <Users className="h-10 w-10 text-slate-300 mb-3" />
                        <p className="text-slate-500 font-medium">No students found</p>
                        <p className="text-slate-400 text-xs mt-1">
                          {searchQuery 
                            ? `No results matching "${searchQuery}" in your assigned section.`
                            : "There are no students assigned to your section yet."}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  
                  /* DATA ROWS */
                  students.map((student: any) => (
                    <tr key={student.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-6 py-4 font-mono text-xs text-slate-500 font-medium">
                        {student.idNumber}
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-800">
                        {student.firstName} {student.lastName}
                      </td>
                      <td className="px-6 py-4 text-slate-600 text-sm">
                        {student.gradeLevel} - {student.section}
                      </td>
                      <td className="px-6 py-4 text-slate-600 text-sm capitalize">
                        {student.gender?.toLowerCase()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end items-center gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          <Link href={`/head-teacher/students/${student.id}`}>
                            <Button variant="ghost" size="sm" className="h-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                              <Eye className="h-4 w-4 mr-1.5" /> View
                            </Button>
                          </Link>
                          <Link href={`/head-teacher/referrals/new?studentId=${student.id}`}>
                            <Button variant="outline" size="sm" className="h-8 text-indigo-600 border-indigo-200 hover:bg-indigo-50">
                              <UserPlus className="h-4 w-4 mr-1.5" /> Refer
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}