import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Folder, MoreVertical, Trash2, Edit2 } from 'lucide-react';


import { useFileSystem } from '../../context/FileSystemContext';
import { cn } from '../../utils/cn';

const FolderCard = ({ folder, onEdit, onDelete, onContextMenu }) => {
  const navigate = useNavigate();
  const { files } = useFileSystem();
  
  if (!folder) return null;

  const fileCount = (files || []).filter(f => f && String(f.folder) === String(folder.id)).length;

  const safeDate = (dateString) => {
    if (!dateString) return '—';
    const d = new Date(dateString);
    return isNaN(d.getTime()) ? '—' : d.toLocaleDateString();
  };

  const handleClick = () => folder.id && navigate(`/dashboard/folder/${folder.id}`);

  const handleContextMenu = (e) => {
    if (onContextMenu) {
      onContextMenu(e, folder);
    }
  };

  return (
    <div 
      className={cn(
        "group relative bg-white border border-slate-200 rounded-xl p-5 hover:border-[#0061FF] hover:shadow-md transition-all duration-200 cursor-pointer",
      )}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 bg-blue-50 text-[#0061FF] rounded-lg group-hover:bg-[#0061FF] group-hover:text-white transition-colors duration-200">
          <Folder size={24} fill="currentColor" fillOpacity={0.1} />
        </div>
      </div>

      <div>
        <h3 className="text-base font-bold text-slate-900 truncate mb-1.5" title={folder.name || 'Unnamed Folder'}>
          {folder.name || 'Unnamed Folder'}
        </h3>
        <div className="space-y-1">
          <p className="text-xs text-slate-500 font-bold">
            {fileCount} {fileCount === 1 ? 'file' : 'files'}
          </p>
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] text-slate-400 font-medium">Uploaded: {safeDate(folder.created_at || folder.createdAt)}</span>
            <span className="text-[10px] text-slate-500 font-bold">Modified: {safeDate(folder.updated_at || folder.updatedAt || folder.created_at || folder.createdAt)}</span>
          </div>
        </div>
      </div>

      {folder.tags && folder.tags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {folder.tags.map((tag, i) => (
            <span key={i} className="px-2 py-0.5 bg-slate-50 text-slate-500 border border-slate-100 rounded text-[10px] font-bold uppercase tracking-wider">
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default FolderCard;
