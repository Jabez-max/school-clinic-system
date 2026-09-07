"use client";

import React, { useState, useEffect } from "react";
import { Search, Plus, Filter, Megaphone, Calendar, Users, Edit, Trash2, MoreVertical, Eye, RadioReceiver, X, Save, CheckCircle2, FileText, Loader2, Archive } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [stats, setStats] = useState({ activeCount: 0, totalViews: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // MODAL & MENU STATES
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // CUSTOM POPUP STATES
  const [popupMessage, setPopupMessage] = useState({ isOpen: false, title: "", message: "", type: "success" });
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, id: "" });

  const [formData, setFormData] = useState({
    title: "",
    targetRole: "All Students & Staff",
    description: "",
    status: "ACTIVE"
  });

  // 1. FETCH ANNOUNCEMENTS MULA BACKEND
  const fetchAnnouncements = async () => {
    try {
      const token = localStorage.getItem("token");
      // 👇 BINAGO: Pinalitan ang localhost at ginamit ang Environment Variable 👇
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/nurse/announcements`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (res.ok) {
        setAnnouncements(data.announcements || []);
        setStats(data.stats || { activeCount: 0, totalViews: 0 });
      }
    } catch (err) {
      console.error("Failed to load announcements", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  // 2. OPEN ADD/EDIT MODAL
  const handleOpenModal = (post: any = null) => {
    if (post) {
      setEditId(post.id);
      setFormData({
        title: post.title,
        targetRole: post.targetRole || "All Students & Staff",
        description: post.description || "",
        status: post.status
      });
    } else {
      setEditId(null);
      setFormData({ title: "", targetRole: "All Students & Staff", description: "", status: "ACTIVE" });
    }
    setIsModalOpen(true);
  };

  // 3. SUBMIT FORM (CREATE OR UPDATE)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // 👇 BINAGO: Pinalitan ang localhost at ginamit ang Environment Variable 👇
    const url = editId 
      ? `${process.env.NEXT_PUBLIC_API_URL}/api/nurse/announcements/${editId}` 
      : `${process.env.NEXT_PUBLIC_API_URL}/api/nurse/announcements`;
    const method = editId ? "PUT" : "POST";

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        await fetchAnnouncements();
        setIsModalOpen(false);
        setPopupMessage({
          isOpen: true,
          title: editId ? "Post Updated!" : "Post Published!",
          message: editId ? "The announcement has been successfully updated." : "Your new announcement is now live and visible to the target audience.",
          type: "success"
        });
      }
    } catch (err) {
      console.error("Error saving announcement", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 4. UPDATE STATUS VIA 3-DOTS
  const handleUpdateStatus = async (id: string, newStatus: string) => {
    setActiveMenuId(null);
    try {
      const token = localStorage.getItem("token");
      // 👇 BINAGO: Pinalitan ang localhost at ginamit ang Environment Variable 👇
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/nurse/announcements/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus })
      });
      fetchAnnouncements();
    } catch (err) {
      console.error("Error updating status", err);
    }
  };

  // 5. DELETE ACTIONS
  const handleDeleteClick = (id: string) => {
    setActiveMenuId(null);
    setDeleteConfirm({ isOpen: true, id });
  };

  const confirmDelete = async () => {
    const id = deleteConfirm.id;
    setDeleteConfirm({ isOpen: false, id: "" });
    try {
      const token = localStorage.getItem("token");
      // 👇 BINAGO: Pinalitan ang localhost at ginamit ang Environment Variable 👇
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/nurse/announcements/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      setAnnouncements(announcements.filter(a => a.id !== id));
      fetchAnnouncements(); // Update stats
    } catch (err) {
      console.error("Error deleting post", err);
    }
  };

  // SEARCH FILTER
  const filteredAnnouncements = announcements.filter(post => {
    const search = searchTerm.toLowerCase();
    return post.title.toLowerCase().includes(search) || (post.targetRole || "").toLowerCase().includes(search);
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-24 relative">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Clinic Announcements</h1>
          <p className="text-slate-500 text-sm mt-1">Broadcast health advisories, schedules, and important notices.</p>
        </div>
        <Button onClick={() => handleOpenModal()} className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 px-4 py-2 rounded-lg transition-colors shadow-sm">
          <Plus className="h-4 w-4" /> Create Post
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <RadioReceiver className="h-6 w-6" />
          </div>
          <div>
            <p className="text-slate-500 text-sm font-medium">Active Announcements</p>
            <p className="text-2xl font-bold text-slate-800">{isLoading ? "..." : stats.activeCount}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
            <Eye className="h-6 w-6" />
          </div>
          <div>
            <p className="text-slate-500 text-sm font-medium">Total Audience Reached</p>
            <p className="text-2xl font-bold text-slate-800">{isLoading ? "..." : stats.totalViews.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search announcements by title or target audience..."
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" className="flex items-center gap-2 text-slate-600 border-slate-200 hover:bg-slate-50 py-2.5">
          <Filter className="h-4 w-4" /> Filter Status
        </Button>
      </div>

      {/* Announcements Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-visible">
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
              <tr>
                <th className="px-6 py-4">Title & Notice Info</th>
                <th className="px-6 py-4">Target Audience</th>
                <th className="px-6 py-4">Date Posted</th>
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
                      Loading announcements...
                    </div>
                  </td>
                </tr>
              ) : filteredAnnouncements.length > 0 ? (
                filteredAnnouncements.map((post) => {
                  const dateObj = new Date(post.createdAt);
                  const displayDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                  const displayId = `ANN-${post.id.slice(-4).toUpperCase()}`;

                  return (
                    <tr key={post.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-800 flex items-center gap-2">
                          <Megaphone className={`h-4 w-4 ${post.status === 'ACTIVE' ? 'text-blue-500' : 'text-slate-400'}`} /> 
                          {post.title}
                        </p>
                        <p className="text-xs text-slate-400 mt-1 ml-6">{displayId} • {post.views.toLocaleString()} Views</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-slate-600">
                          <Users className="h-4 w-4 text-slate-400" />
                          {post.targetRole === 'HEAD_TEACHER' ? 'Head Teachers Only' : post.targetRole}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-slate-600 font-medium">
                          <Calendar className="h-4 w-4 text-slate-400" />
                          {displayDate}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                          post.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                          post.status === 'EXPIRED' ? 'bg-slate-100 text-slate-600' :
                          'bg-orange-100 text-orange-700' // DRAFT
                        }`}>
                          {post.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          
                          <Button onClick={() => handleOpenModal(post)} variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:bg-blue-50" title="Edit Post">
                            <Edit className="h-4 w-4" />
                          </Button>
                          
                          <Button onClick={() => handleDeleteClick(post.id)} variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:bg-red-50" title="Delete Post">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          
                          <div className="relative inline-block">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-slate-400 hover:text-slate-600"
                              onClick={() => setActiveMenuId(activeMenuId === post.id ? null : post.id)}
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>

                            {activeMenuId === post.id && (
                              <div className="absolute right-0 top-10 mt-1 w-40 bg-white border border-slate-200 rounded-lg shadow-xl z-50 overflow-hidden text-left">
                                <div className="px-3 py-2 bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                  Update Status
                                </div>
                                <button onClick={() => handleUpdateStatus(post.id, 'ACTIVE')} className="w-full px-4 py-2.5 text-sm text-slate-700 hover:bg-green-50 hover:text-green-700 flex items-center gap-2 transition-colors">
                                  <CheckCircle2 className="h-4 w-4" /> Active
                                </button>
                                <button onClick={() => handleUpdateStatus(post.id, 'DRAFT')} className="w-full px-4 py-2.5 text-sm text-slate-700 hover:bg-orange-50 hover:text-orange-700 flex items-center gap-2 transition-colors">
                                  <FileText className="h-4 w-4" /> Draft
                                </button>
                                <button onClick={() => handleUpdateStatus(post.id, 'EXPIRED')} className="w-full px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors font-medium">
                                  <Archive className="h-4 w-4" /> Expired
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
                    <p>No announcements found.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= MODAL: CREATE / EDIT ANNOUNCEMENT ================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 max-h-[90vh]">
            
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-blue-50/50">
              <div className="flex items-center gap-2">
                <Megaphone className="h-5 w-5 text-blue-600" />
                <h2 className="text-lg font-bold text-slate-800">{editId ? "Edit Announcement" : "Create Post"}</h2>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors rounded-full p-1 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              <form id="announcementForm" onSubmit={handleSubmit} className="space-y-4">
                
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700">Announcement Title <span className="text-red-500">*</span></label>
                  <input 
                    required 
                    placeholder="e.g. Clinic Closed for Disinfection" 
                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-sm" 
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700">Target Audience <span className="text-red-500">*</span></label>
                    <select 
                      required 
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white"
                      value={formData.targetRole}
                      onChange={(e) => setFormData({...formData, targetRole: e.target.value})}
                    >
                      <option value="All Students & Staff">All Students & Staff</option>
                      <option value="Students Only">Students Only</option>
                      <option value="Teachers & Staff">Teachers & Staff</option>
                      <option value="HEAD_TEACHER">Head Teachers Only</option>
                      <option value="Parents / Guardians">Parents / Guardians</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700">Initial Status</label>
                    <select 
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white"
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value})}
                    >
                      <option value="ACTIVE">Active (Publish Now)</option>
                      <option value="DRAFT">Draft (Save for later)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700">Message / Details</label>
                  <textarea 
                    rows={4}
                    placeholder="Write the full announcement details here..." 
                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-none" 
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                  />
                </div>

              </form>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" form="announcementForm" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white min-w-[140px]">
                {isSubmitting ? "Saving..." : <><Save className="h-4 w-4 mr-2" /> {editId ? "Update Post" : "Publish Post"}</>}
              </Button>
            </div>

          </div>
        </div>
      )}

      {/* ================= CUSTOM SUCCESS POPUP ================= */}
      {popupMessage.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col items-center text-center p-6 animate-in zoom-in-95 duration-200">
            <div className="h-14 w-14 rounded-full flex items-center justify-center mb-4 bg-green-100 text-green-600">
              <CheckCircle2 className="h-7 w-7" />
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
            <h3 className="text-xl font-bold text-slate-800 mb-2">Delete Notice?</h3>
            <p className="text-sm text-slate-500 mb-6">Are you sure you want to permanently delete this announcement? This action cannot be undone.</p>
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