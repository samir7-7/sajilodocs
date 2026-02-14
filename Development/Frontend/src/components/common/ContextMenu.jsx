import React, { useEffect, useRef } from 'react';
import { Share2, Edit2, Trash2, Download, ExternalLink } from 'lucide-react';
import { cn } from '../../utils/cn';

const ContextMenu = ({ x, y, isOpen, onClose, items, item, type }) => {
  const menuRef = useRef(null);
  
  // Use item.role (files) or item.owner relative logic for folders
  const role = item?.role || (item?.owner === 'me' ? 'OWNER' : 'VIEW'); // Simplified for folders for now
  const canManage = role === 'OWNER' || role === 'EDIT';

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Adjust position if menu goes off screen
  const menuWidth = 220;
  const menuHeight = 240; // Estimated
  const adjustedX = x + menuWidth > window.innerWidth ? x - menuWidth : x;
  const adjustedY = y + menuHeight > window.innerHeight ? y - menuHeight : y;

  return (
    <div 
      ref={menuRef}
      className="fixed z-[100] w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 animate-in fade-in zoom-in-95 duration-150"
      style={{ left: adjustedX, top: adjustedY }}
    >
      <div className="px-3 py-2 border-b border-slate-50 mb-1">
        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest truncate" title={item?.name}>
          {item?.name || 'Actions'}
        </p>
      </div>

      <div className="px-1.5 space-y-0.5">
        <button 
          onClick={() => { items.onOpen && items.onOpen(item); onClose(); }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-[#0061FF] transition-all group"
        >
          <ExternalLink size={16} className="text-slate-400 group-hover:text-[#0061FF]" />
          Open
        </button>

        <button 
          onClick={() => { if (canManage) { items.onShare && items.onShare(item); onClose(); } }}
          disabled={!canManage}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all group",
            canManage ? "text-slate-700 hover:bg-slate-50 hover:text-[#0061FF]" : "text-slate-300 cursor-not-allowed opacity-50"
          )}
        >
          <Share2 size={16} className={cn("text-slate-400", canManage && "group-hover:text-[#0061FF]")} />
          Give Access
        </button>

        <button 
          onClick={() => { if (canManage) { items.onRename && items.onRename(item); onClose(); } }}
          disabled={!canManage}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all group",
            canManage ? "text-slate-700 hover:bg-slate-50 hover:text-[#0061FF]" : "text-slate-300 cursor-not-allowed opacity-50"
          )}
        >
          <Edit2 size={16} className={cn("text-slate-400", canManage && "group-hover:text-[#0061FF]")} />
          Rename
        </button>

        {items.onDownload && (
          <button 
            onClick={() => { items.onDownload(item); onClose(); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-[#0061FF] transition-all group"
          >
            <Download size={16} className="text-slate-400 group-hover:text-[#0061FF]" />
            Download
          </button>
        )}

        <div className="h-px bg-slate-50 mx-2 my-1" />

        <button 
          onClick={() => { if (canManage) { items.onDelete && items.onDelete(item); onClose(); } }}
          disabled={!canManage}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all group",
            canManage ? "text-rose-500 hover:bg-rose-50" : "text-slate-300 cursor-not-allowed opacity-50"
          )}
        >
          <Trash2 size={16} className={cn("text-rose-400", canManage && "group-hover:text-rose-500")} />
          Move to Trash
        </button>
      </div>
    </div>
  );
};

export default ContextMenu;
