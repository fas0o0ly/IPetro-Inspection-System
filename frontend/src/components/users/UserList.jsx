// src/components/users/UserList.jsx

import { useState, useEffect } from 'react';
import { Users, Search, Edit2, Trash2, Key, Shield, User as UserIcon } from 'lucide-react';
import { userService } from '../../services/userService';
import { formatDateForDisplay } from '../../utils/dateUtils';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const UserList = ({ onEdit, onResetPassword }) => {
  const { isAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await userService.getAll();
      setUsers(response.data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to delete user "${userName}"?`)) {
      return;
    }

    try {
      await userService.delete(userId);
      toast.success('User deleted successfully');
      fetchUsers();
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Failed to delete user';
      toast.error(errorMsg);
    }
  };

  const getRoleBadge = (role) => {
    const badges = {
      admin: 'bg-red-100 text-red-800',
      inspector: 'bg-blue-100 text-blue-800',
      reviewer: 'bg-purple-100 text-purple-800',
      viewer: 'bg-green-100 text-green-800'
    };
    return badges[role] || 'bg-neutral-100 text-neutral-800';
  };

  const getRoleIcon = (role) => {
    if (role === 'admin') return <Shield className="w-4 h-4" />;
    return <UserIcon className="w-4 h-4" />;
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.employee_id?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = filterRole === 'all' || user.role === filterRole;

    return matchesSearch && matchesRole;
  });

  if (!isAdmin) {
    return (
      <div className="bg-white rounded-lg border border-neutral-200 p-12 text-center">
        <Shield className="w-16 h-16 text-neutral-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-neutral-900 mb-2">Admin Access Required</h3>
        <p className="text-neutral-600">You don't have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-lg border border-neutral-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input
              type="text"
              placeholder="Search by name, email, or employee ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          {/* Role Filter */}
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="inspector">Inspector</option>
            <option value="reviewer">Reviewer</option>
            <option value="viewer">Viewer</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="bg-white rounded-lg border border-neutral-200 p-12 text-center">
          <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading users...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="bg-white rounded-lg border border-neutral-200 p-12 text-center">
          <Users className="w-16 h-16 text-neutral-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-neutral-900 mb-2">No users found</h3>
          <p className="text-neutral-600">
            {searchTerm ? 'Try adjusting your search or filters' : 'No users available'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
          <table className="min-w-full divide-y divide-neutral-200">
            <thead className="bg-neutral-50">
  <tr>
    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
      User
    </th>
    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
      Username
    </th>
    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
      Role
    </th>
    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
      Department
    </th>
    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
      Certification
    </th>
    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
      Status
    </th>
    <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
      Actions
    </th>
  </tr>
</thead>
<tbody className="bg-white divide-y divide-neutral-200">
  {filteredUsers.map((user) => (
    <tr key={user.user_id} className="hover:bg-neutral-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
            <span className="text-primary-600 font-semibold text-sm">
              {user.name?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="ml-3">
            <div className="text-sm font-medium text-neutral-900">{user.name}</div>
            <div className="text-sm text-neutral-500">{user.email}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
        {user.username || '-'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadge(user.role)}`}>
          {getRoleIcon(user.role)}
          {user.role}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
        {user.department || '-'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
        {user.certification_id || '-'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          user.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {user.active ? 'Active' : 'Inactive'}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => onEdit(user)}
            className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
            title="Edit User"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          {user.role !== 'admin' && (
            <button
              onClick={() => onResetPassword(user)}
              className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
              title="Reset Password"
            >
              <Key className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => handleDelete(user.user_id, user.name)}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Deactivate User"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  ))}
</tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default UserList;