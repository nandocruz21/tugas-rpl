import React, { useState, useEffect } from 'react';
import api from '../../api/axios';

const UserModal = ({ isOpen, onClose, onSave, user = null }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user',
    is_active: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        password: '',
        role: user.roles && user.roles.length > 0 ? user.roles[0].name : 'user',
        is_active: user.is_active
      });
    } else {
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'user',
        is_active: true
      });
    }
    setError(null);
  }, [user, isOpen]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (user) {
        // Edit Mode
        const dataToSubmit = { ...formData };
        if (!dataToSubmit.password) {
          delete dataToSubmit.password;
        }
        await api.put(`/users/${user.id}`, dataToSubmit);
      } else {
        // Create Mode
        await api.post('/users', formData);
      }
      onSave();
      onClose();
    } catch (err) {
      console.error('Failed to save user:', err);
      setError(err.response?.data?.message || 'An error occurred while saving.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
        <div className="fixed inset-0 bg-slate-900/50 transition-opacity" onClick={onClose} />
        
        <div className="relative transform overflow-hidden rounded-xl bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
          <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
            <div className="flex items-start justify-between mb-5">
              <h3 className="text-xl font-bold text-slate-900">
                {user ? 'Edit User' : 'Add New User'}
              </h3>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-500">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <form id="user-form" onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="e.g. Budi Santoso"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="e.g. budi@docusmart.local"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Password {user && <span className="text-slate-400 font-normal">(Leave blank to keep current)</span>}
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required={!user}
                  minLength="8"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder={user ? "Enter new password (optional)" : "Minimum 8 characters"}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                >
                  <option value="user">User (Normal Access)</option>
                  <option value="admin">Admin (Full Access)</option>
                </select>
              </div>

              {user && (
                <div className="flex items-center mt-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleChange}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded"
                  />
                  <label htmlFor="is_active" className="ml-2 block text-sm text-slate-700">
                    Account is active
                  </label>
                </div>
              )}
            </form>
          </div>
          
          <div className="bg-slate-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
            <button
              type="submit"
              form="user-form"
              disabled={isSubmitting}
              className="inline-flex w-full justify-center rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 sm:ml-3 sm:w-auto disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save User'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="mt-3 inline-flex w-full justify-center rounded-lg bg-white px-5 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 sm:mt-0 sm:w-auto disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserModal;
