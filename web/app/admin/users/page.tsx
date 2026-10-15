"use client";
import React, { useState, useEffect } from 'react';

export default function UserManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // States para sa Add User Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', password: '', schoolId: '', role: 'STUDENT'
  });

  // States para sa Edit Role Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [newRole, setNewRole] = useState('');

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/users`, {
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      if (data.users) {
        setUsers(data.users);
      }
    } catch (error) {
      console.error("Failed to fetch users", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    document.cookie = "clinic_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    window.location.href = "/login";
  };

  // --- ADD NEW USER FUNCTION ---
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        setIsModalOpen(false); 
        fetchUsers(); 
        setFormData({firstName: '', lastName: '', email: '', password: '', schoolId: '', role: 'STUDENT'}); 
      } else {
        const data = await res.json();
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error(error);
      alert("Failed to create user. Check console for details.");
    } finally {
      setSubmitLoading(false);
    }
  };

  // --- EDIT ROLE FUNCTIONS ---
  const openEditModal = (user: any) => {
    setSelectedUser(user);
    setNewRole(user.role || 'STUDENT');
    setIsEditModalOpen(true);
  };

  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/users/${selectedUser.id}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      });

      if (res.ok) {
        setIsEditModalOpen(false);
        fetchUsers(); // I-refresh ang table pagkatapos mag-edit
      } else {
        alert("Failed to update role");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSubmitLoading(false);
    }
  };

  // --- DELETE USER FUNCTION ---
  const handleDeleteUser = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to completely delete ${name}? This action cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/users/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchUsers(); // I-refresh ang table pagkatapos mag-delete
      } else {
        alert("Failed to delete user");
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen relative text-gray-900">
      <div className="max-w-6xl mx-auto">
        
        <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-lg shadow border border-gray-200">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">User Management</h1>
            <p className="text-sm text-gray-500">Administrator Dashboard</p>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 transition font-medium"
            >
              + Add New User
            </button>
            <button 
              onClick={handleLogout}
              className="bg-red-50 text-red-600 px-4 py-2 rounded shadow hover:bg-red-100 transition font-medium border border-red-200"
            >
              Logout
            </button>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Name & ID</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Email</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Role</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan={4} className="px-6 py-4 text-center text-gray-500">Loading users...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-4 text-center text-gray-500">No users found.</td></tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-900">{user.firstName || 'N/A'} {user.lastName || ''}</div>
                      <div className="text-xs text-gray-500 mt-1">ID: {user.schoolId || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{user.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full ${
                        user.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' :
                        user.role === 'NURSE' ? 'bg-blue-100 text-blue-800' : 
                        user.role === 'HEAD_TEACHER' ? 'bg-orange-100 text-orange-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {user.role || 'STUDENT'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {/* 👇 PINA-FUNCTION NA ANG MGA BUTTONS */}
                      <button 
                        onClick={() => openEditModal(user)} 
                        className="text-blue-600 hover:text-blue-900 mr-4 font-bold bg-blue-50 px-3 py-1 rounded transition"
                      >
                        Edit Role
                      </button>
                      <button 
                        onClick={() => handleDeleteUser(user.id, user.firstName || 'User')} 
                        className="text-red-600 hover:text-red-900 font-bold bg-red-50 px-3 py-1 rounded transition"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* ========================================== */}
      {/* 1. ADD NEW USER MODAL (FIXED STYLES) */}
      {/* ========================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-300">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-bold text-gray-800">Add New User</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-800 text-2xl font-bold">&times;</button>
            </div>
            
            <form onSubmit={handleCreateUser} className="p-6 space-y-5 bg-white">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">First Name</label>
                  <input type="text" required value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} 
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Last Name</label>
                  <input type="text" required value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} 
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">School ID</label>
                  <input type="text" required value={formData.schoolId} onChange={e => setFormData({...formData, schoolId: e.target.value})} 
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Role</label>
                  <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} 
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none font-medium">
                    <option value="STUDENT">Student</option>
                    <option value="NURSE">Nurse</option>
                    <option value="HEAD_TEACHER">Head Teacher</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Email Address</label>
                <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} 
                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none" />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Password</label>
                <input type="password" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} 
                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none" />
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg font-bold hover:bg-gray-300 transition border border-gray-300">Cancel</button>
                <button type="submit" disabled={submitLoading} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition disabled:opacity-50">
                  {submitLoading ? 'Saving...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* 2. EDIT ROLE MODAL */}
      {/* ========================================== */}
      {isEditModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden border border-gray-300">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-gray-800">Edit User Role</h3>
                <p className="text-xs text-gray-500 mt-1">Changing role for: <span className="font-bold text-gray-700">{selectedUser.firstName} {selectedUser.lastName}</span></p>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} className="text-gray-500 hover:text-gray-800 text-2xl font-bold">&times;</button>
            </div>
            
            <form onSubmit={handleUpdateRole} className="p-6 bg-white">
              <label className="block text-sm font-bold text-gray-700 mb-2">Assign New Role:</label>
              <select 
                value={newRole} 
                onChange={e => setNewRole(e.target.value)} 
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none font-bold"
              >
                <option value="STUDENT">Student</option>
                <option value="NURSE">Nurse</option>
                <option value="HEAD_TEACHER">Head Teacher</option>
                <option value="ADMIN">Admin</option>
              </select>

              <div className="mt-6 flex gap-3">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg font-bold hover:bg-gray-300 transition border border-gray-300">Cancel</button>
                <button type="submit" disabled={submitLoading} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition">
                  {submitLoading ? 'Updating...' : 'Save Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}