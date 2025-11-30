import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Folder, MoreVertical, Trash2, Edit2 } from 'lucide-react';


import { useFileSystem } from '../../context/FileSystemContext';

const FolderCard = ({ folder, onEdit, onDelete }) => {
  const navigate = useNavigate();
  const { files } = useFileSystem();
  
  const fileCount = files.filter(f => String(f.folder) === String(folder.id)).length;

  const handleClick = () => navigate(`/dashboard/folder/${folder.id}`);
  return (
    <div
      className="bg-white p-4 rounded-xl border border-gray-200 hover:shadow-md transition-shadow cursor-pointer group relative"
      onClick={handleClick}
    >
      <div className="flex justify-between items-start mb-4">
        <div
          className="h-10 w-10 rounded-lg flex items-center justify-center text-white"
          style={{ backgroundColor: folder.color }}
        >
          <Folder size={20} fill="currentColor" className="opacity-90" />
        </div>
        <div className="relative">
          <button
            className="p-1 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <MoreVertical size={16} />
          </button>

          {/* Quick Actions (Visible on hover for now for simplicity) */}
          <div className="absolute right-0 top-8 bg-white shadow-lg rounded-lg border border-gray-100 py-1 w-32 hidden group-hover:block z-10">
            <button
              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              onClick={(e) => { e.stopPropagation(); onEdit(folder); }}
            >
              <Edit2 size={14} /> Rename
            </button>
            <button
              className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
              onClick={(e) => { e.stopPropagation(); onDelete(folder.id); }}
            >
              <Trash2 size={14} /> Delete
            </button>
          </div>
        </div>
      </div>

      <h3 className="font-semibold text-gray-900 truncate mb-1" title={folder.name}>
        {folder.name}
      </h3>

      <div className="flex flex-wrap gap-1 mt-2">
        {folder.tags && folder.tags.map((tag, index) => (
          <span
            key={index}
            className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full"
          >
            {tag}
          </span>
        ))}
      </div>

      <div className="mt-3 text-xs text-gray-500">
        {fileCount} {fileCount === 1 ? 'file' : 'files'}
      </div>
    </div>
  );
};

export default FolderCard;
