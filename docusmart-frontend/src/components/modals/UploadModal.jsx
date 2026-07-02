import React, { useState } from 'react';
import api from '../../api/axios';

const UploadModal = ({ isOpen, onClose, onUpload }) => {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', file.name);

    try {
      const response = await api.post('/documents', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        },
      });

      if (response.data.status === 'success') {
        setTimeout(() => {
          setIsUploading(false);
          setUploadProgress(0);
          onUpload(response.data.data);
          setFile(null);
          onClose();
        }, 500);
      }
    } catch (error) {
      console.error('Upload failed:', error);
      setIsUploading(false);
      alert(error.response?.data?.message || 'Failed to upload document');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl overflow-hidden animate-fade-up">
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <h2 className="text-lg font-semibold text-slate-900">Upload Document</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-6">
          <div 
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${file ? 'border-indigo-600 bg-indigo-50' : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'}`}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => document.getElementById('file-upload').click()}
          >
            <input 
              id="file-upload" 
              type="file" 
              className="hidden" 
              onChange={handleFileChange} 
            />
            
            {file ? (
              <div className="flex flex-col items-center">
                <span className="material-symbols-outlined text-4xl text-indigo-600 mb-2">description</span>
                <p className="font-medium text-slate-900 truncate max-w-xs">{file.name}</p>
                <p className="text-xs text-slate-500 mt-1">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                <button 
                  onClick={(e) => { e.stopPropagation(); setFile(null); }}
                  className="mt-4 text-xs font-medium text-red-600 hover:text-red-700 bg-red-50 px-3 py-1.5 rounded-md transition-colors"
                >
                  Remove file
                </button>
              </div>
            ) : (
              <>
                <span className="material-symbols-outlined text-4xl text-slate-400 mb-3">cloud_upload</span>
                <p className="text-sm font-medium text-slate-900 mb-1">Click to upload or drag and drop</p>
                <p className="text-xs text-slate-500">SVG, PNG, JPG, PDF or DOCX (max. 50MB)</p>
              </>
            )}
          </div>

          {isUploading && (
            <div className="mt-6 space-y-2">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-slate-700">Uploading...</span>
                <span className="text-indigo-600">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-indigo-600 h-full transition-all duration-200"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          <div className="mt-6 flex justify-end gap-3">
            <button 
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              disabled={isUploading}
            >
              Cancel
            </button>
            <button 
              onClick={handleSubmit}
              disabled={!file || isUploading}
              className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors shadow-sm flex items-center gap-2
                ${(!file || isUploading) ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
            >
              {isUploading ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                  Processing...
                </>
              ) : (
                'Upload File'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadModal;
