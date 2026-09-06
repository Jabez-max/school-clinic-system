"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Bell, AlertCircle, RefreshCw, Clock, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HeadTeacherNotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchNotifications = async () => {
    setIsLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No active session found. Please log in.");

      const res = await fetch("http://localhost:5000/api/head-teacher/notifications", {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to fetch notifications");
      }
      
      setNotifications(json.notifications);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      
      {/* HEADER SECTION */}
      <div>
        <Link href="/head-teacher/dashboard" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors mb-4">
          <ChevronLeft className="h-4 w-4 mr-1" /> Back to Dashboard
        </Link>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Bell className="h-6 w-6 text-blue-600 fill-blue-100" /> Notifications & Activity
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              View your recent system activities, submitted referrals, and alerts.
            </p>
          </div>
          <Button onClick={fetchNotifications} variant="outline" className="text-slate-600 bg-slate-50 hover:bg-slate-100 flex items-center gap-2">
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </div>
      </div>

      {/* ERROR STATE */}
      {error && (
        <div className="flex flex-col items-center justify-center py-12 bg-white rounded-2xl border border-red-100 shadow-sm">
          <AlertCircle className="h-10 w-10 text-red-500 mb-3" />
          <h2 className="text-lg font-bold text-slate-800">Unable to load notifications</h2>
          <p className="text-slate-500 mt-1 mb-4 text-sm text-center max-w-md">{error}</p>
          <Button onClick={fetchNotifications} variant="outline" className="text-slate-600">
            <RefreshCw className="h-4 w-4 mr-2" /> Try Again
          </Button>
        </div>
      )}

      {/* MAIN LIST SECTION */}
      {!error && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          
          {/* LOADING STATE */}
          {isLoading ? (
            <div className="divide-y divide-slate-100">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="p-6 flex items-start gap-4 animate-pulse">
                  <div className="h-10 w-10 bg-slate-200 rounded-full flex-shrink-0"></div>
                  <div className="space-y-2 w-full">
                    <div className="h-4 bg-slate-200 rounded w-1/3"></div>
                    <div className="h-3 bg-slate-100 rounded w-3/4"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            
            /* EMPTY STATE */
            <div className="p-16 text-center flex flex-col items-center">
              <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
                <Bell className="h-8 w-8 text-slate-300" />
              </div>
              <h3 className="text-lg font-bold text-slate-700">No Notifications</h3>
              <p className="text-slate-500 text-sm mt-1 max-w-sm">
                You're all caught up! You don't have any recent activities or alerts at the moment.
              </p>
            </div>
          ) : (
            
            /* NOTIFICATION ROWS */
            <div className="divide-y divide-slate-100">
              {notifications.map((notif: any) => (
                <div key={notif.id} className="p-6 flex items-start gap-4 hover:bg-slate-50 transition-colors">
                  <div className="h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 bg-blue-100 text-blue-600">
                    <Activity className="h-5 w-5" />
                  </div>
                  
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-800">
                      {notif.action.replace(/_/g, ' ')}
                    </p>
                    <p className="text-sm text-slate-600 mt-0.5">
                      {notif.details}
                    </p>
                    <div className="flex items-center text-xs text-slate-400 mt-2 font-medium">
                      <Clock className="h-3 w-3 mr-1" />
                      {new Date(notif.createdAt).toLocaleString(undefined, {
                        month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}