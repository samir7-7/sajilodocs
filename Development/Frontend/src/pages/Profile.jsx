import React, { useState, useEffect } from 'react';
import { User, Camera, Save } from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    email: '',
  });
  const [avatarPreview, setAvatarPreview] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        bio: user.bio || '',
        email: user.email || '',
      });
      setAvatarPreview(user.avatar || '');
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage({ type: '', text: '' });

    // Simulate API call
    setTimeout(() => {
      updateUser({
        name: formData.name,
        bio: formData.bio,
        avatar: avatarPreview,
      });
      setIsSaving(false);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    }, 1000);
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Profile Settings</h1>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Avatar Section */}
              <div className="flex flex-col items-center sm:flex-row sm:items-start gap-6">
                <div className="relative group">
                  <div className="h-24 w-24 rounded-full overflow-hidden bg-gray-100 ring-4 ring-white shadow-sm">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Profile" className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-gray-400">
                        <User size={40} />
                      </div>
                    )}
                  </div>
                  <label className="absolute bottom-0 right-0 p-1.5 bg-[#1D9621] text-white rounded-full cursor-pointer hover:bg-[#178a1c] transition-colors shadow-sm">
                    <Camera size={14} />
                    <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
                  </label>
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <h3 className="text-lg font-medium text-gray-900">Profile Picture</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Upload a new avatar. Recommended size: 400x400px.
                  </p>
                </div>
              </div>

              <div className="grid gap-6">
                <Input
                  label="Full Name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  icon={User}
                />

                <Input
                  label="Email Address"
                  value={formData.email}
                  disabled
                  className="bg-gray-50 text-gray-500 cursor-not-allowed"
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bio
                  </label>
                  <textarea
                    name="bio"
                    rows={4}
                    className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Tell us a little about yourself..."
                    value={formData.bio}
                    onChange={handleChange}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Brief description for your profile.
                  </p>
                </div>
              </div>

              {message.text && (
                <div className={`p-4 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  {message.text}
                </div>
              )}

              <div className="flex justify-end pt-4 border-t border-gray-100">
                <Button type="submit" isLoading={isSaving} className="gap-2">
                  <Save size={18} />
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Profile;
