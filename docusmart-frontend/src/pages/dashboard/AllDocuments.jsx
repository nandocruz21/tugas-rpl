import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../../api/axios';
import ShareModal from '../../components/modals/ShareModal';

const AllDocuments = () => {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
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
        <h2 className="text-2xl font-bold text-slate-800">All Documents</h2>
        <p className="text-sm text-slate-500 mt-1">Browse and manage all your uploaded documents.</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200 flex justify-between items-center bg-white">
          <h2 className="text-lg font-bold text-slate-800">Document Repository</h2>
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
                    <p>No documents found.</p>
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
                      <span className="text-sm text-slate-600">{doc.owner?.name || 'You'}</span>
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

export default AllDocuments;
