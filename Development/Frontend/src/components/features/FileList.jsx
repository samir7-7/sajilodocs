import React, { useState } from 'react';
import { FileText, Image, File, MoreVertical, Trash2, Edit2, Download, FileVideo, FileAudio, FileCode, FileSpreadsheet } from 'lucide-react';

const FileList = ({ files, viewMode = 'list', onEdit, onDelete }) => {
  const [activeMenu, setActiveMenu] = useState(null);

  const getFileIcon = (file) => {
    const type = file.type || '';
    const name = file.name || '';
    
    // Images
    if (type.includes('image') || name.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
      return <Image className="text-purple-500" size={20} />;
    }
    // Videos
    if (type.includes('video') || name.match(/\.(mp4|webm|mov|avi)$/i)) {
      return <FileVideo className="text-pink-500" size={20} />;
    }
    // Audio
    if (type.includes('audio') || name.match(/\.(mp3|wav|ogg)$/i)) {
      return <FileAudio className="text-blue-500" size={20} />;
    }
    // PDFs
    if (type.includes('pdf') || name.match(/\.pdf$/i)) {
      return <FileText className="text-red-500" size={20} />;
    }
    // Code files
    if (name.match(/\.(js|jsx|ts|tsx|py|java|cpp|c|html|css|json)$/i)) {
      return <FileCode className="text-green-500" size={20} />;
    }
    // Spreadsheets
    if (name.match(/\.(xlsx|xls|csv)$/i)) {
      return <FileSpreadsheet className="text-emerald-500" size={20} />;
    }
    // Default
    return <File className="text-gray-500" size={20} />;
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  if (files.length === 0) {
    return null; // Empty state handled by parent component
  }

  // Grid View
  if (viewMode === 'grid') {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 p-4">
        {files.map((file) => (
          <div
            key={file.id}
            className="group relative bg-white rounded-lg border border-gray-200 hover:border-green-300 hover:shadow-md transition-all cursor-pointer"
            onDoubleClick={() => onEdit(file, true)}
          >
            {/* File Preview/Icon */}
            <div className="aspect-square bg-gray-50 rounded-t-lg flex items-center justify-center relative overflow-hidden">
              {file.file_url && (file.type?.includes('image') || file.name?.match(/\.(jpg|jpeg|png|gif|webp)$/i)) ? (
                <img
                  src={file.file_url}
                  alt={file.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="p-6">
                  {getFileIcon(file)}
                </div>
              )}
              
              {/* Hover Actions */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(file, true);
                  }}
                  className="p-2 bg-white rounded-lg hover:bg-gray-100 transition-colors"
                  title="Open"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm('Delete this file?')) onDelete(file.id);
                  }}
                  className="p-2 bg-white rounded-lg hover:bg-red-50 text-red-600 transition-colors"
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            {/* File Info */}
            <div className="p-3">
              <h4 className="font-medium text-sm text-gray-900 truncate mb-1" title={file.name}>
                {file.name}
              </h4>
              <p className="text-xs text-gray-500">
                {formatFileSize(file.size)}
              </p>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // List View
  return (
    <div className="divide-y divide-gray-100">
      {files.map((file) => (
        <div
          key={file.id}
          className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors cursor-pointer group"
          onDoubleClick={() => onEdit(file, true)}
        >
          {/* Icon */}
          <div className="flex-shrink-0 p-2 bg-gray-50 rounded-lg group-hover:bg-white group-hover:shadow-sm transition-all">
            {getFileIcon(file)}
          </div>

          {/* File Info */}
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-gray-900 truncate" title={file.name}>
              {file.name}
            </h4>
            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
              <span>{formatFileSize(file.size)}</span>
              <span>•</span>
              <span>{formatDate(file.created_at || file.createdAt)}</span>
              {file.metadata?.author && (
                <>
                  <span>•</span>
                  <span>By {file.metadata.author}</span>
                </>
              )}
            </div>
          </div>

          {/* Tags */}
          {file.tags && file.tags.length > 0 && (
            <div className="hidden lg:flex items-center gap-2">
              {file.tags.slice(0, 2).map((tag, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 bg-green-50 text-green-600 text-xs rounded-md"
                >
                  {tag}
                </span>
              ))}
              {file.tags.length > 2 && (
                <span className="text-xs text-gray-400">+{file.tags.length - 2}</span>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex-shrink-0 flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (file.file_url) {
                  const link = document.createElement('a');
                  link.href = file.file_url;
                  link.download = file.name;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }
              }}
              className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors opacity-0 group-hover:opacity-100"
              title="Download"
            >
              <Download size={16} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm('Delete this file?')) onDelete(file.id);
              }}
              className="p-2 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
              title="Delete"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default FileList;
