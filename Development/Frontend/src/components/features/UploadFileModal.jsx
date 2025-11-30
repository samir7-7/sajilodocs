import React, { useState, useRef } from 'react';
import { X, Upload, File } from 'lucide-react';
import { Input } from '../common/Input';
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
      file: file, // Pass the actual file object
      name: file.name,
      type: file.type,
      size: (file.size / 1024).toFixed(1) + ' KB',
      description: metadata.description,
      tags: metadata.tags.split(',').map(t => t.trim()).filter(Boolean),
      metadata: { // Structure metadata properly
        author: metadata.author,
        category: metadata.category,
        description: metadata.description,
      },
      folder: initialFolderId, // Pass the folder ID
    };

    onUpload(fileData);
    
    // Reset
    setFile(null);
    setMetadata({ description: '', tags: '', author: '', category: '' });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 relative animate-in fade-in zoom-in duration-200">
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
        >
          <X size={20} />
        </button>
        
        <h2 className="text-xl font-bold text-gray-900 mb-6">Upload File</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* File Drop Area */}
          <div 
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              file ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              onChange={handleFileChange}
            />
            {file ? (
              <div className="flex flex-col items-center text-blue-600">
                <File size={32} className="mb-2" />
                <span className="font-medium">{file.name}</span>
                <span className="text-sm text-blue-400">{(file.size / 1024).toFixed(1)} KB</span>
              </div>
            ) : (
              <div className="flex flex-col items-center text-gray-500">
                <Upload size={32} className="mb-2" />
                <span className="font-medium">Click to select a file</span>
                <span className="text-sm">or drag and drop here</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Author"
              name="author"
              value={metadata.author}
              onChange={handleMetadataChange}
              placeholder="e.g., John Doe"
            />
            <Input
              label="Category"
              name="category"
              value={metadata.category}
              onChange={handleMetadataChange}
              placeholder="e.g., Finance"
            />
          </div>

          <Input
            label="Tags (comma separated)"
            name="tags"
            value={metadata.tags}
            onChange={handleMetadataChange}
            placeholder="Report, Q1, Important"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              rows={3}
              className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              placeholder="Add a brief description..."
              value={metadata.description}
              onChange={handleMetadataChange}
            />
          </div>
          
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!file}>
              Upload File
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UploadFileModal;
