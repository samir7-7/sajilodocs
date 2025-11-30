import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Download, Printer, Trash2, Share2, 
  Maximize2, ZoomIn, ZoomOut, ChevronLeft, ChevronRight,
  Languages, ScanText, Save
} from 'lucide-react';
import { useFileSystem } from '../context/FileSystemContext';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { shareAPI } from '../utils/api';

const DocumentView = () => {
  const { fileId } = useParams();
  const navigate = useNavigate();
  const { files, folders, updateFile, deleteFile } = useFileSystem();
  
  // Find file or use mock if not found (for testing direct route)
  const file = files.find(f => f.id === fileId) || {
    id: 'mock',
    name: 'annual_report_2023.pdf',
    type: 'pdf',
    size: '2.4 MB',
    createdAt: new Date().toISOString(),
    folder: null,
    tags: ['Report', 'Finance', 'Q4'],
    metadata: {
      author: 'Corporate Inc.',
    }
  };

  const parentFolder = folders.find(f => f.id === file.folder);

  const [localMetadata, setLocalMetadata] = useState({
    author: file.metadata?.author || '',
    tags: file.tags || []
  });

  // Update local state when file changes (e.g. after save)
  useEffect(() => {
    if (file.id !== 'mock') {
        setLocalMetadata({
            author: file.metadata?.author || '',
            tags: file.tags || []
        });
    }
  }, [file]);

  const [zoom, setZoom] = useState(100);
  const [shareEmail, setShareEmail] = useState('');
  const [sharePermission, setSharePermission] = useState('VIEW');
  const [isSharing, setIsSharing] = useState(false);
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');

  const handleSave = async () => {
    try {
        await updateFile(file.id, { 
            metadata: { ...file.metadata, author: localMetadata.author },
            tags: localMetadata.tags
        });
        alert('Changes saved!');
    } catch (error) {
        console.error('Save failed:', error);
        alert('Failed to save changes');
    }
  };

  const handleAddTag = () => {
    if (newTagInput.trim() && !localMetadata.tags.includes(newTagInput.trim())) {
        setLocalMetadata(prev => ({ ...prev, tags: [...prev.tags, newTagInput.trim()] }));
        setNewTagInput('');
        setIsAddingTag(false);
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setLocalMetadata(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tagToRemove) }));
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this file?')) {
      deleteFile(file.id);
      navigate('/dashboard');
    }
  };

  const handleDownload = () => {
    if (file.file_url) {
      const link = document.createElement('a');
      link.href = file.file_url;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      alert('File URL not available');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    if (!shareEmail) {
      alert('Please enter an email address');
      return;
    }
    setIsSharing(true);
    try {
      await shareAPI.shareFile({
        file: file.id,
        shared_with_email: shareEmail,
        permission: sharePermission,
      });
      alert(`Shared successfully with ${shareEmail}`);
      setShareEmail('');
    } catch (error) {
      console.error('Share failed:', error);
      alert(error.response?.data?.non_field_errors?.[0] || 'Failed to share file');
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Bar */}
      <header className="bg-white border-b border-gray-200 h-16 px-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="hover:text-gray-900 cursor-pointer" onClick={() => navigate('/dashboard')}>All Files</span>
            <span>/</span>
            {parentFolder && (
                <>
                    <span className="hover:text-gray-900 cursor-pointer" onClick={() => navigate(`/dashboard/folder/${parentFolder.id}`)}>{parentFolder.name}</span>
                    <span>/</span>
                </>
            )}
            <span className="font-medium text-gray-900">{file.name}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" onClick={handleSave} className="gap-2">
            <Save size={16} /> Save Changes
          </Button>
          <div className="h-8 w-px bg-gray-200 mx-2" />
          <button onClick={handleDownload} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600" title="Download">
            <Download size={20} />
          </button>
          <button onClick={handlePrint} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600" title="Print">
            <Printer size={20} />
          </button>
          <button 
            className="p-2 hover:bg-red-50 text-red-500 rounded-lg" 
            title="Delete"
            onClick={handleDelete}
          >
            <Trash2 size={20} />
          </button>
          <div className="ml-2 h-8 w-8 rounded-full bg-gray-200 overflow-hidden">
            <img src="https://ui-avatars.com/api/?name=User" alt="User" />
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Metadata */}
        <aside className="w-80 bg-white border-r border-gray-200 overflow-y-auto p-6 hidden lg:block">
          <h2 className="font-bold text-gray-900 mb-1">Document Details</h2>
          <p className="text-sm text-gray-500 mb-6">{file.name}</p>

          <div className="space-y-6">
            {/* Metadata Section */}
            <div>
              <button className="flex items-center justify-between w-full text-sm font-medium text-gray-900 mb-4">
                Metadata
                <ChevronRight size={16} className="rotate-90" />
              </button>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Title</label>
                  <Input 
                    value={file.name} 
                    readOnly 
                    className="bg-gray-50"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Author</label>
                  <Input 
                    value={localMetadata.author} 
                    onChange={(e) => setLocalMetadata({...localMetadata, author: e.target.value})}
                    className="bg-gray-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Tags</label>
                  <div className="flex flex-wrap gap-2">
                    {localMetadata.tags?.map((tag, i) => (
                      <span key={i} className="px-2 py-1 bg-green-50 text-green-600 text-xs rounded-md flex items-center gap-1">
                        {tag}
                        <button onClick={() => handleRemoveTag(tag)} className="hover:text-blue-800">×</button>
                      </span>
                    ))}
                    {isAddingTag ? (
                      <div className="flex items-center gap-1">
                        <Input
                          value={newTagInput}
                          onChange={(e) => setNewTagInput(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleAddTag();
                            } else if (e.key === 'Escape') {
                              setIsAddingTag(false);
                              setNewTagInput('');
                            }
                          }}
                          placeholder="Tag name"
                          className="w-24 h-7 text-xs"
                          autoFocus
                        />
                        <button onClick={handleAddTag} className="text-green-600 hover:text-green-800 text-sm">✓</button>
                        <button onClick={() => { setIsAddingTag(false); setNewTagInput(''); }} className="text-red-600 hover:text-red-800 text-sm">✕</button>
                      </div>
                    ) : (
                      <button onClick={() => setIsAddingTag(true)} className="px-2 py-1 border border-dashed border-gray-300 text-gray-500 text-xs rounded-md hover:border-blue-500 hover:text-blue-500">
                        + Add
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4">
              <button className="flex items-center justify-between w-full text-sm font-medium text-gray-900">
                File Details
                <ChevronRight size={16} />
              </button>
            </div>
            
            <div className="border-t border-gray-100 pt-4">
              <button className="flex items-center justify-between w-full text-sm font-medium text-gray-900">
                Version History
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </aside>

        {/* Center - Preview */}
        <main className="flex-1 bg-gray-100 relative flex flex-col">
          <div className="flex-1 overflow-auto flex items-center justify-center p-8">
            <div 
              className="bg-white shadow-lg transition-transform duration-200 origin-center"
              style={{ 
                width: `${600 * (zoom/100)}px`, 
                height: `${800 * (zoom/100)}px`,
                transform: `scale(${zoom/100})` 
              }}
            >
              {/* Actual Content */}
              <div className="w-full h-full flex items-center justify-center bg-white shadow-sm">
                {file.file_url ? (
                  // Image
                  file.type?.startsWith('image/') || file.name?.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                    <img 
                      src={file.file_url} 
                      alt={file.name} 
                      className="max-w-full max-h-full object-contain"
                    />
                  ) 
                  // Video
                  : file.type?.startsWith('video/') || file.name?.match(/\.(mp4|webm|ogg)$/i) ? (
                    <video 
                      src={file.file_url} 
                      controls 
                      className="max-w-full max-h-full"
                    />
                  )
                  // Audio
                  : file.type?.startsWith('audio/') || file.name?.match(/\.(mp3|wav|ogg)$/i) ? (
                    <div className="text-center p-8">
                      <div className="mb-4 text-gray-500">
                        <Maximize2 size={48} className="mx-auto mb-2" />
                        <p>Audio File</p>
                      </div>
                      <audio 
                        src={file.file_url} 
                        controls 
                        className="w-full max-w-md"
                      />
                    </div>
                  )
                  // PDF or Text
                  : file.type === 'application/pdf' || file.name?.match(/\.pdf$/i) || file.type?.startsWith('text/') || file.name?.match(/\.(txt|csv|json|md|py|js|html|css)$/i) ? (
                    <iframe 
                      src={file.file_url} 
                      title={file.name}
                      className="w-full h-full border-none"
                    />
                  ) 
                  // Fallback
                  : (
                    <div className="text-center text-gray-500 p-8">
                      <p className="mb-4 text-lg">Preview not available for this file type.</p>
                      <Button onClick={() => window.open(file.file_url, '_blank')}>
                        Download to View
                      </Button>
                    </div>
                  )
                ) : (
                  <div className="text-center text-gray-400">
                    <p>File URL not found</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Toolbar */}
          <div className="bg-white border-t border-gray-200 p-3 flex items-center justify-center gap-4">
            <button onClick={() => setZoom(Math.max(50, zoom - 10))} className="p-2 hover:bg-gray-100 rounded-lg">
              <ZoomOut size={20} />
            </button>
            <span className="text-sm font-medium w-12 text-center">{zoom}%</span>
            <button onClick={() => setZoom(Math.min(200, zoom + 10))} className="p-2 hover:bg-gray-100 rounded-lg">
              <ZoomIn size={20} />
            </button>
            <div className="h-6 w-px bg-gray-200 mx-2" />
            <button className="p-2 hover:bg-gray-100 rounded-lg">
              <ChevronLeft size={20} />
            </button>
            <span className="text-sm font-medium">Page 1 of 24</span>
            <button className="p-2 hover:bg-gray-100 rounded-lg">
              <ChevronRight size={20} />
            </button>
          </div>
        </main>

        {/* Right Sidebar - Actions */}
        <aside className="w-72 bg-white border-l border-gray-200 p-6 hidden xl:block">
          <h2 className="font-bold text-gray-900 mb-6">Share Document</h2>
          
          <div className="space-y-6">
            <div className="flex gap-2">
              <Input
                placeholder="Enter email to share"
                value={shareEmail}
                onChange={(e) => setShareEmail(e.target.value)}
                className="flex-1"
              />
              <select 
                className="w-24 rounded-md border border-gray-300 px-3 py-2 text-sm"
                value={sharePermission}
                onChange={(e) => setSharePermission(e.target.value)}
              >
                <option value="VIEW">Viewer</option>
                <option value="EDIT">Editor</option>
              </select>
            </div>

            <Button className="w-full gap-2" onClick={handleShare} disabled={isSharing}>
              <Share2 size={18} /> {isSharing ? 'Sharing...' : 'Share File'}
            </Button>

            <div className="space-y-4 pt-4 border-t border-gray-100">
              <h3 className="text-sm font-medium text-gray-700">Who has access</h3>
              {/* List existing shares if available */}
              {file.shares && file.shares.map(share => (
                <div key={share.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 text-xs font-bold">
                      {share.shared_with_details?.first_name?.[0] || share.shared_with_details?.username?.[0] || 'U'}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {share.shared_with_details?.first_name || share.shared_with_details?.username}
                      </p>
                      <p className="text-xs text-gray-500">{share.shared_with_details?.email}</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">{share.permission === 'VIEW' ? 'Viewer' : 'Editor'}</span>
                </div>
              ))}
              {(!file.shares || file.shares.length === 0) && (
                <p className="text-xs text-gray-500">No one else has access.</p>
              )}
            </div>

            <div className="pt-6 border-t border-gray-100">
              <h3 className="font-bold text-gray-900 mb-4">OCR (Text Recognition)</h3>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <Button 
                  variant="secondary" 
                  className="w-full gap-2 mb-2"
                  disabled={!(file.type?.startsWith('image/') || file.type === 'application/pdf' || file.name?.match(/\.(jpg|jpeg|png|gif|webp|pdf)$/i))}
                  onClick={() => alert('OCR functionality coming soon!')}
                >
                  <ScanText size={18} /> Run OCR
                </Button>
                <span className="text-xs text-gray-500">
                  {(file.type?.startsWith('image/') || file.type === 'application/pdf' || file.name?.match(/\.(jpg|jpeg|png|gif|webp|pdf)$/i)) 
                    ? 'Status: Not run' 
                    : 'Not supported for this file type'}
                </span>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-100">
              <h3 className="font-bold text-gray-900 mb-4">Translate</h3>
              <div className="flex items-center gap-2 mb-4">
                <select className="flex-1 rounded-md border border-gray-300 px-2 py-1 text-sm">
                  <option>English</option>
                </select>
                <span className="text-gray-400">→</span>
                <select className="flex-1 rounded-md border border-gray-300 px-2 py-1 text-sm">
                  <option>Spanish</option>
                </select>
              </div>
              <Button variant="secondary" className="w-full gap-2">
                <Languages size={18} /> Translate
              </Button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default DocumentView;
