import React, { useState, useEffect } from 'react';
import api from '../../api/axios';

const Profile = () => {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('docusmart_user') || '{}'));
  
  // Profile Form State
  const [name, setName] = useState(user.name || '');
  const [email, setEmail] = useState(user.email || '');
  const [profileMsg, setProfileMsg] = useState({ type: '', text: '' });
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState({ type: '', text: '' });
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    setProfileMsg({ type: '', text: '' });

    try {
      const response = await api.put('/auth/profile', { name, email });
      if (response.data.status === 'success') {
        const updatedUser = response.data.data;
        setUser(updatedUser);
        localStorage.setItem('docusmart_user', JSON.stringify(updatedUser));
        setProfileMsg({ type: 'success', text: 'Profile updated successfully!' });
      }
    } catch (error) {
      setProfileMsg({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to update profile.' 
      });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setIsUpdatingPassword(true);
    setPasswordMsg({ type: '', text: '' });

    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'New passwords do not match.' });
      setIsUpdatingPassword(false);
      return;
    }

    try {
      const response = await api.put('/auth/password', { 
        current_password: currentPassword,
        new_password: newPassword,
        new_password_confirmation: confirmPassword
      });
      
      if (response.data.status === 'success') {
        setPasswordMsg({ type: 'success', text: 'Password changed successfully!' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (error) {
      setPasswordMsg({ 
        type: 'error', 
        text: error.response?.data?.message || error.response?.data?.errors?.current_password?.[0] || 'Failed to change password.' 
      });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-800">My Profile</h2>
        <p className="text-sm text-slate-500 mt-1">Manage your personal information and security settings.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Form */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-200">
            <h3 className="text-lg font-bold text-slate-800">Personal Information</h3>
          </div>
          <div className="p-6">
            {profileMsg.text && (
              <div className={`p-3 mb-4 rounded-lg text-sm ${profileMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                {profileMsg.text}
              </div>
            )}
            <form onSubmit={handleProfileSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all"
                  required
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all"
                  required
                />
              </div>
              <button 
                type="submit" 
                disabled={isUpdatingProfile}
                className="bg-indigo-600 text-white rounded-lg py-2 px-4 hover:bg-indigo-700 transition-colors shadow-sm font-medium text-sm disabled:opacity-50"
              >
                {isUpdatingProfile ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>

        {/* Password Form */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-200">
            <h3 className="text-lg font-bold text-slate-800">Change Password</h3>
          </div>
          <div className="p-6">
            {passwordMsg.text && (
              <div className={`p-3 mb-4 rounded-lg text-sm ${passwordMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                {passwordMsg.text}
              </div>
            )}
            <form onSubmit={handlePasswordSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">Current Password</label>
                <input 
                  type="password" 
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
                <input 
                  type="password" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all"
                  required
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-1">Confirm New Password</label>
                <input 
                  type="password" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all"
                  required
                />
              </div>
              <button 
                type="submit" 
                disabled={isUpdatingPassword}
                className="bg-slate-800 text-white rounded-lg py-2 px-4 hover:bg-slate-900 transition-colors shadow-sm font-medium text-sm disabled:opacity-50"
              >
                {isUpdatingPassword ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
