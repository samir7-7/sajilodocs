import React from 'react';
import { Search, Settings, HelpCircle, Grip } from 'lucide-react';

const Header = () => {
    return (
        <header className="flex items-center justify-between px-4 py-2 bg-bg">
            <div className="flex items-center bg-[#e9eef6] rounded-full px-4 py-3 w-[720px] max-w-full focus-within:bg-white focus-within:shadow-md transition-all">
                <Search size={24} className="text-secondary" />
                <input
                    type="text"
                    placeholder="Search in Drive"
                    className="flex-1 bg-transparent border-none outline-none ml-3 text-base placeholder-secondary text-primary"
                />
                <Settings size={24} className="text-secondary cursor-pointer hover:bg-black/5 rounded-full p-0.5" />
            </div>

            <div className="flex items-center gap-2">
                <button className="p-2 rounded-full hover:bg-black/5 text-secondary">
                    <HelpCircle size={24} />
                </button>
                <button className="p-2 rounded-full hover:bg-black/5 text-secondary">
                    <Settings size={24} />
                </button>
                <button className="p-2 rounded-full hover:bg-black/5 text-secondary">
                    <Grip size={24} />
                </button>
                <div className="w-8 h-8 rounded-full bg-[#ef6c00] text-white flex items-center justify-center text-sm font-medium cursor-pointer ml-1">
                    A
                </div>
            </div>
        </header>
    );
};

export default Header;
