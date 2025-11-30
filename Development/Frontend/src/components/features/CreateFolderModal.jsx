import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Input } from '../common/Input';
import { Button } from '../common/Button';

const COLORS = [
  '#3B82F6', // Blue
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 relative animate-in fade-in zoom-in duration-200">
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
        >
          <X size={20} />
        </button>
        
        <h2 className="text-xl font-bold text-gray-900 mb-6">Create New Folder</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Folder Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Project Alpha"
            required
            autoFocus
          />
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Color Label
            </label>
            <div className="flex gap-3 flex-wrap">
              {COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`w-8 h-8 rounded-full transition-transform ${
                    selectedColor === color ? 'ring-2 ring-offset-2 ring-blue-500 scale-110' : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => setSelectedColor(color)}
                />
              ))}
            </div>
          </div>
          
          <Input
            label="Tags (comma separated)"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="Work, Important, 2024"
          />
          
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              Create Folder
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateFolderModal;
