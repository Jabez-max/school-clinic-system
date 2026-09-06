"use client";

import React, { useState, useEffect } from "react";
import { Search, Plus, Filter, Package, AlertCircle, Edit, Trash2, MoreVertical, Box, X, Save, CheckCircle2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function InventoryPage() {
  const [supplies, setSupplies] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalCategories: 0, lowStockCount: 0, criticalStockCount: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // MODAL & MENU STATES
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // FORM STATES
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    category: "Consumables",
    quantity: "",
    unit: "pieces",
    status: "IN STOCK"
  });

  // 1. FETCH DATA MULA SA DATABASE
  const fetchSupplies = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/nurse/medical-supplies", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setSupplies(data.supplies || []);
        setStats(data.stats || { totalCategories: 0, lowStockCount: 0, criticalStockCount: 0 });
      }
    } catch (err) {
      console.error("Failed to load supplies", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSupplies();
  }, []);

  // 2. OPEN ADD MODAL
  const handleOpenAddModal = () => {
    setFormData({ id: "", name: "", category: "Consumables", quantity: "", unit: "pieces", status: "IN STOCK" });
    setIsAddModalOpen(true);
  };

  // 3. OPEN EDIT MODAL
  const handleOpenEditModal = (item: any) => {
    setFormData({
      id: item.id,
      name: item.name,
      category: item.category,
      quantity: item.quantity.toString(),
      unit: item.unit,
      status: item.status
    });
    setIsEditModalOpen(true);
  };

  // 4. SAVE (ADD & EDIT)
  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const isEditing = !!formData.id;
    const url = isEditing ? `http://localhost:5000/api/nurse/medical-supplies/${formData.id}` : "http://localhost:5000/api/nurse/medical-supplies";
    const method = isEditing ? "PUT" : "POST";

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        await fetchSupplies(); // I-refresh ang table at stats
        setIsAddModalOpen(false);
        setIsEditModalOpen(false);
      } else {
        alert("Failed to save item.");
      }
    } catch (err) {
      console.error("Error saving item", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 5. DELETE ITEM
  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:5000/api/nurse/medical-supplies/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (res.ok) {
        setSupplies(supplies.filter(s => s.id !== id));
        fetchSupplies(); // I-update ang mga bilang sa cards
      }
    } catch (err) {
      console.error("Error deleting item", err);
    }
  };

  // 6. UPDATE STATUS VIA 3-DOTS
  const handleUpdateStatus = async (id: string, newStatus: string) => {
    setActiveMenuId(null);
    setSupplies(prev => prev.map(s => s.id === id ? { ...s, status: newStatus } : s));

    try {
      const token = localStorage.getItem("token");
      await fetch(`http://localhost:5000/api/nurse/medical-supplies/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus })
      });
      fetchSupplies(); // Update stats
    } catch (err) {
      console.error("Error updating status", err);
    }
  };

  // SEARCH FILTER LOGIC
  const filteredSupplies = supplies.filter(s => {
    const search = searchTerm.toLowerCase();
    const idString = `INV-${s.id.slice(-3).toUpperCase()}`.toLowerCase();
    return s.name.toLowerCase().includes(search) || s.category.toLowerCase().includes(search) || idString.includes(search);
  });

  // BADGE COLORS
  const getStatusStyle = (status: string) => {
    const s = (status || "").toUpperCase();
    if (s.includes("IN STOCK")) return "bg-green-100 text-green-700 border border-green-200";
    if (s.includes("LOW STOCK")) return "bg-orange-100 text-orange-700 border border-orange-200";
    if (s.includes("CRITICAL")) return "bg-red-100 text-red-700 font-bold border border-red-200";
    return "bg-slate-100 text-slate-700 border border-slate-200";
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-24 relative">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Medical Inventory</h1>
          <p className="text-slate-500 text-sm mt-1">Manage clinic supplies, first-aid kits, and medical equipment.</p>
        </div>
        <Button 
          onClick={handleOpenAddModal}
          className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 px-4 py-2 rounded-lg transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" /> Add New Item
        </Button>
      </div>

      {/* Quick Stats / Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-teal-50 text-teal-600 rounded-lg">
            <Package className="h-6 w-6" />
          </div>
          <div>
            <p className="text-slate-500 text-sm font-medium">Total Supply Categories</p>
            <p className="text-2xl font-bold text-slate-800">
              {isLoading ? "..." : stats.totalCategories}
            </p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-rose-200 shadow-sm flex items-center gap-4 bg-rose-50/30">
          <div className="p-3 bg-rose-100 text-rose-600 rounded-lg">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-rose-800 text-sm font-medium">Restock Required</p>
            <p className="text-sm text-rose-600 mt-1">
              {isLoading ? "..." : `${stats.criticalStockCount} Critical • ${stats.lowStockCount} Low Stock`}
            </p>
          </div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Item Name or ID..."
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" className="flex items-center gap-2 text-slate-600 border-slate-200 hover:bg-slate-50 py-2.5">
          <Filter className="h-4 w-4" /> Filter Supplies
        </Button>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-visible">
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
              <tr>
                <th className="px-6 py-4">Item Details</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Quantity on Hand</th>
                <th className="px-6 py-4 w-40">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <div className="h-8 w-8 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin mb-3"></div>
                      Loading supplies...
                    </div>
                  </td>
                </tr>
              ) : filteredSupplies.length > 0 ? (
                filteredSupplies.map((item) => {
                  const displayId = `INV-${item.id.slice(-3).toUpperCase()}`;
                  const isLowOrCritical = item.status.includes("LOW") || item.status.includes("CRITICAL");

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-800 flex items-center gap-2">
                          <Box className="h-4 w-4 text-teal-500" /> {item.name}
                        </p>
                        <p className="text-xs text-slate-400 mt-1 ml-6">{displayId}</p>
                      </td>
                      <td className="px-6 py-4 text-slate-600">{item.category}</td>
                      <td className="px-6 py-4">
                        <p className={`font-bold ${isLowOrCritical ? 'text-red-600' : 'text-slate-700'}`}>
                          {item.quantity} <span className="text-xs font-normal text-slate-500">{item.unit}</span>
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        {/* IDINAGDAG ANG whitespace-nowrap AT inline-block DITO PARA HINDI MAHATI SA DALAWANG LINYA */}
                        <span className={`whitespace-nowrap inline-block px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${getStatusStyle(item.status)}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          
                          {/* EDIT ICON */}
                          <Button onClick={() => handleOpenEditModal(item)} variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:bg-blue-50" title="Edit Item">
                            <Edit className="h-4 w-4" />
                          </Button>
                          
                          {/* DELETE ICON */}
                          <Button onClick={() => handleDelete(item.id)} variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:bg-red-50" title="Delete Record">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          
                          {/* 3-DOTS DROPDOWN */}
                          <div className="relative inline-block">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-slate-400 hover:text-slate-600"
                              onClick={() => setActiveMenuId(activeMenuId === item.id ? null : item.id)}
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>

                            {activeMenuId === item.id && (
                              <div className="absolute right-0 top-10 mt-1 w-48 bg-white border border-slate-200 rounded-lg shadow-xl z-50 overflow-hidden text-left">
                                <div className="px-3 py-2 bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                  Update Status
                                </div>
                                <button onClick={() => handleUpdateStatus(item.id, 'IN STOCK')} className="w-full px-4 py-2.5 text-sm text-slate-700 hover:bg-green-50 hover:text-green-700 flex items-center gap-2 transition-colors">
                                  <CheckCircle2 className="h-4 w-4" /> In Stock
                                </button>
                                <button onClick={() => handleUpdateStatus(item.id, 'LOW STOCK')} className="w-full px-4 py-2.5 text-sm text-slate-700 hover:bg-orange-50 hover:text-orange-700 flex items-center gap-2 transition-colors">
                                  <AlertTriangle className="h-4 w-4" /> Low Stock
                                </button>
                                <button onClick={() => handleUpdateStatus(item.id, 'CRITICAL STOCK')} className="w-full px-4 py-2.5 text-sm text-red-700 hover:bg-red-50 flex items-center gap-2 transition-colors font-semibold">
                                  <AlertCircle className="h-4 w-4" /> Critical Stock
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
                    <p>No inventory items found.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= MODAL OVERLAY PARA SA ADD / EDIT ================= */}
      {(isAddModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800">
                {isEditModalOpen ? "Edit Supply Item" : "Add New Supply Item"}
              </h2>
              <button 
                onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }}
                className="text-slate-400 hover:text-slate-600 transition-colors rounded-full p-1 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              <form id="inventoryForm" onSubmit={handleSaveItem} className="space-y-4">
                
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700">Item Name <span className="text-red-500">*</span></label>
                  <input 
                    required 
                    placeholder="e.g. 70% Isopropyl Alcohol" 
                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-sm" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700">Category <span className="text-red-500">*</span></label>
                  <select 
                    required 
                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white"
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                  >
                    <option value="Consumables">Consumables</option>
                    <option value="First Aid">First Aid</option>
                    <option value="Equipment">Equipment</option>
                    <option value="Sanitation">Sanitation</option>
                    <option value="Others">Others</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700">Quantity <span className="text-red-500">*</span></label>
                    <input 
                      type="number"
                      required
                      min="0"
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                      value={formData.quantity}
                      onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700">Unit <span className="text-red-500">*</span></label>
                    <select 
                      required
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white"
                      value={formData.unit}
                      onChange={(e) => setFormData({...formData, unit: e.target.value})}
                    >
                      <option value="pieces">Pieces</option>
                      <option value="gallons">Gallons</option>
                      <option value="units">Units</option>
                      <option value="packs">Packs</option>
                      <option value="boxes">Boxes</option>
                      <option value="rolls">Rolls</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700">Initial Status</label>
                  <select 
                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white"
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                  >
                    <option value="IN STOCK">In Stock</option>
                    <option value="LOW STOCK">Low Stock</option>
                    <option value="CRITICAL STOCK">Critical Stock</option>
                  </select>
                </div>

              </form>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" form="inventoryForm" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white min-w-[120px]">
                {isSubmitting ? "Saving..." : <><Save className="h-4 w-4 mr-2" /> {isEditModalOpen ? "Update Item" : "Save Item"}</>}
              </Button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}