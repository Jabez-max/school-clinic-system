"use client";
import React, { useEffect, useState } from 'react';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await fetch('https://school-clinic-system-production.up.railway.app/api/admin/audit-logs');
        if (response.ok) {
          const data = await response.json();
          setLogs(data);
        } else {
          console.error('Failed to load logs');
        }
      } catch (error) {
        console.error('Connection error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLogs();
  }, []);

  return (
    <div className="p-8 w-full">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#152A4A]">System Audit Logs</h1>
          <p className="text-gray-500 text-sm mt-1">Track and monitor all administrative actions securely.</p>
        </div>
        <button className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
          Export Report
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date & Time</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">User / Role</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-500">
                    <div className="flex justify-center items-center gap-2">
                      <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      Loading audit logs from database...
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-500">
                    No system audit logs found.
                  </td>
                </tr>
              ) : (
                logs.map((log: any) => {
                  const formattedDate = new Date(log.createdAt).toLocaleString('en-US', {
                    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
                  });
                  
                  const adminName = log.user 
                    ? `${log.user.firstName || ''} ${log.user.lastName || ''}`.trim() 
                    : 'System / Unknown User';
                    
                  const roleName = log.user ? log.user.role : (log.role || 'SYSTEM');

                  return (
                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4 text-sm text-gray-600 whitespace-nowrap">{formattedDate}</td>
                      <td className="p-4">
                        <div className="font-medium text-[#152A4A] text-sm">{adminName || 'Unknown User'}</div>
                        <div className="text-xs text-gray-500">{roleName}</div>
                      </td>
                      <td className="p-4">
                        <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-semibold tracking-wide">
                          {log.action}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-gray-600">{log.details || 'No details provided.'}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {!isLoading && logs.length > 0 && (
          <div className="p-4 border-t border-gray-100 flex justify-between items-center text-sm text-gray-500">
            <span>Showing {logs.length} entries</span>
            <div className="flex gap-2">
              <button className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50" disabled>Prev</button>
              <button className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50" disabled>Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}