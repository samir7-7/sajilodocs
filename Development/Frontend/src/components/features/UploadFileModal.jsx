import React, { useState, useRef } from 'react';
import { X, Upload, File } from 'lucide-react';
import { Input } from '../common/Input';
import { cn } from '../../utils/cn';
import { Button } from '../common/Button';

const UploadFileModal = ({ isOpen, onClose, onUpload, initialFolderId = null }) => {
  const [file, setFile] = useState(null);
  const [metadata, setMetadata] = useState({
    description: '',
    tags: '',
    author: '',
    category: '',
  });
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleMetadataChange = (e) => {
    setMetadata({ ...metadata, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!file) return;

    const fileData = {
      file: file,
      name: file.name,
      type: file.type,
      size: (file.size / 1024).toFixed(1) + ' KB',
      description: metadata.description,
      tags: metadata.tags.split(',').map(t => t.trim()).filter(Boolean),
      metadata: {
        author: metadata.author,
        category: metadata.category,
        description: metadata.description,
      },
      folder: initialFolderId,
    };

    onUpload(fileData);
    
    // Reset
    setFile(null);
    setMetadata({ description: '', tags: '', author: '', category: '' });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-md transition-all">
      <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="px-8 pt-8 pb-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Upload Files</h2>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 pt-4 space-y-8">
          {/* File Drop Area */}
          <div 
            className={cn(
              "group border-2 border-dashed rounded-[20px] p-12 text-center cursor-pointer transition-all duration-300 relative overflow-hidden",
              file 
                ? "border-[#0061FF] bg-blue-50/30" 
                : "border-slate-200 hover:border-[#0061FF] hover:bg-slate-50/50"
            )}
            onClick={() => fileInputRef.current?.click()}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              onChange={handleFileChange}
            />
            
            {file ? (
              <div className="flex flex-col items-center animate-in fade-in slide-in-from-bottom-2">
                <div className="p-4 bg-white rounded-2xl shadow-sm mb-4 border border-blue-100">
                   <File size={32} className="text-[#0061FF]" />
                </div>
                <span className="font-bold text-slate-900 mb-1">{file.name}</span>
                <span className="text-sm text-slate-400 font-medium">{(file.size / 1024).toFixed(1)} KB</span>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="p-4 bg-white rounded-2xl shadow-sm mb-4 border border-slate-100 group-hover:border-[#0061FF]/30 transition-colors">
                   <Upload size={32} className="text-slate-300 group-hover:text-[#0061FF] transition-colors" />
                </div>
                <span className="font-bold text-slate-900 mb-1">Select a file to upload</span>
                <span className="text-sm text-slate-400 font-medium">or drag and drop here</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Author"
              name="author"
              value={metadata.author}
              onChange={handleMetadataChange}
              placeholder="Who created this?"
              className="h-12 border-slate-200 focus:border-[#0061FF] focus:ring-4 focus:ring-blue-500/5 rounded-xl transition-all"
            />
            <Input
              label="Category"
              name="category"
              value={metadata.category}
              onChange={handleMetadataChange}
              placeholder="Finance, Marketing..."
              className="h-12 border-slate-200 focus:border-[#0061FF] focus:ring-4 focus:ring-blue-500/5 rounded-xl transition-all"
            />
          </div>

          <Input
            label="Tags"
            name="tags"
            value={metadata.tags}
            onChange={handleMetadataChange}
            placeholder="Separate with commas..."
            className="h-12 border-slate-200 focus:border-[#0061FF] focus:ring-4 focus:ring-blue-500/5 rounded-xl transition-all"
          />

          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-900 ml-1">
              Description
            </label>
            <textarea
              name="description"
              rows={3}
              className="flex w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-[#0061FF] transition-all"
              placeholder="Briefly describe this document..."
              value={metadata.description}
              onChange={handleMetadataChange}
            />
          </div>
          
          <div className="flex items-center gap-4 pt-2">
            <Button 
              type="button" 
              variant="outline" 
              className="flex-1 h-12 border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl font-bold transition-all"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!file}
              className="flex-1 h-12 bg-[#0061FF] hover:bg-[#0052D9] text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50 disabled:shadow-none"
            >
              Start Upload
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UploadFileModal;
