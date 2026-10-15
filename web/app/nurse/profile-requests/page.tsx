"use client";

import React, { useEffect, useState } from "react";
import { Check, X, Clock, UserCog, Info, AlertTriangle } from "lucide-react";

export default function ProfileRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // States para sa Toast Notification
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: "success" | "error" }>({
    visible: false,
    message: "",
    type: "success"
  });

  // 👇 MGA STATES PARA SA CUSTOM CONFIRMATION MODAL 👇
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    requestId: string | null;
    actionType: "APPROVED" | "REJECTED" | null;
  }>({
    isOpen: false,
    requestId: null,
    actionType: null
  });

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const token = localStorage.getItem("token");
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

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ visible: true, message, type });
    setTimeout(() => {
      setToast(prev => ({ ...prev, visible: false }));
    }, 3000);
  };

  // 👇 FUNCTION PARA BUKSAN ANG MODAL IMBES NA BROWSER CONFIRM() 👇
  const openConfirmModal = (id: string, type: "APPROVED" | "REJECTED") => {
    setConfirmModal({
      isOpen: true,
      requestId: id,
      actionType: type
    });
  };

  const closeConfirmModal = () => {
    setConfirmModal({ isOpen: false, requestId: null, actionType: null });
  };

  // 👇 ITO NA YUNG GAGAWA NG ACTION KAPAG PININDOT ANG "YES" SA MODAL 👇
  const executeAction = async () => {
    const { requestId, actionType } = confirmModal;
    if (!requestId || !actionType) return;
    
    closeConfirmModal(); // Isara agad ang modal
    setProcessingId(requestId); // I-set ang loading state ng button
    
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/nurse/profile-requests/${requestId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: actionType })
      });

      if (res.ok) {
        setRequests((prev) => prev.filter((req) => req.id !== requestId));
        showToast(`Request has been ${actionType.toLowerCase()} successfully.`);
      } else {
        const data = await res.json();
        showToast(data.error || "Failed to process request.", "error");
      }
    } catch (error) {
      console.error("Error processing request:", error);
      showToast("An error occurred while processing.", "error");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 relative text-slate-900">
      
      {/* Toast Notification */}
      {toast.visible && (
        <div className={`fixed top-5 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-2 px-5 py-3 rounded-lg shadow-xl text-sm font-bold text-white transition-all animate-in slide-in-from-top-5 duration-300 ${toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`}>
          {toast.type === 'success' ? <Check className="h-5 w-5" /> : <Info className="h-5 w-5" />}
          {toast.message}
        </div>
      )}

      {/* 👇 CUSTOM CONFIRMATION MODAL 👇 */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden text-center p-6 animate-in zoom-in-95 duration-200 border border-slate-200">
            <div className={`mx-auto w-12 h-12 flex items-center justify-center rounded-full mb-4 ${confirmModal.actionType === 'APPROVED' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
              {confirmModal.actionType === 'APPROVED' ? <Check className="h-6 w-6" /> : <AlertTriangle className="h-6 w-6" />}
            </div>
            
            <h3 className="text-lg font-bold text-slate-800 mb-2">
              Confirm {confirmModal.actionType === 'APPROVED' ? 'Approval' : 'Rejection'}
            </h3>
            <p className="text-sm text-slate-500 mb-6">
              Are you sure you want to {confirmModal.actionType?.toLowerCase()} this profile update request? This action cannot be undone.
            </p>
            
            <div className="flex gap-3">
              <button 
                onClick={closeConfirmModal}
                className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-colors border border-slate-200"
              >
                Cancel
              </button>
              <button 
                onClick={executeAction}
                className={`flex-1 px-4 py-2 text-white font-bold rounded-lg transition-colors shadow-sm ${confirmModal.actionType === 'APPROVED' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}`}
              >
                Yes, {confirmModal.actionType === 'APPROVED' ? 'Approve' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

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
                          // 👇 BINAGO: Tinatawag na ang openConfirmModal imbes na direktang handleAction 👇
                          onClick={() => openConfirmModal(req.id, "APPROVED")}
                          disabled={processingId === req.id}
                          className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500 text-white rounded hover:bg-emerald-600 disabled:opacity-50 transition font-medium"
                        >
                          <Check className="h-4 w-4" /> Approve
                        </button>
                        <button
                          // 👇 BINAGO: Tinatawag na ang openConfirmModal imbes na direktang handleAction 👇
                          onClick={() => openConfirmModal(req.id, "REJECTED")}
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