"use client";

import React, { useState, useEffect } from "react";
import { TrendingUp, Users, Clock, Activity, Calendar, BarChart2, PieChart, ArrowUpRight, ArrowDownRight, MoreVertical, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState("This Month");
  const [isLoading, setIsLoading] = useState(true);
  
  // CUSTOM POPUP STATE PARA SA EXPORT
  const [exportPopup, setExportPopup] = useState(false);

  // DATA STATE PARA SA BACKEND
  const [analytics, setAnalytics] = useState({
    totalPatients: 0,
    commonDiagnosis: "N/A",
    busiestDay: "N/A",
    topIllnesses: [] as any[],
    chartData: [] as number[]
  });

  // FETCH DATA MULA SA BACKEND
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const token = localStorage.getItem("token");
        // 👇 BINAGO: Pinalitan ang localhost at ginamit ang Environment Variable 👇
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/nurse/analytics`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await res.json();
        
        if (res.ok) {
          setAnalytics({
            totalPatients: data.totalPatients || 0,
            commonDiagnosis: data.commonDiagnosis || "N/A",
            busiestDay: data.busiestDay || "N/A",
            topIllnesses: data.topIllnesses || [],
            chartData: data.chartData && data.chartData.length > 0 ? data.chartData : Array(30).fill(0) 
          });
        }
      } catch (err) {
        console.error("Failed to fetch analytics", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  // =====================================================================
  // TOTOONG EXPORT/DOWNLOAD FUNCTION (Gagawa ng CSV file para sa Excel)
  // =====================================================================
  const handleExportData = () => {
    // 1. Buuin ang content ng CSV (Kukuhanin ang data mula sa State)
    let csvContent = "Clinic Analytics Export\n";
    csvContent += `Generated On,${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}\n\n`;

    csvContent += "Key Performance Indicators\n";
    csvContent += `Total Patients This Month,${analytics.totalPatients}\n`;
    csvContent += `Most Common Diagnosis,${analytics.commonDiagnosis}\n`;
    csvContent += `Busiest Clinic Day,${analytics.busiestDay}\n\n`;

    csvContent += "Top Diagnoses Breakdown\n";
    csvContent += "Diagnosis Name,Total Cases,Percentage\n";
    
    analytics.topIllnesses.forEach(illness => {
      csvContent += `${illness.name},${illness.count},${illness.percentage}%\n`;
    });

    // 2. I-convert sa Blob (File object)
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    
    // 3. Gumawa ng hidden link at i-trigger ang download
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `Clinic_Analytics_${new Date().toISOString().split('T')[0]}.csv`);
    
    document.body.appendChild(link);
    link.click(); // Kusang mada-download dito
    document.body.removeChild(link);

    // 4. Ipakita ang Success Popup pagkatapos ma-download
    setExportPopup(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 relative">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Clinic Analytics</h1>
          <p className="text-slate-500 text-sm mt-1">Visualize health trends, peak hours, and patient demographics.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="flex items-center gap-2 text-slate-600 border-slate-200 cursor-default">
            <Calendar className="h-4 w-4" /> {timeRange}
          </Button>
          <Button onClick={handleExportData} className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 px-4 py-2 rounded-lg transition-colors">
            <TrendingUp className="h-4 w-4" /> Export Data
          </Button>
        </div>
      </div>

      {/* KPI Cards (Key Performance Indicators) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Users className="h-5 w-5" />
            </div>
            <span className="flex items-center text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">
              <ArrowUpRight className="h-3 w-3 mr-1" /> Live
            </span>
          </div>
          <p className="text-slate-500 text-sm font-medium">Total Patients</p>
          <h3 className="text-2xl font-bold text-slate-800 mt-1">
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin text-blue-500 mt-1" /> : analytics.totalPatients}
          </h3>
          <p className="text-xs text-slate-400 mt-2">Visits this month</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <Clock className="h-5 w-5" />
            </div>
            <span className="flex items-center text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">
              <ArrowDownRight className="h-3 w-3 mr-1" /> Est
            </span>
          </div>
          <p className="text-slate-500 text-sm font-medium">Avg. Wait Time</p>
          <h3 className="text-2xl font-bold text-slate-800 mt-1">12 mins</h3>
          <p className="text-xs text-slate-400 mt-2">Decreased wait times</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
              <Activity className="h-5 w-5" />
            </div>
            <span className="flex items-center text-xs font-semibold text-rose-600 bg-rose-50 px-2 py-1 rounded-full">
              <ArrowUpRight className="h-3 w-3 mr-1" /> Alert
            </span>
          </div>
          <p className="text-slate-500 text-sm font-medium">Common Diagnosis</p>
          <h3 className="text-xl font-bold text-slate-800 mt-1 truncate">
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin text-rose-500 mt-1" /> : analytics.commonDiagnosis}
          </h3>
          <p className="text-xs text-slate-400 mt-2">Most frequent case</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-teal-50 text-teal-600 rounded-lg">
              <BarChart2 className="h-5 w-5" />
            </div>
          </div>
          <p className="text-slate-500 text-sm font-medium">Busiest Day</p>
          <h3 className="text-2xl font-bold text-slate-800 mt-1">
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin text-teal-500 mt-1" /> : analytics.busiestDay}
          </h3>
          <p className="text-xs text-slate-400 mt-2">Highest foot traffic</p>
        </div>
      </div>

      {/* Main Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* CSS-based Bar Chart Area */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Patient Visits Over Time</h2>
              <p className="text-sm text-slate-500">Daily clinic foot traffic for the current month.</p>
            </div>
            <Button variant="ghost" size="icon" className="text-slate-400">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </div>
          
          <div className="flex-1 flex items-end justify-between gap-1 h-48 mt-4 pt-4 border-t border-slate-100 relative">
            {isLoading ? (
              <div className="absolute inset-0 flex items-center justify-center text-slate-400">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : analytics.chartData.length > 0 ? (
              analytics.chartData.map((height, i) => (
                <div key={i} className="w-full relative group">
                  <div 
                    className={`transition-colors rounded-t-sm w-full mx-auto ${height > 0 ? 'bg-blue-100 hover:bg-blue-600' : 'bg-transparent'}`}
                    style={{ height: `${height}%` }}
                  ></div>
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                    Day {i + 1}
                  </div>
                </div>
              ))
            ) : (
               <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-sm">
                  No visits recorded this month yet.
               </div>
            )}
          </div>
          <div className="flex justify-between text-xs text-slate-400 mt-3 px-1">
            <span>Day 1</span>
            <span>Mid-Month</span>
            <span>Month End</span>
          </div>
        </div>

        {/* Top Illnesses Progress Bars */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <PieChart className="h-5 w-5 text-slate-600" />
            <h2 className="text-lg font-bold text-slate-800">Top Diagnoses</h2>
          </div>
          
          <div className="space-y-5">
            {isLoading ? (
               <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-slate-300" /></div>
            ) : analytics.topIllnesses.length > 0 ? (
              analytics.topIllnesses.map((illness, idx) => (
                <div key={idx}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-slate-700">{illness.name}</span>
                    <span className="text-slate-500">{illness.count} cases</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div 
                      className={`${illness.color} h-2 rounded-full`} 
                      style={{ width: `${illness.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))
            ) : (
               <p className="text-sm text-slate-500 text-center py-8">No diagnoses recorded this month.</p>
            )}
          </div>
        </div>

      </div>

      {/* ================= CUSTOM EXPORT POPUP ================= */}
      {exportPopup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col items-center text-center p-6 animate-in zoom-in-95 duration-200">
            <div className="h-14 w-14 rounded-full flex items-center justify-center mb-4 bg-green-100 text-green-600">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Data Exported!</h3>
            <p className="text-sm text-slate-500 mb-6 px-2">The analytics data has been successfully exported as a CSV file to your device.</p>
            <Button onClick={() => setExportPopup(false)} className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-6">
              Done
            </Button>
          </div>
        </div>
      )}

    </div>
  );
}