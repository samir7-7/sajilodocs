import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Download, Printer, Trash2, Share2, 
  Maximize2, ZoomIn, ZoomOut, ChevronLeft, ChevronRight,
  Languages, ScanText, Save, X, CheckCircle2
} from 'lucide-react';
import { useFileSystem } from '../context/FileSystemContext';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { shareAPI } from '../utils/api';
import { useToast } from '../components/common/Toast';
import { cn } from '../utils/cn';
import DocxEditor from '../components/features/DocxRichEditor';

const DocumentView = () => {
  const { fileId } = useParams();
  const navigate = useNavigate();
  const { files, folders, updateFile, deleteFile } = useFileSystem();
  const { showToast } = useToast();
  
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
  const [shareExpiration, setShareExpiration] = useState('');
  const [shareMessage, setShareMessage] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');

  const handleSave = async () => {
    try {
        await updateFile(file.id, { 
            metadata: { ...file.metadata, author: localMetadata.author },
            tags: localMetadata.tags
        });
        showToast('Changes saved successfully!');
    } catch (error) {
        console.error('Save failed:', error);
        showToast('Failed to save changes', 'error');
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
      showToast('Download started');
    } else {
      showToast('File URL not available', 'error');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    if (!shareEmail) {
      showToast('Please enter an email address', 'error');
      return;
    }
    setIsSharing(true);
    try {
      await shareAPI.shareFile({
        file: file.id,
        shared_with_email: shareEmail,
        permission: sharePermission,
        expires_at: shareExpiration, // New field
        message: shareMessage, // New field (optional for UI)
      });
      showToast(`Access granted to ${shareEmail} as ${sharePermission}`);
      setShareEmail('');
      setShareExpiration('');
      setShareMessage('');
    } catch (error) {
      console.error('Share failed:', error);
      showToast(error.response?.data?.non_field_errors?.[0] || 'Failed to share file', 'error');
    } finally {
      setIsSharing(false);
    }
  };

  const isOCRSupported = (file) => {
    const supportedExts = ['jpg', 'jpeg', 'png', 'webp', 'pdf'];
    const ext = file.name?.split('.').pop()?.toLowerCase();
    return supportedExts.includes(ext) || file.type?.includes('image/') || file.type === 'application/pdf';
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Bar */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-100 h-16 px-6 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-5">
          <button 
            onClick={() => navigate(-1)} 
            className="p-2.5 hover:bg-slate-100 rounded-xl text-slate-500 transition-all hover:text-[#0061FF]"
          >
            <ArrowLeft size={18} strokeWidth={2.5} />
          </button>
          <div className="flex items-center gap-3 text-sm font-bold text-slate-400">
            <span className="hover:text-slate-900 cursor-pointer transition-colors" onClick={() => navigate('/dashboard')}>Home</span>
            <ChevronRight size={14} className="opacity-40" />
            {parentFolder && (
                <>
                    <span 
                        className="hover:text-slate-900 cursor-pointer transition-colors max-w-[120px] truncate" 
                        onClick={() => navigate(`/dashboard/folder/${parentFolder.id}`)}
                    >
                        {parentFolder.name}
                    </span>
                    <ChevronRight size={14} className="opacity-40" />
                </>
            )}
            <span className="text-slate-900 truncate max-w-[200px]">{file.name}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            size="sm" 
            onClick={handleSave} 
            className="gap-2 px-5 font-bold shadow-blue-200/50 shadow-lg"
            disabled={file.role === 'VIEW'}
          >
            <Save size={16} /> Save Changes
          </Button>
          <div className="h-8 w-px bg-slate-100 mx-1" />
          <button onClick={handleDownload} className="p-2.5 hover:bg-slate-50 rounded-xl text-slate-500 hover:text-[#0061FF] transition-all" title="Download">
            <Download size={20} />
          </button>
          <button onClick={handlePrint} className="p-2.5 hover:bg-slate-50 rounded-xl text-slate-500 hover:text-[#0061FF] transition-all" title="Print">
            <Printer size={20} />
          </button>
          <button 
            className={cn(
              "p-2.5 rounded-xl transition-all",
              file.role === 'VIEW' ? "text-slate-200 cursor-not-allowed" : "hover:bg-rose-50 text-slate-400 hover:text-rose-500"
            )}
            title="Delete"
            onClick={file.role === 'VIEW' ? null : handleDelete}
            disabled={file.role === 'VIEW'}
          >
            <Trash2 size={20} />
          </button>
          <div className="ml-3 h-9 w-9 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shadow-sm">
            <img src="https://ui-avatars.com/api/?name=User&background=0061FF&color=fff" alt="User" />
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Metadata */}
        <aside className="w-80 bg-white border-r border-slate-100 overflow-y-auto p-6 hidden lg:block scrollbar-hide">
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-bold text-slate-900">Document Details</h2>
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Saved" />
          </div>
          <p className="text-xs text-slate-400 font-medium mb-8 uppercase tracking-wider">Reference Info</p>

          <div className="space-y-8">
            {/* Metadata Section */}
            <div>
              <button className="flex items-center justify-between w-full text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                Metadata
                <ChevronRight size={14} className="rotate-90 opacity-40" />
              </button>
              
              <div className="space-y-5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-tight mb-1.5 ml-1">Title</label>
                  <Input 
                    value={file.name} 
                    readOnly 
                    className="bg-slate-50 border-transparent font-medium"
                  />
                </div>
                
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-tight mb-1.5 ml-1">Author / Owner</label>
                  <Input 
                    value={localMetadata.author} 
                    onChange={(e) => setLocalMetadata({...localMetadata, author: e.target.value})}
                    placeholder="Set author"
                    className="bg-slate-50 border-transparent focus:bg-white focus:border-[#0061FF]/20"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-tight mb-1.5 ml-1">Tags</label>
                  <div className="flex flex-wrap gap-2 p-1">
                    {localMetadata.tags?.map((tag, i) => (
                      <span key={i} className="px-2.5 py-1 bg-blue-50 text-[#0061FF] text-[10px] font-bold rounded-lg flex items-center gap-1.5 border border-blue-100/50 uppercase tracking-wider">
                        {tag}
                        <button onClick={() => handleRemoveTag(tag)} className="hover:text-rose-500 transition-colors">
                            <X size={10} strokeWidth={3} />
                        </button>
                      </span>
                    ))}
                    {isAddingTag ? (
                      <div className="flex items-center gap-1.5">
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
                          placeholder="Tag..."
                          className="w-24 h-8 text-[11px] font-bold uppercase tracking-tight py-0"
                          autoFocus
                        />
                        <button onClick={handleAddTag} className="w-8 h-8 flex items-center justify-center bg-[#0061FF] text-white rounded-lg hover:bg-[#0051EE] transition-all">
                            <CheckCircle2 size={14} />
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => setIsAddingTag(true)} 
                        className="px-3 py-1 border border-dashed border-slate-200 text-slate-400 text-[10px] font-bold rounded-lg hover:border-[#0061FF]/50 hover:text-[#0061FF] transition-all uppercase tracking-widest bg-slate-50/50"
                      >
                        + Add Tag
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-50 pt-5">
              <button className="flex items-center justify-between w-full text-xs font-bold text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors group">
                File Details
                <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1" />
              </button>
            </div>
            
            <div className="border-t border-slate-50 pt-5">
              <button className="flex items-center justify-between w-full text-xs font-bold text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors group">
                Version History
                <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1" />
              </button>
            </div>
          </div>
        </aside>

        {/* Center - Preview */}
        <main className="flex-1 bg-slate-100/50 relative flex flex-col overflow-hidden">
          <div className="flex-1 overflow-auto flex items-center justify-center p-4 lg:p-12 custom-scrollbar">
            <div 
              className={cn(
                "bg-white shadow-2xl transition-all duration-300 origin-center flex items-center justify-center overflow-hidden rounded-sm",
                (file.type?.startsWith('image/') || file.name?.match(/\.(jpg|jpeg|png|gif|webp)$/i)) ? "max-w-fit h-auto" : "w-full h-full max-w-5xl"
              )}
              style={{ 
                transform: `scale(${zoom/100})`,
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)'
              }}
            >
              {/* Actual Content */}
              <div className="w-full h-full flex items-center justify-center bg-white relative">
                {file.file_url ? (
                  // Image
                  file.type?.startsWith('image/') || file.name?.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                    <img 
                      src={file.file_url} 
                      alt={file.name} 
                      className="max-w-full max-h-[80vh] object-contain select-none"
                    />
                  ) 
                  // Video
                  : file.type?.startsWith('video/') || file.name?.match(/\.(mp4|webm|ogg)$/i) ? (
                    <div className="w-full aspect-video bg-black flex items-center justify-center rounded-lg overflow-hidden border border-slate-200">
                      <video 
                        src={file.file_url} 
                        controls 
                        className="w-full h-full"
                      />
                    </div>
                  )
                  // Audio
                  : file.type?.startsWith('audio/') || file.name?.match(/\.(mp3|wav|ogg)$/i) ? (
                    <div className="text-center p-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200 w-full max-w-md mx-auto">
                      <div className="mb-6 text-[#0061FF]">
                        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Maximize2 size={40} />
                        </div>
                        <p className="font-bold text-lg">Audio Preview</p>
                        <p className="text-sm text-slate-400 mt-1">{file.name}</p>
                      </div>
                      <audio 
                        src={file.file_url} 
                        controls 
                        className="w-full"
                      />
                    </div>
                  )
                  // Word Document
                  : (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file.name?.match(/\.docx$/i)) ? (
                    <div className="w-full h-[85vh] bg-slate-50 overflow-hidden">
                      <DocxEditor file={file} readOnly={file.role === 'VIEW'} />
                    </div>
                  )
                  // PDF or Text
                  : file.type === 'application/pdf' || file.name?.match(/\.pdf$/i) ? (
                    <iframe 
                      src={`${file.file_url}#toolbar=0`} 
                      title={file.name}
                      className="w-full h-[85vh] border-none"
                    />
                  )
                  : file.type?.startsWith('text/') || file.name?.match(/\.(txt|csv|json|md|py|js|html|css)$/i) ? (
                    <iframe 
                      src={file.file_url} 
                      title={file.name}
                      className="w-full h-[85vh] border-none bg-slate-50 font-mono text-sm p-4"
                    />
                  ) 
                  // Fallback
                  : (
                    <div className="text-center text-slate-400 p-12">
                      <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <ArrowLeft size={40} className="rotate-180" />
                      </div>
                      <p className="text-xl font-bold text-slate-600 mb-4">Deep preview not available</p>
                      <Button onClick={handleDownload} variant="primary" className="shadow-lg">
                        Download to View ({file.size})
                      </Button>
                    </div>
                  )
                ) : (
                  <div className="text-center text-slate-300 p-12 italic">
                    <p>File content could not be located</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Toolbar */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md border border-slate-100 p-2 rounded-2xl flex items-center shadow-2xl gap-2 z-10 transition-all hover:bg-white">
            <div className="flex items-center gap-1 bg-slate-50 rounded-xl p-1">
              <button 
                onClick={() => setZoom(Math.max(25, zoom - 25))} 
                className="p-2 hover:bg-white hover:text-[#0061FF] rounded-lg transition-all text-slate-400"
                title="Zoom Out"
              >
                <ZoomOut size={18} />
              </button>
              <div className="w-16 text-center">
                <span className="text-[11px] font-bold text-slate-600 tracking-tighter uppercase">{zoom}%</span>
              </div>
              <button 
                onClick={() => setZoom(Math.min(400, zoom + 25))} 
                className="p-2 hover:bg-white hover:text-[#0061FF] rounded-lg transition-all text-slate-400"
                title="Zoom In"
              >
                <ZoomIn size={18} />
              </button>
            </div>
            
            <div className="h-6 w-px bg-slate-100 mx-1" />
            
            <div className="flex items-center gap-1 bg-slate-50 rounded-xl p-1">
              <button className="p-2 hover:bg-white text-slate-300 rounded-lg transition-all cursor-not-allowed">
                <ChevronLeft size={18} />
              </button>
              <div className="px-3">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-tighter">Page 1 / 1</span>
              </div>
              <button className="p-2 hover:bg-white text-slate-300 rounded-lg transition-all cursor-not-allowed">
                <ChevronRight size={18} />
              </button>
            </div>

            <div className="h-6 w-px bg-slate-100 mx-1" />

            <button 
              onClick={() => setZoom(100)}
              className="px-3 py-2 hover:bg-slate-50 text-[10px] font-bold text-slate-500 rounded-xl transition-all uppercase tracking-widest"
            >
              Reset
            </button>
          </div>
        </main>

        {/* Right Sidebar - Actions */}
        <aside className="w-80 bg-white border-l border-slate-100 p-8 hidden xl:block overflow-y-auto scrollbar-hide">
          <h2 className="font-bold text-slate-900 mb-1">Collaboration</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-8">Sharing & Access</p>
          
          <div className="space-y-8">
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="name@example.com"
                  value={shareEmail}
                  onChange={(e) => setShareEmail(e.target.value)}
                  className="flex-1 bg-slate-50 border-transparent text-sm focus:bg-white focus:border-[#0061FF]/20"
                />
                <select 
                  className="w-24 rounded-xl border border-transparent bg-slate-50 px-3 text-xs font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#0061FF]/10 transition-all cursor-pointer"
                  value={sharePermission}
                  onChange={(e) => setSharePermission(e.target.value)}
                >
                  <option value="VIEW text-[10px]">Viewer</option>
                  <option value="EDIT">Editor</option>
                </select>
              </div>

              <div className="space-y-3">
                <Input
                  type="date"
                  value={shareExpiration}
                  onChange={(e) => setShareExpiration(e.target.value)}
                  className="bg-slate-50 border-transparent text-xs"
                  label="Expires On (Optional)"
                />
                <textarea
                  placeholder="Personal message (optional)"
                  value={shareMessage}
                  onChange={(e) => setShareMessage(e.target.value)}
                  className="w-full rounded-xl border border-transparent bg-slate-50 p-3 text-xs text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#0061FF]/10 transition-all min-h-[80px] resize-none"
                />
              </div>

              <Button className="w-full gap-2.5 h-11 font-bold shadow-lg shadow-blue-100/50" onClick={handleShare} disabled={isSharing}>
                <Share2 size={18} /> {isSharing ? 'Sharing...' : 'Share File'}
              </Button>
            </div>

            <div className="space-y-4 pt-8 border-t border-slate-50">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Who has access</h3>
              <div className="space-y-3">
                {/* List existing shares if available */}
                {file.shares && file.shares.map(share => (
                  <div key={share.id} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-500 to-[#0061FF] flex items-center justify-center text-white text-xs font-bold shadow-sm">
                        {share.shared_with_details?.first_name?.[0] || share.shared_with_details?.username?.[0] || 'U'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate">
                          {share.shared_with_details?.first_name || share.shared_with_details?.username}
                        </p>
                        <p className="text-[10px] text-slate-400 font-medium truncate">{share.shared_with_details?.email}</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 bg-blue-50 text-[#0061FF] text-[10px] font-bold rounded-lg border border-blue-100/30 uppercase tracking-tighter">
                      {share.permission === 'VIEW' ? 'View' : 'Edit'}
                    </span>
                  </div>
                ))}
                {(!file.shares || file.shares.length === 0) && (
                  <div className="py-8 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-100">
                    <p className="text-xs text-slate-400 font-medium">Currently private</p>
                    <p className="text-[10px] text-slate-300 mt-1 uppercase tracking-tight">Only you can access</p>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-6 border-t border-gray-100">
              <h3 className="font-bold text-gray-900 mb-4">OCR (Text Recognition)</h3>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <Button 
                  variant="secondary" 
                  className="w-full gap-2 mb-2"
                  disabled={!isOCRSupported(file)}
                  onClick={() => showToast('OCR analysis started...', 'info')}
                >
                  <ScanText size={18} /> Run OCR
                </Button>
                <span className="text-xs text-gray-500">
                  {isOCRSupported(file) 
                    ? 'Status: Not run' 
                    : 'Not supported for this file type'}
                </span>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-100">
              <h3 className="font-bold text-gray-900 mb-4">Translate</h3>
              <div className="flex items-center gap-2 mb-4">
                <select className="flex-1 rounded-md border border-gray-300 px-2 py-1 text-sm bg-white">
                  <option>English</option>
                  <option>Nepali</option>
                  <option>Spanish</option>
                </select>
                <span className="text-gray-400">→</span>
                <select className="flex-1 rounded-md border border-gray-300 px-2 py-1 text-sm bg-white">
                  <option>English</option>
                  <option>Nepali</option>
                  <option>Spanish</option>
                </select>
              </div>
              <Button 
                variant="secondary" 
                className="w-full gap-2"
                onClick={() => showToast('Translation in progress...', 'info')}
              >
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
