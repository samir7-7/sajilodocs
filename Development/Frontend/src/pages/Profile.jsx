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
        <h1 className="text-3xl font-bold text-slate-900 mb-8 tracking-tight">Profile Settings</h1>

        <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-10">
            <form onSubmit={handleSubmit} className="space-y-10">
              {/* Avatar Section */}
              <div className="flex flex-col items-center sm:flex-row sm:items-start gap-8">
                <div className="relative group">
                  <div className="h-28 w-28 rounded-full overflow-hidden bg-slate-50 ring-4 ring-white shadow-md transition-all duration-300 group-hover:ring-blue-50">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Profile" className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-slate-300">
                        <User size={48} />
                      </div>
                    )}
                  </div>
                  <label className="absolute bottom-1 right-1 p-2 bg-[#0061FF] text-white rounded-full cursor-pointer hover:bg-[#0052D9] transition-all shadow-lg hover:scale-110">
                    <Camera size={16} />
                    <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
                  </label>
                </div>
                <div className="flex-1 text-center sm:text-left pt-2">
                  <h3 className="text-xl font-bold text-slate-900">Profile Picture</h3>
                  <p className="text-sm text-slate-500 mt-1 font-medium">
                    Upload a high-quality avatar for your workspace.
                  </p>
                </div>
              </div>

              <div className="grid gap-8">
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
                  className="bg-slate-50 text-slate-400 cursor-not-allowed border-slate-100"
                />

                <div className="space-y-2">
                  <label className="block text-sm font-bold text-slate-900 ml-1">
                    Bio
                  </label>
                  <textarea
                    name="bio"
                    rows={4}
                    className="flex w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-[#0061FF] transition-all"
                    placeholder="Tell us a little about yourself..."
                    value={formData.bio}
                    onChange={handleChange}
                  />
                  <p className="ml-1 text-[11px] text-slate-400 font-medium">
                    Brief description for your profile.
                  </p>
                </div>
              </div>

              {message.text && (
                <div className={cn(
                  "p-4 rounded-xl text-sm font-bold text-center animate-in fade-in slide-in-from-top-2",
                  message.type === 'success' ? 'bg-blue-50 text-[#0061FF] border border-blue-100' : 'bg-red-50 text-red-600 border border-red-100'
                )}>
                  {message.text}
                </div>
              )}

              <div className="flex justify-end pt-6 border-t border-slate-50">
                <Button type="submit" isLoading={isSaving} className="h-12 px-8 rounded-xl font-bold shadow-blue-500/20">
                  <Save size={18} className="mr-2" />
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
