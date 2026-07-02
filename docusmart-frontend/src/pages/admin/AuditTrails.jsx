import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../../api/axios';

const AuditTrails = () => {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const location = useLocation();

  useEffect(() => {
    fetchLogs();
  }, [location.search]);

  const fetchLogs = async () => {
    try {
      const searchParams = new URLSearchParams(location.search);
      const searchQuery = searchParams.get('search') || '';
      
      const response = await api.get('/audit-logs', {
        params: { search: searchQuery }
      });
      
      if (response.data.status === 'success') {
        const logsArray = response.data.data.data || response.data.data;
        setLogs(logsArray);
      }
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'UPLOAD': return 'bg-blue-100 text-blue-700';
      case 'DOWNLOAD': return 'bg-emerald-100 text-emerald-700';
      case 'NEW_VERSION': return 'bg-purple-100 text-purple-700';
      case 'DELETE': return 'bg-red-100 text-red-700';
      case 'VIEW': return 'bg-slate-100 text-slate-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Audit Trails</h2>
          <p className="text-sm text-slate-500 mt-1">Track system activity, file access, and modifications.</p>
        </div>
        <button className="bg-white border border-slate-300 text-slate-700 rounded-lg py-2 px-4 flex items-center gap-2 hover:bg-slate-50 transition-colors shadow-sm font-medium text-sm">
          <span className="material-symbols-outlined text-[18px]">download</span>
          Export Report
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200">
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Timestamp</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Action</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Resource</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-slate-500 text-sm">
                    <span className="material-symbols-outlined animate-spin text-xl mb-2">progress_activity</span>
                    <p>Loading audit logs...</p>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-slate-500 text-sm">
                    <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">history</span>
                    <p>No audit logs recorded yet.</p>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-slate-900">
                        {new Date(log.created_at).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-700 font-medium">
                        {log.user?.name || 'System'}
                      </span>
                      <p className="text-[11px] text-slate-400">{log.ip_address}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-[11px] font-bold tracking-wider ${getActionColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-600 font-medium">
                        {log.resource_name || `ID: ${log.resource_id}`}
                      </span>
                      <p className="text-[11px] text-slate-400">{log.resource_type}</p>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {log.metadata ? (
                        <pre className="bg-slate-50 p-2 rounded border border-slate-100 text-[10px] overflow-x-auto max-w-xs">
                          {JSON.stringify(log.metadata, null, 2)}
                        </pre>
                      ) : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default AuditTrails;
