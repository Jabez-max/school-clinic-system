"use client";

import React, { useEffect, useState } from "react";
import { Check, X, Clock, UserCog } from "lucide-react";

export default function ProfileRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const token = localStorage.getItem("token");
      // 👇 BINAGO: Pinalitan ang localhost at ginamit ang Environment Variable 👇
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/nurse/profile-requests`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setRequests(data.requests);
      }
    } catch (error) {
      console.error("Failed to fetch requests", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id: string, status: "APPROVED" | "REJECTED") => {
    if (!confirm(`Are you sure you want to ${status.toLowerCase()} this request?`)) return;
    
    setProcessingId(id);
    try {
      const token = localStorage.getItem("token");
      // 👇 BINAGO: Pinalitan ang localhost at ginamit ang Environment Variable 👇
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/nurse/profile-requests/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });

      if (res.ok) {
        // Alisin ang na-process na request sa listahan
        setRequests((prev) => prev.filter((req) => req.id !== id));
        alert(`Request has been ${status.toLowerCase()} successfully.`);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to process request.");
      }
    } catch (error) {
      console.error("Error processing request:", error);
      alert("An error occurred.");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <UserCog className="h-6 w-6 text-blue-600" />
            Student Profile Requests
          </h1>
          <p className="text-slate-500 text-sm mt-1">Review and approve account data corrections submitted by students.</p>
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-slate-500">Loading requests...</div>
        ) : requests.length === 0 ? (
          <div className="p-16 text-center flex flex-col items-center justify-center">
            <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <Check className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-700">All Caught Up!</h3>
            <p className="text-slate-500 text-sm">There are no pending profile update requests.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-semibold">Student Account (Current)</th>
                  <th className="px-6 py-4 font-semibold">Requested Changes</th>
                  <th className="px-6 py-4 font-semibold">Reason</th>
                  <th className="px-6 py-4 font-semibold text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/50 transition">
                    
                    {/* Current Info */}
                    <td className="px-6 py-4 align-top">
                      <div className="font-semibold text-slate-800">{req.user?.firstName} {req.user?.lastName}</div>
                      <div className="text-xs text-slate-500">{req.user?.email}</div>
                      <div className="text-xs text-slate-500 mt-1">ID: {req.user?.schoolId}</div>
                    </td>

                    {/* Requested Changes */}
                    <td className="px-6 py-4 align-top space-y-1">
                      {req.requestedFirstName && <div><span className="text-xs font-semibold text-slate-400">First Name:</span> <span className="text-blue-700 font-medium">{req.requestedFirstName}</span></div>}
                      {req.requestedLastName && <div><span className="text-xs font-semibold text-slate-400">Last Name:</span> <span className="text-blue-700 font-medium">{req.requestedLastName}</span></div>}
                      {req.requestedSchoolId && <div><span className="text-xs font-semibold text-slate-400">School ID:</span> <span className="text-blue-700 font-medium">{req.requestedSchoolId}</span></div>}
                      {req.requestedGradeLevel && <div><span className="text-xs font-semibold text-slate-400">Grade:</span> <span className="text-blue-700 font-medium">{req.requestedGradeLevel}</span></div>}
                      {req.requestedSection && <div><span className="text-xs font-semibold text-slate-400">Section:</span> <span className="text-blue-700 font-medium">{req.requestedSection}</span></div>}
                    </td>

                    {/* Reason & Date */}
                    <td className="px-6 py-4 align-top">
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-slate-600 italic">
                        "{req.reason}"
                      </div>
                      <div className="flex items-center gap-1 mt-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                        <Clock className="h-3 w-3" />
                        {new Date(req.createdAt).toLocaleDateString()}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 align-top text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleAction(req.id, "APPROVED")}
                          disabled={processingId === req.id}
                          className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500 text-white rounded hover:bg-emerald-600 disabled:opacity-50 transition font-medium"
                        >
                          <Check className="h-4 w-4" /> Approve
                        </button>
                        <button
                          onClick={() => handleAction(req.id, "REJECTED")}
                          disabled={processingId === req.id}
                          className="flex items-center gap-1 px-3 py-1.5 bg-rose-50 text-rose-600 rounded hover:bg-rose-100 disabled:opacity-50 transition font-medium"
                        >
                          <X className="h-4 w-4" /> Reject
                        </button>
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}