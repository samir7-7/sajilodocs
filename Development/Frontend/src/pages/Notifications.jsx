import React, { useState } from 'react';
import { Bell, Calendar, FileText, AlertCircle, Share2, Check } from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { Button } from '../components/common/Button';

const Notifications = () => {
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'expiry',
      title: 'Passport expires in 30 days',
      message: 'Your passport is set to expire on August 15, 2024. Plan your renewal soon.',
      time: '2 hours ago',
      read: false,
      icon: Calendar,
      color: 'text-orange-500 bg-orange-50',
    },
    {
      id: 2,
      type: 'translation',
      title: 'Translation is complete',
      message: "Your translation for 'Japanese_Lease_Agreement.pdf' is ready for review.",
      time: 'Yesterday',
      read: false,
      icon: FileText,
      color: 'text-blue-500 bg-blue-50',
    },
    {
      id: 3,
      type: 'alert',
      title: "Contract 'MSA-ClientX' has expired",
      message: 'The Master Service Agreement with ClientX expired on July 10, 2024.',
      time: '5 days ago',
      read: true,
      icon: AlertCircle,
      color: 'text-red-500 bg-red-50',
    },
    {
      id: 4,
      type: 'share',
      title: "'Q3-Financials.docx' shared with you",
      message: "Jane Doe has shared a document with you. It has been added to your 'Shared with Me' folder.",
      time: 'July 8, 2024',
      read: true,
      icon: Share2,
      color: 'text-blue-500 bg-blue-50',
    },
  ]);

  const markAsRead = (id) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Main Notifications List */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Notifications & Reminders</h1>
            <Button variant="ghost" size="sm" onClick={markAllAsRead}>
              Mark all as read
            </Button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="border-b border-gray-200 px-6 py-4 flex items-center gap-4">
              <button className="text-blue-600 font-medium border-b-2 border-blue-600 pb-4 -mb-4.5">All Notifications</button>
              <button className="text-gray-500 font-medium pb-4 -mb-4.5 hover:text-gray-700">Expiry Reminders</button>
            </div>
            
            <div className="divide-y divide-gray-100">
              {notifications.map((notification) => (
                <div 
                  key={notification.id} 
                  className={`p-6 flex gap-4 hover:bg-gray-50 transition-colors ${!notification.read ? 'bg-blue-50/30' : ''}`}
                >
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${notification.color}`}>
                    <notification.icon size={20} />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h3 className={`font-semibold text-gray-900 ${!notification.read ? 'text-blue-900' : ''}`}>
                        {notification.title}
                      </h3>
                      {!notification.read && (
                        <button 
                          onClick={() => markAsRead(notification.id)}
                          className="h-2 w-2 rounded-full bg-blue-600 hover:scale-150 transition-transform"
                          title="Mark as read"
                        />
                      )}
                    </div>
                    <p className="text-gray-600 mt-1 text-sm">{notification.message}</p>
                    <p className="text-gray-400 mt-2 text-xs">{notification.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Settings */}
        <div className="w-full lg:w-80">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="font-bold text-gray-900 mb-4">Reminder Settings</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Default Expiry Alerts</label>
                <select className="w-full rounded-md border border-gray-300 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>Remind me 90, 60, 30 days before</option>
                  <option>Remind me 30 days before</option>
                  <option>Remind me 7 days before</option>
                </select>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">In-App Notification Preferences</h3>
                <div className="space-y-3">
                  {[
                    { label: 'Document Shared With Me', checked: true },
                    { label: 'New Document Uploaded', checked: false },
                    { label: 'Translation Complete', checked: true },
                    { label: 'OCR Scan Finished', checked: true },
                  ].map((pref, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{pref.label}</span>
                      <div className={`w-10 h-6 rounded-full relative cursor-pointer transition-colors ${pref.checked ? 'bg-blue-600' : 'bg-gray-200'}`}>
                        <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${pref.checked ? 'translate-x-4' : ''}`} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Button className="w-full">Save Changes</Button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Notifications;
