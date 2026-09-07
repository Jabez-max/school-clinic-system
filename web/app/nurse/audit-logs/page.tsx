"use client";

import React, { useState, useEffect } from "react";
import { Search, Filter, ShieldAlert, Clock, User, Download, Database, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [stats, setStats] = useState({ logsToday: 0, securityAlerts: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // CUSTOM POPUP STATE PARA SA EXPORT
  const [exportPopup, setExportPopup] = useState(false);

  // FETCH TOTOONG DATA MULA SA BACKEND
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const token = localStorage.getItem("token");
        // 👇 BINAGO: Pinalitan ang localhost at ginamit ang Environment Variable 👇
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/nurse/audit-logs`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await res.json();
        
        if (res.ok) {
          setLogs(data.logs || []);
          setStats(data.stats || { logsToday: 0, securityAlerts: 0 });
        }
      } catch (err) {
        console.error("Failed to load audit logs", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLogs();
  }, []);

  // EXPORT FUNCTION (Gagawa ng CSV file ng lahat ng logs)
  const handleExportData = () => {
    let csvContent = "Clinic System Audit Trail\n";
    csvContent += `Exported On,${new Date().toLocaleString()}\n\n`;
    csvContent += "Log ID,Timestamp,Action Performed,Module,Target/Details,User,Role,IP Address\n";
    
    logs.forEach(log => {
      const dateObj = new Date(log.createdAt);
      const timestamp = `"${dateObj.toLocaleDateString()} - ${dateObj.toLocaleTimeString()}"`;
      const userName = log.user ? `${log.user.firstName} ${log.user.lastName}` : "System";
      const details = log.details ? `"${log.details}"` : "N/A";
      
      csvContent += `${log.id},${timestamp},"${log.action}",${log.module || 'System'},${details},${userName},${log.role || 'SYSTEM'},${log.ipAddress || '127.0.0.1'}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `Audit_Logs_${new Date().toISOString().split('T')[0]}.csv`);
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Ipakita ang Success Popup
    setExportPopup(true);
  };

  // SEARCH FILTER
  const filteredLogs = logs.filter(log => {
    const search = searchTerm.toLowerCase();
    const userName = log.user ? `${log.user.firstName} ${log.user.lastName}`.toLowerCase() : "system";
    return (
      log.action.toLowerCase().includes(search) || 
      (log.module && log.module.toLowerCase().includes(search)) || 
      userName.includes(search) ||
      log.id.toLowerCase().includes(search)
    );
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-24 relative">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">System Audit Logs</h1>
          <p className="text-slate-500 text-sm mt-1">Monitor user activities, system changes, and security events.</p>
        </div>
        <Button onClick={handleExportData} className="bg-slate-800 hover:bg-slate-900 text-white flex items-center gap-2 px-4 py-2 rounded-lg transition-colors">
          <Download className="h-4 w-4" /> Export Audit Trail
        </Button>
      </div>

      {/* Quick Security Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-slate-100 text-slate-600 rounded-lg">
            <Database className="h-6 w-6" />
          </div>
          <div>
            <p className="text-slate-500 text-sm font-medium">Logs Recorded (Today)</p>
            <p className="text-2xl font-bold text-slate-800">{isLoading ? "..." : stats.logsToday}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className={`p-3 rounded-lg ${stats.securityAlerts > 0 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <p className="text-slate-500 text-sm font-medium">Security Alerts</p>
            <p className="text-2xl font-bold text-slate-800">{isLoading ? "..." : stats.securityAlerts}</p>
          </div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by action, user, or module..."
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" className="flex items-center gap-2 text-slate-600 border-slate-200 hover:bg-slate-50 py-2.5">
          <Filter className="h-4 w-4" /> Filter by Date
        </Button>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-visible">
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
              <tr>
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4">Action Performed</th>
                <th className="px-6 py-4">Module / Target</th>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <Loader2 className="h-8 w-8 text-slate-600 animate-spin mb-3" />
                      Fetching audit logs...
                    </div>
                  </td>
                </tr>
              ) : filteredLogs.length > 0 ? (
                filteredLogs.map((log) => {
                  const dateObj = new Date(log.createdAt);
                  const displayDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                  const displayTime = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  const displayId = `LOG-${log.id.slice(-4).toUpperCase()}`;
                  const userName = log.user ? `${log.user.firstName} ${log.user.lastName}` : "System";

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-slate-700">
                          <Clock className="h-4 w-4 text-slate-400" />
                          {displayDate} - {displayTime}
                        </div>
                        <p className="text-xs text-slate-400 mt-1 ml-6">{displayId}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className={`font-semibold ${log.action.includes('Delete') ? 'text-red-600' : 'text-slate-800'}`}>
                          {log.action}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md text-xs font-medium border border-slate-200">
                          {log.module || "System"}
                        </span>
                        <p className="text-xs text-slate-500 mt-2 truncate max-w-[200px]" title={log.details || ""}>
                          {log.details || "N/A"}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-slate-400" />
                          <p className="font-medium text-slate-700">{userName}</p>
                        </div>
                        <p className="text-xs text-slate-400 mt-1 ml-6">{log.role || "SYSTEM"}</p>
                      </td>
                      <td className="px-6 py-4 text-slate-500 font-mono text-xs">
                        {log.ipAddress || "127.0.0.1"}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    <p>No audit logs found.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= CUSTOM EXPORT POPUP ================= */}
      {exportPopup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col items-center text-center p-6 animate-in zoom-in-95 duration-200">
            <div className="h-14 w-14 rounded-full flex items-center justify-center mb-4 bg-slate-100 text-slate-800">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Logs Exported!</h3>
            <p className="text-sm text-slate-500 mb-6 px-2">The system audit trail has been securely exported to your device as a CSV file.</p>
            <Button onClick={() => setExportPopup(false)} className="w-full bg-slate-800 hover:bg-slate-900 text-white rounded-xl py-6">
              Done
            </Button>
          </div>
        </div>
      )}

    </div>
  );
}