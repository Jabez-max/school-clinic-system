"use client";
import { useState, useEffect } from "react";
import { PageHeader } from "@/components/ui-states/PageHeader";

export default function NurseDashboard() {
  const [stats, setStats] = useState({
    totalPatientsToday: 0,
    pendingClearances: 0,
    lowMedicineStock: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  // KUNIN ANG TOTOONG BILANG MULA SA DATABASE
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem("token");
        
        // 👇 BINAGO: Pinalitan ang localhost at ginamit ang Environment Variable 👇
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/nurse/dashboard-stats`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const data = await res.json();
        
        if (res.ok) {
          setStats(data);
        }
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div>
      <PageHeader 
        title="Clinic Dashboard" 
        description="Welcome to the School Clinic Management System overview."
      />
      
      {/* Quick Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 border-l-4 border-l-blue-500 transition-all hover:shadow-md">
          <h3 className="font-semibold text-slate-600 text-sm">Total Patients Today</h3>
          <p className="text-4xl font-bold text-slate-800 mt-3">
            {isLoading ? <span className="text-slate-300 text-2xl animate-pulse">Loading...</span> : stats.totalPatientsToday}
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 border-l-4 border-l-orange-500 transition-all hover:shadow-md">
          <h3 className="font-semibold text-slate-600 text-sm">Pending Clearances</h3>
          <p className="text-4xl font-bold text-slate-800 mt-3">
            {isLoading ? <span className="text-slate-300 text-2xl animate-pulse">Loading...</span> : stats.pendingClearances}
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 border-l-4 border-l-red-500 transition-all hover:shadow-md">
          <h3 className="font-semibold text-slate-600 text-sm">Low Medicine Stock</h3>
          <p className="text-4xl font-bold text-slate-800 mt-3">
            {isLoading ? <span className="text-slate-300 text-2xl animate-pulse">Loading...</span> : stats.lowMedicineStock}
          </p>
        </div>

      </div>
    </div>
  );
}