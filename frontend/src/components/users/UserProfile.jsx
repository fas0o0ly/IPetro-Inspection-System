// src/components/users/UserProfile.jsx

import { useState, useEffect } from 'react';
import { User, Mail, Phone, Building, Shield, Calendar, Save } from 'lucide-react';
import { userService } from '../../services/userService';
import { formatDateForDisplay } from '../../utils/dateUtils';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const UserProfile = () => {
  const { user: currentUser, refreshUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  
  const [formData, setFormData] = useState({
  username: '',
  name: '',
  email: '',
  department: '',
  certification_id: ''
});

  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchProfile();
  }, [currentUser]);

 const fetchProfile = async () => {
  if (!currentUser?.user_id) return;

  try {
    setLoading(true);
    const response = await userService.getById(currentUser.user_id);
    setProfile(response.data);
    setFormData({
      username: response.data.username || '',
      name: response.data.name || '',
      email: response.data.email || '',
      department: response.data.department || '',
      certification_id: response.data.certification_id || ''
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    toast.error('Failed to load profile');
  } finally {
    setLoading(false);
  }
};

  const handleUpdateProfile = async (e) => {
    e.preventDefault();

    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setLoading(true);
      await userService.update(currentUser.user_id, formData);
      toast.success('Profile updated successfully');
      setEditing(false);
      fetchProfile();
      if (refreshUser) refreshUser();
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Failed to update profile';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !profile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg border border-neutral-200 p-12 text-center">
          <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-neutral-900 mb-2">My Profile</h1>
        <p className="text-neutral-600">View and manage your account information</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border border-neutral-200 p-6">
            <div className="text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-3xl font-bold">
                  {profile?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-1">
                {profile?.name}
              </h3>
              <p className="text-sm text-neutral-600 mb-4">{profile?.email}</p>
              
              <div className="flex items-center justify-center gap-2 mb-4">
                <Shield className="w-4 h-4 text-primary-600" />
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800">
                  {profile?.role}
                </span>
              </div>

              {profile?.username && (
  <div className="text-sm text-neutral-600 mb-2">
    <span className="font-medium">Username:</span> {profile.username}
  </div>
)}

{profile?.certification_id && (
  <div className="text-sm text-neutral-600 mb-4">
    <span className="font-medium">Certification:</span> {profile.certification_id}
  </div>
)}

              {profile?.department && (
                <div className="text-sm text-neutral-600 mb-4">
                  <span className="font-medium">Department:</span> {profile.department}
                </div>
              )}

              <div className="pt-4 border-t border-neutral-200">
                <div className="flex items-center justify-center gap-2 text-xs text-neutral-500">
                  <Calendar className="w-4 h-4" />
                  <span>Joined {formatDateForDisplay(profile?.created_at)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Details */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg border border-neutral-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-neutral-900">Profile Information</h3>
              {!editing && (
                <button
                  onClick={() => setEditing(true)}
                  className="btn-primary px-4 py-2"
                >
                  Edit Profile
                </button>
              )}
            </div>

            {editing ? (
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                {/* Username - Read Only */}
    <div>
      <label className="block text-sm font-medium text-neutral-700 mb-2">
        Username (Cannot be changed)
      </label>
      <input
        type="text"
        value={formData.username}
        disabled
        className="w-full px-4 py-2 border border-neutral-300 rounded-lg bg-neutral-100 cursor-not-allowed"
      />
    </div>

    {/* Name */}
    <div>
      <label className="block text-sm font-medium text-neutral-700 mb-2">
        Full Name *
      </label>
      <input
        type="text"
        value={formData.name}
        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
        className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
      />
      {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
    </div>

    {/* Email - Read Only for non-admin */}
    <div>
      <label className="block text-sm font-medium text-neutral-700 mb-2">
        Email Address (Admin only)
      </label>
      <input
        type="email"
        value={formData.email}
        disabled
        className="w-full px-4 py-2 border border-neutral-300 rounded-lg bg-neutral-100 cursor-not-allowed"
      />
    </div>

    {/* Department */}
    <div>
      <label className="block text-sm font-medium text-neutral-700 mb-2">
        Department
      </label>
      <input
        type="text"
        value={formData.department}
        onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
        className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
      />
    </div>

    {/* Certification ID */}
    <div>
      <label className="block text-sm font-medium text-neutral-700 mb-2">
        Certification ID
      </label>
      <input
        type="text"
        value={formData.certification_id}
        onChange={(e) => setFormData(prev => ({ ...prev, certification_id: e.target.value }))}
        className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
      />
    </div>

    {/* Buttons */}
    <div className="flex justify-end gap-3 pt-4">
      <button
        type="button"
        onClick={() => {
          setEditing(false);
          setFormData({
            username: profile?.username || '',
            name: profile?.name || '',
            email: profile?.email || '',
            department: profile?.department || '',
            certification_id: profile?.certification_id || ''
          });
          setErrors({});
        }}
        className="px-6 py-2.5 border border-neutral-300 text-neutral-700 font-medium rounded-lg hover:bg-neutral-50"
      >
        Cancel
      </button>
      <button
        type="submit"
        disabled={loading}
        className="btn-primary px-6 py-2.5 flex items-center gap-2"
      >
        <Save className="w-5 h-5" />
        {loading ? 'Saving...' : 'Save Changes'}
      </button>
    </div>
  </form>
            ) : (
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-neutral-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-neutral-600">Full Name</p>
                    <p className="font-medium text-neutral-900">{profile?.name}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-neutral-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-neutral-600">Email Address</p>
                    <p className="font-medium text-neutral-900">{profile?.email}</p>
                  </div>
                </div>
                {profile?.employee_id && (
                  <div className="flex items-start gap-3">
                    <User className="w-5 h-5 text-neutral-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-neutral-600">Employee ID</p>
                      <p className="font-medium text-neutral-900">{profile.employee_id}</p>
                    </div>
                  </div>
                )}
                {profile?.phone && (
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-neutral-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-neutral-600">Phone Number</p>
                      <p className="font-medium text-neutral-900">{profile.phone}</p>
                    </div>
                  </div>
                )}
                {profile?.department && (
                  <div className="flex items-start gap-3">
                    <Building className="w-5 h-5 text-neutral-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-neutral-600">Department</p>
                      <p className="font-medium text-neutral-900">{profile.department}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;