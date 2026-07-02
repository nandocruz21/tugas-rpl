import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';

const Login = () => {
  const [email, setEmail] = useState('admin@docusmart.local');
  const [password, setPassword] = useState('Admin@123!');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await api.post('/auth/login', {
        email,
        password
      });
      
      if (response.data.status === 'success') {
        localStorage.setItem('docusmart_token', response.data.data.token);
        localStorage.setItem('docusmart_user', JSON.stringify(response.data.data.user));
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <header className="w-full px-4 sm:px-8 py-5 flex justify-center sm:justify-start">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined fill-icon text-indigo-600 text-3xl">description</span>
          <span className="text-2xl font-bold text-indigo-600 tracking-tight">DocuSmart</span>
        </div>
      </header>

      <main className="w-full flex-1 flex items-center justify-center px-4 py-8">
        <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 md:p-10 w-full max-w-[440px] shadow-sm hover:shadow-md transition-shadow duration-300">
          <div className="text-center mb-6 sm:mb-8">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined fill-icon text-indigo-600 text-2xl sm:text-3xl">lock</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-1">Welcome back</h1>
            <p className="text-xs sm:text-sm text-slate-500">Secure enterprise access to your workspace</p>
          </div>

          {error && (
            <div className="mb-5 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-200">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 sm:space-y-5">
            <div className="space-y-1.5">
              <label className="block text-[10px] sm:text-xs text-slate-600 font-semibold tracking-wider uppercase" htmlFor="email">Email Address</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg sm:text-xl">mail</span>
                <input 
                  id="email" 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none transition-all" 
                  placeholder="name@company.com" 
                  required 
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] sm:text-xs text-slate-600 font-semibold tracking-wider uppercase" htmlFor="password">Password</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg sm:text-xl">lock</span>
                <input 
                  id="password" 
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none transition-all" 
                  placeholder="••••••••" 
                  required 
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <span className="material-symbols-outlined text-lg sm:text-xl">{showPassword ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 sm:pt-0">
              <label className="flex items-center gap-2 cursor-pointer">
                <input className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600" type="checkbox" />
                <span className="text-xs sm:text-sm text-slate-600">Remember me</span>
              </label>
              <button type="button" className="text-xs text-indigo-600 hover:underline font-semibold">Forgot Password?</button>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-indigo-600 text-white py-3 sm:py-3.5 rounded-lg text-sm sm:text-base font-semibold hover:bg-indigo-700 transition-all duration-200 active:scale-[0.98] shadow-sm flex items-center justify-center gap-2 disabled:bg-indigo-400 disabled:cursor-not-allowed mt-2"
            >
              {isLoading ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-lg sm:text-xl">progress_activity</span>
                  Signing in...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-lg sm:text-xl">login</span>
                  Sign In to DocuSmart
                </>
              )}
            </button>
          </form>


        </div>
      </main>

      <footer className="w-full border-t border-slate-200 bg-slate-50 mt-auto">
        <div className="flex flex-col md:flex-row justify-between items-center w-full px-4 sm:px-8 py-6 max-w-7xl mx-auto gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 text-center sm:text-left">
            <span className="font-bold text-indigo-600 hidden sm:inline">DocuSmart</span>
            <span className="text-[10px] sm:text-xs text-slate-500">© 2026 DocuSmart Enterprise Solutions. All rights reserved.</span>
          </div>
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
            <a href="#" className="text-[10px] sm:text-xs text-slate-500 hover:text-indigo-600 transition-colors">Privacy Policy</a>
            <a href="#" className="text-[10px] sm:text-xs text-slate-500 hover:text-indigo-600 transition-colors">Terms of Service</a>
            <a href="#" className="text-[10px] sm:text-xs text-slate-500 hover:text-indigo-600 transition-colors">Security</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Login;
