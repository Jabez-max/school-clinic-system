"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Megaphone, Calendar, AlertCircle, Loader2, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function AnnouncementsPage() {
  const router = useRouter();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          router.push("/login");
          return;
        }

        // 👇 BINAGO: Pinalitan ang localhost at ginamit ang Environment Variable 👇
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/student/announcements`, {
          headers: { "Authorization": `Bearer ${token}` }
        });

        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem("token");
          router.push("/login");
          return;
        }

        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed to load announcements");

        setAnnouncements(json.announcements || []);
      } catch (err: any) {
        setError(err.message || "Unable to connect to the server.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnnouncements();
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-10 w-10 animate-spin text-amber-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 bg-white rounded-3xl border border-rose-100 shadow-sm mt-6">
        <AlertCircle className="h-12 w-12 text-rose-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-800">Unable to load announcements</h2>
        <p className="text-slate-500 mt-2 text-sm">{error}</p>
        <Button onClick={() => window.location.reload()} className="mt-4 bg-amber-600 hover:bg-amber-700 text-white">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12 max-w-4xl mx-auto">
      
      {/* HEADER SECTION */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="relative z-10 flex items-center gap-4">
          <div className="h-16 w-16 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600">
            <Megaphone className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Clinic Announcements</h1>
            <p className="text-slate-500 mt-1 text-sm md:text-base">Stay updated with the latest news and advisories.</p>
          </div>
        </div>
        <div className="relative z-10">
          <Badge variant="outline" className="px-4 py-2 text-sm bg-slate-50 text-slate-600 border-slate-200 font-medium">
            {announcements.length} Updates
          </Badge>
        </div>
        <div className="absolute right-0 top-0 w-64 h-full bg-gradient-to-l from-amber-50 to-transparent opacity-50 pointer-events-none rounded-r-3xl"></div>
      </div>

      {/* ANNOUNCEMENTS LIST */}
      <div className="space-y-4">
        {announcements.length > 0 ? (
          announcements.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition-shadow relative overflow-hidden">
              {/* Little accent bar on the left */}
              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-amber-400"></div>
              
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-start">
                  <h3 className="text-xl font-bold text-slate-800">{item.title}</h3>
                </div>
                
                <p className="text-sm text-slate-500 flex items-center font-medium mb-2">
                  <Calendar className="h-4 w-4 mr-2 text-amber-500" />
                  {new Date(item.createdAt).toLocaleDateString('en-US', { 
                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
                  })}
                </p>
                
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {item.content}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center">
            <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Info className="h-10 w-10 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">No Announcements</h3>
            <p className="text-slate-500 max-w-sm mx-auto">
              There are no active announcements from the clinic at this moment. Check back later!
            </p>
          </div>
        )}
      </div>

    </div>
  );
}