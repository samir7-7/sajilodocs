import React from 'react';
import { HardDrive, Clock, Star, Trash2, Cloud, Plus, Tablet, Users } from 'lucide-react';

const Sidebar = () => {
  const navItems = [
    { icon: HardDrive, label: 'My Drive', active: true },
    { icon: Tablet, label: 'Computers' },
    { icon: Users, label: 'Shared with me' },
    { icon: Clock, label: 'Recent' },
    { icon: Star, label: 'Starred' },
    { icon: Trash2, label: 'Trash' },
  ];

  return (
    <aside className="w-64 bg-sidebar h-screen flex flex-col border-r border-border py-2">
      <div className="flex items-center gap-2 px-4 py-3 mb-2">
        <Cloud size={32} className="text-[#1967d2]" fill="#1967d2" />
        <span className="text-xl text-secondary font-medium">Drive</span>
      </div>

      <button className="flex items-center gap-3 bg-primary-btn text-primary-btn-text rounded-2xl px-4 py-4 ml-2 mb-4 shadow-md hover:shadow-lg transition-shadow w-fit border border-transparent hover:bg-hover-bg">
        <Plus size={24} />
        <span className="font-medium text-sm">New</span>
      </button>

      <nav className="flex-1 overflow-y-auto">
        {navItems.map((item) => (
          <div
            key={item.label}
            className={`flex items-center gap-3 px-6 py-1.5 mx-2 rounded-r-full cursor-pointer text-sm mb-0.5 ${item.active
                ? 'bg-accent text-primary font-medium'
                : 'text-secondary hover:bg-hover-bg'
              }`}
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </div>
        ))}
      </nav>

      <div className="mt-auto px-4 pb-4">
        <div className="flex items-center gap-2 text-secondary mb-2">
          <Cloud size={20} />
          <span className="text-sm">Storage</span>
        </div>
        <div className="w-full h-1 bg-border rounded-full mb-1">
          <div className="w-[30%] h-full bg-[#1967d2] rounded-full"></div>
        </div>
        <span className="text-xs text-secondary">4.2 GB of 15 GB used</span>
      </div>
    </aside>
  );
};

export default Sidebar;
