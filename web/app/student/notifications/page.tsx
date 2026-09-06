"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Bell, Clock, AlertCircle, Loader2, Info, Activity, CalendarCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          router.push("/login");
          return;
        }

        const res = await fetch("http://localhost:5000/api/student/notifications", {
          headers: { "Authorization": `Bearer ${token}` }
        });

        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem("token");
          router.push("/login");
          return;
        }

        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed to load notifications");

        setNotifications(json.notifications || []);
      } catch (err: any) {
        setError(err.message || "Unable to connect to the server.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotifications();
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 bg-white rounded-3xl border border-rose-100 shadow-sm mt-6">
        <AlertCircle className="h-12 w-12 text-rose-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-800">Unable to load notifications</h2>
        <p className="text-slate-500 mt-2 text-sm">{error}</p>
        <Button onClick={() => window.location.reload()} className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white">
          Retry
        </Button>
      </div>
    );
  }

  // Helper para pumili ng icon at kulay base sa uri ng action
  const getNotificationStyle = (action: string) => {
    if (action.includes("LOGIN")) return { icon: <Activity className="h-5 w-5 text-emerald-500" />, bg: "bg-emerald-50 border-emerald-100" };
    if (action.includes("REQUEST")) return { icon: <CalendarCheck className="h-5 w-5 text-indigo-500" />, bg: "bg-indigo-50 border-indigo-100" };
    if (action.includes("FAIL")) return { icon: <AlertCircle className="h-5 w-5 text-rose-500" />, bg: "bg-rose-50 border-rose-100" };
    return { icon: <Info className="h-5 w-5 text-slate-500" />, bg: "bg-slate-50 border-slate-200" };
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12 max-w-4xl mx-auto">
      
      {/* HEADER SECTION */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="relative z-10 flex items-center gap-4">
          <div className="h-16 w-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-700">
            <Bell className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Notifications</h1>
            <p className="text-slate-500 mt-1 text-sm md:text-base">Your recent activities and alerts.</p>
          </div>
        </div>
        <div className="relative z-10">
          <Badge variant="outline" className="px-4 py-2 text-sm bg-slate-50 text-slate-600 border-slate-200 font-medium">
            {notifications.length} Recent Alerts
          </Badge>
        </div>
        <div className="absolute right-0 top-0 w-64 h-full bg-gradient-to-l from-slate-100 to-transparent opacity-50 pointer-events-none rounded-r-3xl"></div>
      </div>

      {/* NOTIFICATIONS LIST */}
      <div className="space-y-3">
        {notifications.length > 0 ? (
          notifications.map((item) => {
            const style = getNotificationStyle(item.action);
            return (
              <div key={item.id} className={`rounded-2xl border p-4 md:p-5 flex items-start gap-4 transition-all hover:shadow-sm ${style.bg}`}>
                <div className="mt-1 bg-white p-2 rounded-full shadow-sm">
                  {style.icon}
                </div>
                <div className="flex-grow">
                  <div className="flex justify-between items-start mb-1 gap-4">
                    <h4 className="font-bold text-slate-800 text-sm md:text-base">{item.action.replace(/_/g, ' ')}</h4>
                    <span className="text-xs font-medium text-slate-500 flex items-center whitespace-nowrap">
                      <Clock className="h-3 w-3 mr-1" />
                      {new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-slate-600 text-sm">{item.details}</p>
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center">
            <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell className="h-10 w-10 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">No Notifications</h3>
            <p className="text-slate-500 max-w-sm mx-auto">
              You're all caught up! Any new updates regarding your account or clinic visits will appear here.
            </p>
          </div>
        )}
      </div>

    </div>
  );
}