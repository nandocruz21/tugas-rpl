import React, { useState } from 'react';
import api from '../../api/axios';

const ShareModal = ({ isOpen, onClose, documentId, documentName, onShared }) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('viewer');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await api.post(`/documents/${documentId}/share`, {
        email,
        role,
      });

      if (response.data.status === 'success') {
        setSuccess(true);
        setEmail('');
        setRole('viewer');
        if (onShared) onShared();
        
        // Auto close after 2 seconds
        setTimeout(() => {
          onClose();
          setSuccess(false);
        }, 2000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to share document. Make sure the email is correct and registered.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <span className="material-symbols-outlined text-indigo-600">group_add</span>
            Share Document
          </h2>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-indigo-50 text-indigo-700 p-3 rounded-lg text-sm mb-4">
            Sharing: <span className="font-semibold">{documentName}</span>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-start gap-2">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <p>{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-emerald-50 text-emerald-700 p-3 rounded-lg text-sm flex items-start gap-2">
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
              <p>Document shared successfully!</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              User Email <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">mail</span>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="colleague@example.com"
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Access Level
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">admin_panel_settings</span>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all appearance-none"
              >
                <option value="viewer">Viewer (Read Only)</option>
                <option value="editor">Editor (Can Upload Versions)</option>
              </select>
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">expand_more</span>
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !email}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {isLoading ? (
                <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
              ) : (
                <span className="material-symbols-outlined text-[20px]">send</span>
              )}
              {isLoading ? 'Sharing...' : 'Share Document'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ShareModal;
