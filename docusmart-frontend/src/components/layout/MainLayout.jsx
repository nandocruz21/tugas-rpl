import React, { useState } from 'react';
import { useNavigate, Outlet, Link, useLocation } from 'react-router-dom';
import UploadModal from '../modals/UploadModal';
import api from '../../api/axios';

const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const [searchValue, setSearchValue] = useState(new URLSearchParams(location.search).get('search') || '');

  React.useEffect(() => {
    setSearchValue(new URLSearchParams(location.search).get('search') || '');
  }, [location.search]);

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error', error);
    } finally {
      localStorage.removeItem('docusmart_token');
      localStorage.removeItem('docusmart_user');
      navigate('/');
    }
  };

  const user = JSON.parse(localStorage.getItem('docusmart_user') || '{}');
  const isAdmin = user.roles?.some(role => role.name === 'admin');

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden text-slate-900">
      {/* Sidebar Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed md:static inset-y-0 left-0 w-64 bg-white border-r border-slate-200 z-30 transform transition-transform duration-300 ease-in-out flex flex-col ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="h-16 flex items-center gap-2 px-6 border-b border-slate-200">
          <span className="material-symbols-outlined text-indigo-600 text-3xl">description</span>
          <span className="text-xl font-bold text-indigo-600 tracking-tight">DocuSmart</span>
        </div>

        <div className="p-4">
          <button 
            onClick={() => setIsUploadModalOpen(true)}
            className="w-full bg-indigo-600 text-white rounded-lg py-2.5 px-4 flex items-center justify-center gap-2 hover:bg-indigo-700 transition-colors shadow-sm font-medium"
          >
            <span className="material-symbols-outlined text-[20px]">upload</span>
            Upload Document
          </button>
        </div>

        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          <p className="px-3 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 mt-4">Menu</p>
          <Link to="/dashboard" className={`flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors ${location.pathname === '/dashboard' ? 'text-indigo-900 bg-indigo-50' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>
            <span className="material-symbols-outlined text-[20px]">home</span>
            Dashboard
          </Link>
          <Link to="/documents" className={`flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors ${location.pathname === '/documents' ? 'text-indigo-900 bg-indigo-50' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>
            <span className="material-symbols-outlined text-[20px]">folder</span>
            All Documents
          </Link>
          <Link to="/shared" className={`flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors ${location.pathname === '/shared' ? 'text-indigo-900 bg-indigo-50' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>
            <span className="material-symbols-outlined text-[20px]">group</span>
            Shared with me
          </Link>

          {isAdmin && (
            <>
              <p className="px-3 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 mt-6">Settings</p>
              <Link to="/users" className={`flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors ${location.pathname === '/users' ? 'text-indigo-900 bg-indigo-50' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>
                <span className="material-symbols-outlined text-[20px]">manage_accounts</span>
                User Management
              </Link>
              <Link to="/audit-trails" className={`flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors ${location.pathname === '/audit-trails' ? 'text-indigo-900 bg-indigo-50' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>
                <span className="material-symbols-outlined text-[20px]">history</span>
                Audit Trails
              </Link>
            </>
          )}
        </nav>

        <div className="p-4 border-t border-slate-200">
          <div className="flex items-center gap-3 px-2 py-2 group relative">
            <Link to="/profile" className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer">
              <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold uppercase shrink-0 hover:bg-indigo-200 transition-colors">
                {user.name ? user.name.substring(0, 2) : 'U'}
              </div>
              <div className="flex-1 min-w-0 hover:text-indigo-600 transition-colors">
                <p className="text-sm font-medium text-slate-900 truncate">{user.name || 'User'}</p>
                <p className="text-xs text-slate-500 truncate">{user.email || ''}</p>
              </div>
            </Link>
            <button onClick={handleLogout} className="text-slate-400 hover:text-red-600 transition-colors" title="Logout">
              <span className="material-symbols-outlined">logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 bg-white border-b border-slate-200">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="md:hidden text-slate-500 hover:text-slate-700"
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
            <h1 className="text-lg font-semibold text-slate-900 hidden sm:block">
              {location.pathname === '/dashboard' && 'Dashboard'}
              {location.pathname === '/profile' && 'My Profile'}
              {location.pathname === '/users' && 'User Management'}
              {location.pathname === '/audit-trails' && 'Audit Trails'}
            </h1>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4 flex-1 justify-end md:justify-end">
            <div className="relative flex-1 max-w-[200px] sm:max-w-xs md:w-64">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px] sm:text-[20px]">search</span>
              <input 
                type="text" 
                placeholder={`Search...`} 
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const currentPath = location.pathname;
                    if (searchValue.trim()) {
                      navigate(`${currentPath}?search=${encodeURIComponent(searchValue.trim())}`);
                    } else {
                      navigate(currentPath);
                    }
                  }
                }}
                className="w-full pl-8 sm:pl-9 pr-3 sm:pr-4 py-1.5 sm:py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all"
              />
            </div>
            <button className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors">
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>

      <UploadModal 
        isOpen={isUploadModalOpen} 
        onClose={() => setIsUploadModalOpen(false)} 
        onUpload={() => {
          // Ideally we emit an event or use context, but for now we can just reload if on dashboard
          if (location.pathname === '/dashboard') {
            window.location.reload();
          }
        }} 
      />
    </div>
  );
};

export default MainLayout;
