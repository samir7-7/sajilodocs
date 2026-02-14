import React, { useState } from 'react';
import { FileText, Image, File, MoreVertical, Trash2, Edit2, Download, FileVideo, FileAudio, FileCode, FileSpreadsheet } from 'lucide-react';

const FileList = ({ files, viewMode = 'list', onEdit, onDelete, onContextMenu }) => {
  const getFileIcon = (file) => {
    const type = file?.type || '';
    const name = file?.name || '';
    
    if (type.includes('image') || name.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
      return <Image className="text-purple-500" size={20} />;
    }
    if (type.includes('video') || name.match(/\.(mp4|webm|mov|avi)$/i)) {
      return <FileVideo className="text-pink-500" size={20} />;
    }
    if (type.includes('audio') || name.match(/\.(mp3|wav|ogg)$/i)) {
      return <FileAudio className="text-blue-500" size={20} />;
    }
    if (type.includes('pdf') || name.match(/\.pdf$/i)) {
      return <FileText className="text-red-500" size={20} />;
    }
    if (name.match(/\.(js|jsx|ts|tsx|py|java|cpp|c|html|css|json)$/i)) {
      return <FileCode className="text-green-500" size={20} />;
    }
    if (name.match(/\.(xlsx|xls|csv)$/i)) {
      return <FileSpreadsheet className="text-emerald-500" size={20} />;
    }
    return <File className="text-gray-500" size={20} />;
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    
    // If it's already a string with units like "1.2 MB", try to parse and round it as requested
    if (typeof bytes === 'string' && /[a-zA-Z]/.test(bytes)) {
      const numPart = parseFloat(bytes);
      const unitPart = bytes.replace(/[0-9.]/g, '').trim();
      if (!isNaN(numPart)) {
        return Math.ceil(numPart) + ' ' + unitPart;
      }
      return bytes;
    }

    const numericBytes = Number(bytes);
    if (isNaN(numericBytes) || numericBytes <= 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    
    // Calculate index and clamp to valid range [0, sizes.length - 1]
    let i = Math.floor(Math.log(numericBytes) / Math.log(k));
    const sizeIndex = Math.max(0, Math.min(i, sizes.length - 1));
    
    const value = numericBytes / Math.pow(k, sizeIndex);
    return Math.ceil(value) + ' ' + sizes[sizeIndex];
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '—';
    
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  if (!files || files.length === 0) {
    return (
        <div className="flex flex-col items-center justify-center py-20 bg-slate-50/30 rounded-2xl border border-dashed border-slate-100">
            <File className="text-slate-200 mb-4" size={48} />
            <p className="text-slate-400 font-medium">No files in this view</p>
        </div>
    );
  }

  return (
    <div className="bg-white border border-slate-100 rounded-xl overflow-hidden shadow-sm">
      {/* Column Headers */}
      <div className="hidden lg:flex items-center gap-4 px-6 py-4 bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-widest">
        <div className="flex-1">Name</div>
        <div className="w-40">Tags</div>
        <div className="w-24">Size</div>
        <div className="w-36">Uploaded</div>
        <div className="w-36">Modified</div>
        <div className="w-20 text-right">Actions</div>
      </div>

      <div className="divide-y divide-slate-50">
        {files.map((file) => {
          if (!file) return null;
          return (
            <div
              key={file.id || Math.random()}
              className="flex items-center gap-4 px-6 py-5 hover:bg-slate-50/50 transition-colors cursor-pointer group"
              onDoubleClick={() => onEdit && onEdit(file, true)}
              onContextMenu={(e) => onContextMenu && onContextMenu(e, file)}
            >
              {/* Name Column */}
              <div className="flex-1 flex items-center gap-4 min-w-0">
                <div className="flex-shrink-0 p-2.5 bg-white border border-slate-100 rounded-xl group-hover:border-[#0061FF]/30 transition-all shadow-sm">
                  {getFileIcon(file)}
                </div>
                <div className="min-w-0">
                  <h4 className="font-semibold text-slate-900 truncate group-hover:text-[#0061FF] transition-colors" title={file.name || 'Unnamed'}>
                    {file.name || 'Unnamed'}
                  </h4>
                  <p className="lg:hidden text-[11px] text-slate-400 font-medium mt-0.5">
                    {formatFileSize(file.size)} • Up: {formatDate(file.created_at || file.createdAt)} • Mod: {formatDate(file.updated_at || file.updatedAt)}
                  </p>
                </div>
              </div>

              {/* Tags Column */}
              <div className="hidden lg:flex w-40 items-center gap-1.5 flex-wrap">
                {file.tags && Array.isArray(file.tags) && file.tags.length > 0 ? (
                  <>
                    {file.tags.slice(0, 2).map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 bg-slate-50 text-slate-500 border border-slate-100 text-[10px] font-bold rounded uppercase tracking-tighter"
                      >
                        {tag}
                      </span>
                    ))}
                    {file.tags.length > 2 && (
                      <span className="text-[10px] font-bold text-slate-300">+{file.tags.length - 2}</span>
                    )}
                  </>
                ) : (
                  <span className="text-slate-200 text-xs font-medium italic">—</span>
                )}
              </div>

              {/* Size Column */}
              <div className="hidden lg:block w-24">
                <span className="text-sm font-medium text-slate-500">
                  {formatFileSize(file.size)}
                </span>
              </div>

              {/* Uploaded Column */}
              <div className="hidden lg:block w-36">
                <span className="text-xs font-semibold text-slate-400">
                  {formatDate(file.created_at || file.createdAt)}
                </span>
              </div>

              {/* Modified Column */}
              <div className="hidden lg:block w-36">
                <span className="text-sm font-bold text-slate-600">
                  {formatDate(file.updated_at || file.updatedAt || file.created_at || file.createdAt)}
                </span>
              </div>

              {/* Actions Column */}
              <div className="w-20 flex justify-end items-center gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (file.file_url) {
                      const link = document.createElement('a');
                      link.href = file.file_url;
                      link.download = file.name || 'file';
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }
                  }}
                  className="p-2 text-slate-400 hover:text-[#0061FF] hover:bg-white rounded-lg transition-all opacity-0 group-hover:opacity-100"
                  title="Download"
                >
                  <Download size={18} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm('Delete this file?')) onDelete && onDelete(file.id);
                  }}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-white rounded-lg transition-all opacity-0 group-hover:opacity-100"
                  title="Delete"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FileList;
