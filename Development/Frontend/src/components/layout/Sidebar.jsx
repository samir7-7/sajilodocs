import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FolderOpen, Bell, Share2, Settings, LogOut, HelpCircle, Menu, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../utils/cn';

const Sidebar = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { icon: LayoutDashboard, label: 'Home', path: '/dashboard' },
    { icon: FolderOpen, label: 'All Files', path: '/dashboard/documents' },
    { icon: Bell, label: 'Notifications', path: '/dashboard/notifications' },
    { icon: Share2, label: 'Shared', path: '/dashboard/sharing' },
    { icon: Settings, label: 'Settings', path: '/dashboard/settings' },
  ];

  const closeSidebar = () => setIsOpen(false);

  return (
    <>
      {/* Mobile Hamburger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 right-4 z-50 p-2 text-slate-600 bg-white rounded-lg shadow-sm"
        aria-label="Toggle menu"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-slate-900/20 z-40 backdrop-blur-[2px]"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "flex flex-col h-screen w-60 bg-white border-r border-slate-100 fixed left-0 top-0 z-40 transition-transform duration-300 ease-in-out font-sans",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="p-8">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 bg-[#0061FF] rounded-lg flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <span className="text-xl font-bold text-slate-900 tracking-tight">SajiloDocs</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-0.5 mt-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/dashboard'}
              onClick={closeSidebar}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-[#F7F9FC] text-[#0061FF]"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              {({ isActive }) => (
                <>
                  <item.icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                  <span>{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-slate-50 space-y-1">
          <button className="flex items-center gap-3 px-4 py-2.5 w-full rounded-md text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-all duration-150">
            <HelpCircle size={18} strokeWidth={2} />
            <span>Support</span>
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-2.5 w-full rounded-md text-sm font-medium text-slate-400 hover:bg-red-50 hover:text-red-600 transition-all duration-150"
          >
            <LogOut size={18} strokeWidth={2} />
            <span>Sign out</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
