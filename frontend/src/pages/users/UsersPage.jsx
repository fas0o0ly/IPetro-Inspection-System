// src/pages/users/UsersPage.jsx

import { useState } from 'react';
import { Users, Plus, UserCog } from 'lucide-react';
import UserList from '../../components/users/UserList';
import UserForm from '../../components/users/UserForm';
import PasswordResetModal from '../../components/users/PasswordResetModal';
import { useAuth } from '../../context/AuthContext';

const UsersPage = () => {
  const { isAdmin } = useAuth();
  const [showUserForm, setShowUserForm] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleEdit = (user) => {
    setSelectedUser(user);
    setShowUserForm(true);
  };

  const handleResetPassword = (user) => {
    setSelectedUser(user);
    setShowPasswordReset(true);
  };

  const handleSuccess = () => {
    setRefreshKey(prev => prev + 1);
  };

  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg border border-neutral-200 p-12 text-center">
          <UserCog className="w-16 h-16 text-neutral-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-neutral-900 mb-2">Admin Access Required</h3>
          <p className="text-neutral-600">You don't have permission to access user management.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">User Management</h1>
          <p className="text-neutral-600">Manage system users and their permissions</p>
        </div>
        <button
          onClick={() => {
            setSelectedUser(null);
            setShowUserForm(true);
          }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add New User
        </button>
      </div>

      {/* User List */}
      <UserList
        key={refreshKey}
        onEdit={handleEdit}
        onResetPassword={handleResetPassword}
      />

      {/* Modals */}
      <UserForm
        isOpen={showUserForm}
        onClose={() => {
          setShowUserForm(false);
          setSelectedUser(null);
        }}
        user={selectedUser}
        onSuccess={handleSuccess}
      />

      <PasswordResetModal
        isOpen={showPasswordReset}
        onClose={() => {
          setShowPasswordReset(false);
          setSelectedUser(null);
        }}
        user={selectedUser}
        onSuccess={handleSuccess}
      />
    </div>
  );
};

export default UsersPage;