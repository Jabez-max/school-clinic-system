"use client";

import React, { useState, useEffect } from "react";
import { User, Lock, Bell, Save, Shield, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // CUSTOM POPUP STATE
  const [popupMessage, setPopupMessage] = useState({ isOpen: false, title: "", message: "" });

  // STATE PARA SA PROFILE
  const [profile, setProfile] = useState({
    id: "",
    firstName: "",
    lastName: "",
    email: "",
    schoolId: "" // Gagamitin natin as PRC/ID number
  });

  // STATE PARA SA PASSWORD
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  // STATE PARA SA NOTIFICATIONS
  const [notifications, setNotifications] = useState({
    emergencyAlerts: true,
    lowStock: true,
    dailySummary: false
  });

  // 1. FETCH USER PROFILE MULA SA BACKEND
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        // 👇 BINAGO: Pinalitan ang localhost at ginamit ang Environment Variable 👇
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/nurse/profile`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await res.json();
        
        if (res.ok && data.profile) {
          setProfile({
            id: data.profile.id,
            firstName: data.profile.firstName || "",
            lastName: data.profile.lastName || "",
            email: data.profile.email || "",
            schoolId: data.profile.schoolId || "PRC-PENDING"
          });
        }
      } catch (err) {
        console.error("Failed to load profile", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // 2. MAIN SAVE HANDLER (Nagse-save sa database!)
  const handleSaveChanges = async () => {
    setIsSaving(true);
    const token = localStorage.getItem("token");

    try {
      if (activeTab === "profile") {
        // SAVE PROFILE API
        // 👇 BINAGO: Pinalitan ang localhost at ginamit ang Environment Variable 👇
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/nurse/profile`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
          body: JSON.stringify(profile)
        });

        if (res.ok) {
          setPopupMessage({ isOpen: true, title: "Profile Updated!", message: "Your personal information has been successfully saved to the database." });
        }
      } 
      
      else if (activeTab === "security") {
        // SAVE PASSWORD API
        if (passwords.newPassword !== passwords.confirmPassword) {
          alert("New passwords do not match!");
          setIsSaving(false);
          return;
        }

        // 👇 BINAGO: Pinalitan ang localhost at ginamit ang Environment Variable 👇
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/nurse/change-password`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
          body: JSON.stringify({ id: profile.id, newPassword: passwords.newPassword })
        });

        if (res.ok) {
          setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
          setPopupMessage({ isOpen: true, title: "Password Changed!", message: "Your account password has been successfully updated for better security." });
        }
      }

      else if (activeTab === "notifications") {
        // SAVE NOTIFICATIONS (Simulated muna for UI response)
        setTimeout(() => {
          setPopupMessage({ isOpen: true, title: "Preferences Saved!", message: "Your notification settings have been successfully updated." });
        }, 500);
      }

    } catch (err) {
      console.error("Error saving changes:", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl animate-in fade-in duration-300 relative">
      {/* Header Section */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Account Settings</h1>
        <p className="text-slate-500 text-sm mt-1">Manage your personal profile, security preferences, and system alerts.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Settings Navigation Sidebar */}
        <div className="w-full md:w-64 space-y-1">
          <button 
            onClick={() => setActiveTab("profile")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "profile" ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <User className={`h-4 w-4 ${activeTab === "profile" ? "text-blue-600" : "text-slate-400"}`} />
            Personal Profile
          </button>
          
          <button 
            onClick={() => setActiveTab("security")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "security" ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <Lock className={`h-4 w-4 ${activeTab === "security" ? "text-blue-600" : "text-slate-400"}`} />
            Password & Security
          </button>

          <button 
            onClick={() => setActiveTab("notifications")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "notifications" ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <Bell className={`h-4 w-4 ${activeTab === "notifications" ? "text-blue-600" : "text-slate-400"}`} />
            Notifications
          </button>
        </div>

        {/* Settings Content Area */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200">
          
          {isLoading ? (
            <div className="p-12 flex flex-col items-center justify-center text-slate-400">
              <Loader2 className="h-8 w-8 animate-spin mb-4 text-blue-600" />
              Loading your settings...
            </div>
          ) : (
            <>
              {/* PROFILE TAB */}
              {activeTab === "profile" && (
                <div className="p-6 animate-in fade-in duration-200">
                  <h2 className="text-lg font-bold text-slate-800 mb-4">Personal Information</h2>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700">First Name</label>
                        <input 
                          type="text" 
                          value={profile.firstName} 
                          onChange={(e) => setProfile({...profile, firstName: e.target.value})}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" 
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700">Last Name</label>
                        <input 
                          type="text" 
                          value={profile.lastName} 
                          onChange={(e) => setProfile({...profile, lastName: e.target.value})}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" 
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700">Email Address</label>
                      <input 
                        type="email" 
                        value={profile.email} 
                        onChange={(e) => setProfile({...profile, email: e.target.value})}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" 
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700">PRC License / Staff ID</label>
                      <input 
                        type="text" 
                        value={profile.schoolId} 
                        disabled 
                        className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-500 text-sm cursor-not-allowed" 
                      />
                      <p className="text-xs text-slate-400">Contact the system administrator to change your ID/License number.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* SECURITY TAB */}
              {activeTab === "security" && (
                <div className="p-6 animate-in fade-in duration-200">
                  <h2 className="text-lg font-bold text-slate-800 mb-4">Update Password</h2>
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700">Current Password</label>
                      <input 
                        type="password" 
                        value={passwords.currentPassword}
                        onChange={(e) => setPasswords({...passwords, currentPassword: e.target.value})}
                        placeholder="Enter current password" 
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700">New Password</label>
                      <input 
                        type="password" 
                        value={passwords.newPassword}
                        onChange={(e) => setPasswords({...passwords, newPassword: e.target.value})}
                        placeholder="Enter new password" 
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700">Confirm New Password</label>
                      <input 
                        type="password" 
                        value={passwords.confirmPassword}
                        onChange={(e) => setPasswords({...passwords, confirmPassword: e.target.value})}
                        placeholder="Confirm new password" 
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" 
                      />
                    </div>
                    
                    <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-lg flex items-start gap-3">
                      <Shield className="h-5 w-5 text-orange-600 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-semibold text-orange-800">Two-Factor Authentication</h4>
                        <p className="text-xs text-orange-600 mt-1">Enhance your account security by enabling 2FA. Currently disabled.</p>
                        <Button variant="outline" className="mt-2 text-orange-700 border-orange-300 hover:bg-orange-100 h-8 text-xs">Enable 2FA</Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* NOTIFICATIONS TAB */}
              {activeTab === "notifications" && (
                <div className="p-6 animate-in fade-in duration-200">
                  <h2 className="text-lg font-bold text-slate-800 mb-4">Notification Preferences</h2>
                  <div className="space-y-6">
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-semibold text-slate-800">Emergency Alerts</h4>
                        <p className="text-xs text-slate-500">Receive instant alerts when an emergency is logged.</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={notifications.emergencyAlerts} 
                          onChange={(e) => setNotifications({...notifications, emergencyAlerts: e.target.checked})}
                          className="sr-only peer" 
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-semibold text-slate-800">Low Stock Warnings</h4>
                        <p className="text-xs text-slate-500">Get notified when medications or inventory drop below minimum.</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={notifications.lowStock} 
                          onChange={(e) => setNotifications({...notifications, lowStock: e.target.checked})}
                          className="sr-only peer" 
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-semibold text-slate-800">Daily Summary Report</h4>
                        <p className="text-xs text-slate-500">Receive an email summary of all clinic activities at 5:00 PM.</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={notifications.dailySummary} 
                          onChange={(e) => setNotifications({...notifications, dailySummary: e.target.checked})}
                          className="sr-only peer" 
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                  </div>
                </div>
              )}

              {/* Footer Action Buttons */}
              <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50 rounded-b-xl">
                <Button variant="outline" className="text-slate-600 border-slate-200">Cancel</Button>
                <Button onClick={handleSaveChanges} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 min-w-[140px]">
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} 
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </>
          )}

        </div>
      </div>

      {/* ================= CUSTOM SUCCESS POPUP ================= */}
      {popupMessage.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col items-center text-center p-6 animate-in zoom-in-95 duration-200">
            <div className="h-14 w-14 rounded-full flex items-center justify-center mb-4 bg-green-100 text-green-600">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">{popupMessage.title}</h3>
            <p className="text-sm text-slate-500 mb-6 px-2">{popupMessage.message}</p>
            
            {/* UPDATED BUTTON: Nagre-refresh na ang page para makuha ng Header ang bagong pangalan! */}
            <Button 
              onClick={() => {
                setPopupMessage({ ...popupMessage, isOpen: false });
                if (activeTab === "profile") {
                  window.location.reload(); 
                }
              }} 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-6"
            >
              Done
            </Button>

          </div>
        </div>
      )}

    </div>
  );
}