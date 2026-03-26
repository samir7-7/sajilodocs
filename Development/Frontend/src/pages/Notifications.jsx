import React, { useState, useEffect } from 'react';
import { Bell, Calendar, FileText, AlertCircle, Share2, Check } from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { Button } from '../components/common/Button';
import { notificationAPI } from '../utils/api';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await notificationAPI.list();
      setNotifications(response.data);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'SHARE':
        return { icon: Share2, color: 'text-[#4f46e5] bg-indigo-50' };
      case 'EXPIRY':
        return { icon: Calendar, color: 'text-orange-500 bg-orange-50' };
      case 'SUCCESS':
        return { icon: Check, color: 'text-emerald-500 bg-emerald-50' };
      case 'ERROR':
        return { icon: AlertCircle, color: 'text-rose-500 bg-rose-50' };
      case 'INFO':
        return { icon: Bell, color: 'text-blue-500 bg-blue-50' };
      case 'SYSTEM':
        return { icon: AlertCircle, color: 'text-slate-500 bg-slate-50' };
      default:
        return { icon: Bell, color: 'text-[#4f46e5] bg-indigo-50' };
    }
  };

  const markAsRead = async (id) => {
    try {
      await notificationAPI.markRead(id);
      setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationAPI.markAllRead();
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const formatTime = (dateString) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInSeconds = Math.floor((now - date) / 1000);

      if (diffInSeconds < 60) return 'just now';
      if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
      if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
      if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
      
      return date.toLocaleDateString();
    } catch (e) {
      return dateString;
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Main Notifications List */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight font-outfit">Notifications & Reminders</h1>
            <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-[#4f46e5] font-bold hover:bg-indigo-50">
              Mark all as read
            </Button>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="border-b border-slate-100 px-8 py-4 flex items-center gap-6">
              <button className="text-[#4f46e5] font-bold border-b-2 border-[#4f46e5] pb-4 -mb-4 px-2 uppercase text-[10px] tracking-widest">All Notifications</button>
              <button className="text-slate-400 font-bold pb-4 -mb-4 px-2 hover:text-[#4f46e5] transition-colors uppercase text-[10px] tracking-widest">Expiry Reminders</button>
            </div>
            
            <div className="divide-y divide-gray-100">
              {loading ? (
                <div className="p-8 text-center text-gray-500">Loading notifications...</div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500 whitespace-pre-wrap">
                  <Bell size={48} className="mx-auto mb-4 text-gray-300" />
                  <p>No notifications yet.</p>
                </div>
              ) : (
                notifications.map((notification) => {
                  const { icon: Icon, color } = getNotificationIcon(notification.type);
                  return (
                    <div 
                      key={notification.id} 
                      className={`p-8 flex gap-6 hover:bg-slate-50/50 transition-all ${!notification.is_read ? 'bg-indigo-50/30' : ''}`}
                    >
                      <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${color}`}>
                        <Icon size={24} />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <h3 className={`font-bold text-slate-800 ${!notification.is_read ? 'text-[#4f46e5]' : ''}`}>
                            {notification.title}
                          </h3>
                          {!notification.is_read && (
                            <button 
                              onClick={() => markAsRead(notification.id)}
                              className="h-2.5 w-2.5 rounded-full bg-[#4f46e5] hover:scale-125 transition-transform shadow-lg shadow-indigo-200"
                              title="Mark as read"
                            />
                          )}
                        </div>
                        <p className="text-slate-500 mt-1.5 text-sm leading-relaxed">{notification.message}</p>
                        <p className="text-slate-400 mt-3 text-[10px] font-bold uppercase tracking-widest">{formatTime(notification.created_at)}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Settings */}
        <div className="w-full lg:w-80">
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 sticky top-24">
            <h2 className="font-bold text-slate-900 mb-2 font-outfit">Reminder Settings</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-6">Manage Alerts</p>
            
            <div className="space-y-8">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Default Expiry Alerts</label>
                <select className="w-full rounded-xl border border-slate-100 bg-slate-50 py-3 px-4 text-sm font-medium text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/10 focus:bg-white transition-all">
                  <option>Remind me 90, 60, 30 days before</option>
                  <option>Remind me 30 days before</option>
                  <option>Remind me 7 days before</option>
                </select>
              </div>

              <div>
                <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-4">Notification Preferences</h3>
                <div className="space-y-4">
                  {[
                    { label: 'Document Shared', checked: true },
                    { label: 'New Uploads', checked: false },
                    { label: 'OCR scan complete', checked: true },
                  ].map((pref, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-600">{pref.label}</span>
                      <div className={`w-9 h-5 rounded-full relative cursor-pointer transition-all ${pref.checked ? 'bg-[#4f46e5]' : 'bg-slate-200'}`}>
                        <div className={`absolute top-1 left-1 bg-white w-3 h-3 rounded-full transition-transform ${pref.checked ? 'translate-x-4' : ''}`} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Button className="w-full h-11 font-bold shadow-lg shadow-indigo-100/50">Save Settings</Button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Notifications;
