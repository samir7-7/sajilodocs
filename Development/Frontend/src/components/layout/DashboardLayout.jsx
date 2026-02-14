import React from 'react';
import Sidebar from './Sidebar';
import { Search, Bell, User as UserIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const DashboardLayout = ({ children }) => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-white">
      <Sidebar />
      <div className="lg:pl-60">
        {/* Top Header */}
        <header className="h-16 border-b border-slate-100 bg-white sticky top-0 z-30 flex items-center justify-between px-8">
          <div className="flex-1 max-w-xl hidden sm:block">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#0061FF] transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="Search files, folders, and more..."
                className="w-full bg-slate-50 border-transparent focus:bg-white focus:ring-1 focus:ring-blue-500/20 py-2 pl-10 pr-4 rounded-full text-sm transition-all outline-none"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-4 ml-auto">
            <button className="p-2 text-slate-500 hover:bg-slate-50 rounded-full transition-colors relative">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            
            <div className="flex items-center gap-3 pl-4 border-l border-slate-100">
              <div className="text-right hidden md:block">
                <p className="text-sm font-semibold text-slate-900">{user?.first_name || user?.username}</p>
                <p className="text-[11px] text-slate-500 font-medium">Free Plan</p>
              </div>
              <div className="h-9 w-9 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 border border-slate-200 overflow-hidden">
                {user?.profile_pic ? (
                  <img src={user.profile_pic} alt="profile" className="w-full h-full object-cover" />
                ) : (
                  <UserIcon size={18} />
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-white">
          <div className="p-8 max-w-[1600px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
