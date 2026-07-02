import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import api from '../../api/axios';
import ShareModal from '../../components/modals/ShareModal';

const Dashboard = () => {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, recent: 0 });
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const searchQuery = searchParams.get('search') || '';
    fetchDocuments(searchQuery);
  }, [location.search]);

  const fetchDocuments = async (searchQuery = '') => {
    try {
      setIsLoading(true);
      const endpoint = searchQuery ? `/documents?search=${encodeURIComponent(searchQuery)}` : '/documents';
      const response = await api.get(endpoint);
      if (response.data.status === 'success') {
        const paginatedData = response.data.data;
        const docsArray = paginatedData.data || paginatedData;
        setDocuments(docsArray);
        
        // Calculate basic stats
        const totalDocs = paginatedData.total !== undefined ? paginatedData.total : docsArray.length;
        
        // Count docs added/updated in the last 24 hours
        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);
        const recentDocs = docsArray.filter(doc => new Date(doc.updated_at) > oneDayAgo).length;

        setStats({ total: totalDocs, recent: recentDocs });
      }
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreview = async (documentId) => {
    try {
      const response = await api.get(`/documents/${documentId}/preview?preview=true`, {
        responseType: 'blob',
      });
      
      const fileType = response.headers['content-type'] || 'application/pdf';
      const file = new Blob([response.data], { type: fileType });
      const fileURL = URL.createObjectURL(file);
      window.open(fileURL, '_blank');
      
    } catch (error) {
      console.error('Preview failed:', error);
      alert('Failed to load document preview.');
    }
  };

  const handleDownload = async (documentId, fileName) => {
    try {
      // Create a temporary toast or loading state if needed here
      const response = await api.get(`/documents/${documentId}/download`, {
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download document. Make sure you have the right permissions.');
    }
  };

  return (
    <>
      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
            <span className="material-symbols-outlined">folder</span>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Documents</p>
            <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
            <span className="material-symbols-outlined">description</span>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Recently Added</p>
            <p className="text-2xl font-bold text-slate-900">{stats.recent}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
            <span className="material-symbols-outlined">pending_actions</span>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Pending Review</p>
            <p className="text-2xl font-bold text-slate-900">0</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600">
            <span className="material-symbols-outlined">warning</span>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Expiring Soon</p>
            <p className="text-2xl font-bold text-slate-900">0</p>
          </div>
        </div>
      </div>

      {/* Recent Documents Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200 flex justify-between items-center bg-white">
          <h2 className="text-lg font-bold text-slate-800">Recent Documents</h2>
          <Link to="/documents" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">View All</Link>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200">
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider w-2/5">Document Name</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Owner</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Date Modified</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-slate-500 text-sm">
                    <span className="material-symbols-outlined animate-spin text-xl mb-2">progress_activity</span>
                    <p>Loading documents...</p>
                  </td>
                </tr>
              ) : documents.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-slate-500 text-sm">
                    <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">folder_open</span>
                    <p>No documents found. Upload your first document!</p>
                  </td>
                </tr>
              ) : (
                documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-3">
                        <span className={`material-symbols-outlined text-2xl ${doc.current_version?.mime_type?.includes('pdf') ? 'text-red-500' : 'text-blue-500'}`}>
                          {doc.current_version?.mime_type?.includes('pdf') ? 'picture_as_pdf' : 'description'}
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">{doc.name}</p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            v{doc.current_version?.version_number || '1.0'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-600">{doc.owner?.name || 'Unknown'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-600">{new Date(doc.updated_at).toLocaleDateString()}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1 sm:gap-2 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handlePreview(doc.id)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" 
                          title="Preview"
                        >
                          <span className="material-symbols-outlined text-[18px] sm:text-[20px]">visibility</span>
                        </button>
                        <button 
                          onClick={() => handleDownload(doc.id, doc.current_version?.original_filename || doc.name)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" 
                          title="Download"
                        >
                          <span className="material-symbols-outlined text-[18px] sm:text-[20px]">download</span>
                        </button>
                        <button 
                          onClick={() => { setSelectedDoc(doc); setIsShareModalOpen(true); }}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" 
                          title="Share"
                        >
                          <span className="material-symbols-outlined text-[18px] sm:text-[20px]">share</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        documentId={selectedDoc?.id}
        documentName={selectedDoc?.name}
      />
    </>
  );
};

export default Dashboard;
