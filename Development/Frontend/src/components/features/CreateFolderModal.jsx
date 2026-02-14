import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Input } from '../common/Input';
import { cn } from '../../utils/cn';
import { Button } from '../common/Button';

const COLORS = [
  '#0061FF', // Dropbox Blue
  '#EF4444', // Red
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#6B7280', // Gray
];

const CreateFolderModal = ({ isOpen, onClose, onCreate }) => {
  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [tags, setTags] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const tagList = tags.split(',').map(t => t.trim()).filter(Boolean);
    onCreate({ name, color: selectedColor, tags: tagList });
    setName('');
    setTags('');
    setSelectedColor(COLORS[0]);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-md transition-all">
      <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="px-8 pt-8 pb-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Create Folder</h2>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 pt-4 space-y-8">
          <Input
            label="Folder Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Legal Documents"
            required
            autoFocus
            className="h-12 border-slate-200 focus:border-[#0061FF] focus:ring-4 focus:ring-blue-500/5 rounded-xl transition-all"
          />
          
          <div className="space-y-4">
            <label className="block text-sm font-bold text-slate-900 ml-1">
              Label Color
            </label>
            <div className="flex gap-4 flex-wrap">
              {COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={cn(
                    "w-9 h-9 rounded-full transition-all duration-300 relative group",
                    selectedColor === color ? "ring-4 ring-offset-2 ring-[#0061FF] scale-110" : "hover:scale-105"
                  )}
                  style={{ backgroundColor: color }}
                  onClick={() => setSelectedColor(color)}
                >
                   {selectedColor === color && (
                     <div className="absolute inset-0 flex items-center justify-center text-white">
                        <svg width="14" height="10" viewBox="0 0 14 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M1 5L5 9L13 1" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                     </div>
                   )}
                </button>
              ))}
            </div>
          </div>
          
          <Input
            label="Tags (Optional)"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="Work, Tax, 2026..."
            className="h-12 border-slate-200 focus:border-[#0061FF] focus:ring-4 focus:ring-blue-500/5 rounded-xl transition-all"
          />
          
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
              className="flex-1 h-12 bg-[#0061FF] hover:bg-[#0052D9] text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 transition-all"
            >
              Create Folder
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateFolderModal;
