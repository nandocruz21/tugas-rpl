import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../../api/axios';

const SharedDocuments = () => {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const searchQuery = searchParams.get('search') || '';
    fetchSharedDocuments(searchQuery);
  }, [location.search]);

  const fetchSharedDocuments = async (searchQuery = '') => {
    try {
      setIsLoading(true);
      const endpoint = searchQuery 
        ? `/documents?scope=shared&search=${encodeURIComponent(searchQuery)}` 
        : '/documents?scope=shared';
        
      const response = await api.get(endpoint);
      if (response.data.status === 'success') {
        const paginatedData = response.data.data;
        const docsArray = paginatedData.data || paginatedData;
        setDocuments(docsArray);
      }
    } catch (error) {
      console.error('Failed to fetch shared documents:', error);
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
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Shared with me</h2>
        <p className="text-sm text-slate-500 mt-1">Documents that other users have given you access to.</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200 flex justify-between items-center bg-white">
          <h2 className="text-lg font-bold text-slate-800">Shared Documents</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200">
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider w-2/5">Document Name</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Shared By (Owner)</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Date Modified</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-slate-500 text-sm">
                    <span className="material-symbols-outlined animate-spin text-xl mb-2">progress_activity</span>
                    <p>Loading shared documents...</p>
                  </td>
                </tr>
              ) : documents.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-slate-500 text-sm">
                    <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">group_off</span>
                    <p>No documents have been shared with you yet.</p>
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
                      <div className="flex items-center gap-2">
                         <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold uppercase text-[10px]">
                            {doc.owner?.name ? doc.owner.name.substring(0, 2) : '??'}
                          </div>
                          <span className="text-sm text-slate-600">{doc.owner?.name || 'Unknown'}</span>
                      </div>
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
                      </div>
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

export default SharedDocuments;
