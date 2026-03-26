import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Download, Printer, Trash2, Share2, 
  Maximize2, ZoomIn, ZoomOut, ChevronLeft, ChevronRight,
  Languages, ScanText, Save, X, CheckCircle2, FileText
} from 'lucide-react';
import { useFileSystem } from '../context/FileSystemContext';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { fileAPI, shareAPI } from '../utils/api';
import { useToast } from '../components/common/Toast';
import { cn } from '../utils/cn';
import DocxEditor from '../components/features/DocxRichEditor';
import ConfirmModal from '../components/common/ConfirmModal';

const SUPPORTED_DOCUMENT_TYPES = [
  { value: 'citizenship_certificate', label: 'Citizenship Certificate' },
  { value: 'passport', label: 'Passport' },
  { value: 'birth_certificate', label: 'Birth Certificate' },
  { value: 'land_document', label: 'Land Lease / Land Document' },
];

const isSupportedDocumentType = (value) =>
  SUPPORTED_DOCUMENT_TYPES.some((item) => item.value === value);

const DocumentView = () => {
  const { fileId } = useParams();
  const navigate = useNavigate();
  const { files, folders, updateFile, deleteFile, setFiles } = useFileSystem();
  const { showToast } = useToast();
  
  // Find file or use mock if not found (for testing direct route)
  const file = useMemo(() => (
    files.find(f => f.id === fileId) || {
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
    }
  ), [files, fileId]);

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
        setOcrReviewText(file.corrected_ocr_text || file.ocr_text || '');
        setDocumentTypeValue(
          isSupportedDocumentType(file.document_type) ? file.document_type : file.document_type ? 'other' : ''
        );
        setCustomDocumentType(
          file.document_type && !isSupportedDocumentType(file.document_type) ? file.document_type : ''
        );
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
  const [activeView, setActiveView] = useState('original'); // 'original' or 'ocr'
  const [isOCRProcessing, setIsOCRProcessing] = useState(file.ocr_status === 'PROCESSING');
  const [isTranslationProcessing, setIsTranslationProcessing] = useState(file.translation_status === 'PROCESSING');
  const [targetLanguage, setTargetLanguage] = useState('English');
  const [ocrReviewText, setOcrReviewText] = useState(file.corrected_ocr_text || file.ocr_text || '');
  const [documentTypeValue, setDocumentTypeValue] = useState(
    isSupportedDocumentType(file.document_type) ? file.document_type : file.document_type ? 'other' : ''
  );
  const [customDocumentType, setCustomDocumentType] = useState(
    file.document_type && !isSupportedDocumentType(file.document_type) ? file.document_type : ''
  );
  const [isGeneratingNotarized, setIsGeneratingNotarized] = useState(false);
  const languages = ['English', 'Nepali', 'Spanish', 'Hindi', 'Chinese', 'Japanese', 'French', 'German'];
  const resolvedDocumentType = documentTypeValue === 'other' ? customDocumentType.trim() : documentTypeValue;

  const editorRef = React.useRef(null);

  const handleSave = async () => {
    try {
        // If we have an active editor, trigger its save logic
        if (editorRef.current && (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file.name?.match(/\.docx$/i))) {
            await editorRef.current.save();
        }

        await updateFile(file.id, { 
            metadata: { ...file.metadata, author: localMetadata.author },
            tags: localMetadata.tags,
            corrected_ocr_text: ocrReviewText,
            ...(resolvedDocumentType ? { document_type: resolvedDocumentType } : {})
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

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleDelete = () => {
    deleteFile(file.id);
    navigate('/dashboard');
    showToast('File deleted successfully', 'success');
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

  const startDownload = (url, filename) => {
    if (!url) {
      showToast('Download URL not available', 'error');
      return;
    }
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

  const handleRunOCR = async () => {
    if (file.ocr_status === 'PROCESSING') return;
    
    try {
      setIsOCRProcessing(true);
      await fileAPI.runOCR(file.id);
      showToast(`OCR started for ${file.name}. You can freely explore the app; we'll notify you when it's ready!`, 'info');
      
      // Update local file status only (don't call API for read-only ocr_status)
      if (setFiles) {
        setFiles(prev => prev.map(f => f.id === file.id ? { ...f, ocr_status: 'PROCESSING' } : f));
      }
    } catch (error) {
      console.error('OCR failed:', error);
      showToast(error.response?.data?.error || 'Failed to start OCR', 'error');
      setIsOCRProcessing(false);
    }
  };

  const handleGenerateNotarized = async () => {
    if (!ocrReviewText.trim()) {
      showToast('Review or save the OCR text before generating the reconstructed PDF.', 'warning');
      setActiveView('ocr');
      return;
    }

    if (documentTypeValue === 'other' && !customDocumentType.trim()) {
      showToast('Enter the document type before generating the reconstructed PDF.', 'warning');
      return;
    }

    try {
      setIsGeneratingNotarized(true);
      const response = await fileAPI.generateNotarized(file.id, {
        corrected_ocr_text: ocrReviewText,
        ...(resolvedDocumentType ? { document_type: resolvedDocumentType } : {}),
      });

      const updatedFile = response.data?.file;
      if (updatedFile && setFiles) {
        setFiles(prev => prev.map(f => f.id === file.id ? updatedFile : f));
      }

      const downloadUrl = response.data?.notarized_file_url || updatedFile?.notarized_file_url;
      if (downloadUrl) {
        startDownload(downloadUrl, `${file.name.replace(/\.[^.]+$/, '') || file.name}_reconstructed.pdf`);
      }
      showToast('Reconstructed PDF is ready for download.', 'success');
    } catch (error) {
      console.error('Reconstruction failed:', error);
      const responseData = error.response?.data;
      if (responseData?.requires_document_type) {
        setActiveView('ocr');
        if (responseData.detected_document_type && !resolvedDocumentType) {
          setDocumentTypeValue(responseData.detected_document_type);
        }
        showToast('Select the document type before generating the reconstructed PDF.', 'warning');
      } else {
        showToast(responseData?.error || 'Failed to generate reconstructed PDF', 'error');
      }
    } finally {
      setIsGeneratingNotarized(false);
    }
  };

  // Poll for OCR status if processing
  useEffect(() => {
    let interval;
    if (file.ocr_status === 'PROCESSING') {
      setIsOCRProcessing(true);
      interval = setInterval(async () => {
        try {
          const res = await fileAPI.get(file.id);
          const updatedFile = res.data;
          
          if (updatedFile.ocr_status !== 'PROCESSING') {
            setIsOCRProcessing(false);
            if (setFiles) {
                setFiles(prev => prev.map(f => f.id === file.id ? updatedFile : f));
            }
            clearInterval(interval);
            
            if (updatedFile.ocr_status === 'COMPLETED') {
              showToast('OCR extraction completed!', 'success');
              setActiveView('ocr');
            } else if (updatedFile.ocr_status === 'FAILED') {
              showToast('OCR extraction failed', 'error');
            }
          }
        } catch (error) {
          console.error('Polling failed:', error);
          clearInterval(interval);
        }
      }, 3000);
    } else {
      setIsOCRProcessing(false);
    }
    
    return () => clearInterval(interval);
  }, [file.ocr_status, file.id, setFiles, showToast]);

  const isOCRSupported = (file) => {
    const supportedExts = ['jpg', 'jpeg', 'png', 'webp', 'pdf'];
    const ext = file.name?.split('.').pop()?.toLowerCase();
    return supportedExts.includes(ext) || file.type?.includes('image/') || file.type === 'application/pdf';
  };

  const handleTranslate = async () => {
    if (file.translation_status === 'PROCESSING') return;
    if (!file.ocr_text) {
        showToast('Please run OCR first to extract text.', 'warning');
        return;
    }

    try {
        setIsTranslationProcessing(true);
        await fileAPI.translate(file.id, targetLanguage);
        showToast(`Translation to ${targetLanguage} started. We'll notify you when it's ready!`, 'info');
        
        if (setFiles) {
            setFiles(prev => prev.map(f => f.id === file.id ? { ...f, translation_status: 'PROCESSING', translation_language: targetLanguage } : f));
        }
    } catch (error) {
        console.error('Translation failed:', error);
        showToast(error.response?.data?.error || 'Failed to start translation', 'error');
        setIsTranslationProcessing(false);
    }
  };

  // Poll for Translation status
  useEffect(() => {
    let interval;
    if (file.translation_status === 'PROCESSING') {
      setIsTranslationProcessing(true);
      interval = setInterval(async () => {
        try {
          const res = await fileAPI.get(file.id);
          const updatedFile = res.data;
          
          if (updatedFile.translation_status !== 'PROCESSING') {
            setIsTranslationProcessing(false);
            if (setFiles) {
                setFiles(prev => prev.map(f => f.id === file.id ? updatedFile : f));
            }
            clearInterval(interval);
            
            if (updatedFile.translation_status === 'COMPLETED') {
              showToast(`Translation to ${updatedFile.translation_language} completed!`, 'success');
              setActiveView('translation');
            } else if (updatedFile.translation_status === 'FAILED') {
              showToast('Translation failed', 'error');
            }
          }
        } catch (error) {
          console.error('Polling failed:', error);
          clearInterval(interval);
        }
      }, 3000);
    } else {
      setIsTranslationProcessing(false);
    }
    
    return () => clearInterval(interval);
  }, [file.translation_status, file.id, setFiles, showToast]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Bar */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-100 h-16 px-6 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-5">
          <button 
            onClick={() => navigate(-1)} 
            className="p-2.5 hover:bg-slate-100 rounded-xl text-slate-500 transition-all hover:text-[#4f46e5]"
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
            className="gap-2 px-5 font-bold shadow-indigo-200/50 shadow-lg"
            disabled={file.role === 'VIEW'}
          >
            <Save size={16} /> Save Changes
          </Button>
          <div className="h-8 w-px bg-slate-100 mx-1" />
          <button onClick={handleDownload} className="p-2.5 hover:bg-slate-50 rounded-xl text-slate-500 hover:text-[#4f46e5] transition-all" title="Download">
            <Download size={20} />
          </button>
          <button onClick={handlePrint} className="p-2.5 hover:bg-slate-50 rounded-xl text-slate-500 hover:text-[#4f46e5] transition-all" title="Print">
            <Printer size={20} />
          </button>
          <button 
            className={cn(
              "p-2.5 rounded-xl transition-all",
              file.role === 'VIEW' ? "text-slate-200 cursor-not-allowed" : "hover:bg-rose-50 text-slate-400 hover:text-rose-500"
            )}
            title="Delete"
            onClick={file.role === 'VIEW' ? null : () => setShowDeleteModal(true)}
            disabled={file.role === 'VIEW'}
          >
            <Trash2 size={20} />
          </button>
          <div className="ml-3 h-9 w-9 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shadow-sm">
            <img src={`https://ui-avatars.com/api/?name=User&background=4f46e5&color=fff`} alt="User" />
          </div>
        </div>
      </header>

      <ConfirmModal 
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete File?"
        message={`Are you sure you want to delete "${file.name}"? This action cannot be undone.`}
      />

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
                    className="bg-slate-50 border-transparent focus:bg-white focus:border-[#4f46e5]/20"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-tight mb-1.5 ml-1">Tags</label>
                  <div className="flex flex-wrap gap-2 p-1">
                    {localMetadata.tags?.map((tag, i) => (
                      <span key={i} className="px-2.5 py-1 bg-indigo-50 text-[#4f46e5] text-[10px] font-bold rounded-lg flex items-center gap-1.5 border border-indigo-100/50 uppercase tracking-wider">
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
                        <button onClick={handleAddTag} className="w-8 h-8 flex items-center justify-center bg-[#4f46e5] text-white rounded-lg hover:bg-[#4338ca] transition-all">
                            <CheckCircle2 size={14} />
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => setIsAddingTag(true)} 
                        className="px-3 py-1 border border-dashed border-slate-200 text-slate-400 text-[10px] font-bold rounded-lg hover:border-[#4f46e5]/50 hover:text-[#4f46e5] transition-all uppercase tracking-widest bg-slate-50/50"
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
            <div className={cn(
              "flex-1 flex flex-col custom-scrollbar overflow-auto items-center p-4 lg:p-12",
              (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file.name?.match(/\.docx$/i)) && "overflow-hidden p-0"
            )}>
            <div 
              className={cn(
                "bg-white shadow-2xl transition-all duration-300 origin-top flex items-center justify-center overflow-hidden rounded-sm",
                (file.type?.startsWith('image/') || file.name?.match(/\.(jpg|jpeg|png|gif|webp)$/i)) 
                  ? "max-w-fit h-auto" 
                  : (file.type === 'application/pdf' || file.name?.match(/\.pdf$/i))
                    ? "w-[816px] min-h-[1123px] h-fit"
                    : "w-full h-full max-w-5xl"
              )}
              style={{ 
                transform: (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file.name?.match(/\.docx$/i)) ? 'none' : `scale(${zoom/100})`,
                boxShadow: (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file.name?.match(/\.docx$/i)) ? 'none' : '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
                margin: '0 auto',
                width: (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file.name?.match(/\.docx$/i)) ? '100%' : undefined,
                height: (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file.name?.match(/\.docx$/i)) ? '100%' : undefined
              }}
            >
              {/* Actual Content */}
              <div className="w-full h-full flex items-center justify-center bg-white relative">
                {activeView === 'ocr' ? (
                  <div className="w-full h-full flex flex-col bg-white">
                    <div className="p-8 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">Review Extracted Text</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Edit OCR output before generating the reconstructed PDF</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="gap-2 font-bold"
                          onClick={() => {
                            navigator.clipboard.writeText(ocrReviewText);
                            showToast('Copied to clipboard!', 'success');
                          }}
                        >
                          <Save size={14} /> Copy Text
                        </Button>
                        <Button
                          size="sm"
                          className="gap-2 font-bold"
                          onClick={handleSave}
                          disabled={file.role === 'VIEW'}
                        >
                          <Save size={14} /> Save Review
                        </Button>
                      </div>
                    </div>
                    <div className="p-8 lg:p-12 overflow-y-auto space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Detected Type</p>
                          <p className="mt-2 text-sm font-bold text-slate-900">{file.document_type_label || 'Needs confirmation'}</p>
                        </div>
                        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Expiry Metadata</p>
                          <p className="mt-2 text-sm font-bold text-slate-900">{file.expiry_text || 'Not detected'}</p>
                        </div>
                        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">OCR Status</p>
                          <p className="mt-2 text-sm font-bold text-slate-900">{file.ocr_status}</p>
                        </div>
                      </div>
                      <div className="rounded-[28px] border border-slate-100 bg-slate-50 p-4">
                        <textarea
                          value={ocrReviewText}
                          onChange={(e) => setOcrReviewText(e.target.value)}
                          readOnly={file.role === 'VIEW'}
                          className="w-full min-h-[820px] resize-none rounded-[22px] border border-slate-200 bg-white px-6 py-6 text-sm leading-7 text-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-[#4f46e5]/30"
                          placeholder="OCR text will appear here after processing completes..."
                        />
                      </div>
                    </div>
                  </div>
                ) : activeView === 'translation' ? (
                  <div className="w-full h-full flex flex-col bg-white">
                    <div className="p-8 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">Translated Text ({file.translation_language})</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Generated via Gemini AI</p>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="gap-2 font-bold"
                        onClick={() => {
                          navigator.clipboard.writeText(file.translated_text);
                          showToast('Copied to clipboard!', 'success');
                        }}
                      >
                        <Save size={14} /> Copy Translation
                      </Button>
                    </div>
                    <div className="p-12 prose prose-slate max-w-none prose-sm overflow-y-auto">
                      <pre className="whitespace-pre-wrap font-sans text-slate-600 leading-relaxed text-base bg-slate-50 p-8 rounded-2xl border border-slate-100 min-h-[800px]">
                        {file.translated_text || 'No translation available.'}
                      </pre>
                    </div>
                  </div>
                ) : (
                  file.file_url ? (
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
                        <div className="mb-6 text-[#4f46e5]">
                          <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
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
                      <div className="w-full h-full flex-1">
                        <DocxEditor ref={editorRef} file={file} readOnly={file.role === 'VIEW'} zoom={zoom} />
                      </div>
                    )
                    // PDF
                    : file.type === 'application/pdf' || file.name?.match(/\.pdf$/i) ? (
                      <div className="w-full h-full min-h-[1123px]">
                        <object 
                          data={`${file.file_url}#toolbar=1&view=FitH&zoom=135`} 
                          type="application/pdf"
                          className="w-full h-full border-none min-h-[1123px]"
                          title={file.name}
                        >
                          <div className="flex flex-col items-center justify-center p-12 text-center h-full bg-slate-50">
                            <FileText size={48} className="text-slate-300 mb-4" />
                            <h3 className="text-lg font-bold text-slate-900 mb-2">Unable to display PDF</h3>
                            <p className="text-sm text-slate-500 mb-6">Your browser might not support inline PDF viewing.</p>
                            <div className="flex gap-3">
                              <Button onClick={() => window.open(file.file_url, '_blank')} variant="outline" className="gap-2">
                                <Maximize2 size={16} /> Open in New Tab
                              </Button>
                              <Button onClick={handleDownload} className="gap-2">
                                <Download size={16} /> Download
                              </Button>
                            </div>
                          </div>
                        </object>
                      </div>
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
                  )
                )}
              </div>
            </div>
          </div>

          {/* Bottom Toolbar */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md border border-slate-100 p-2 rounded-2xl flex items-center shadow-2xl gap-2 z-10 transition-all hover:bg-white">
            <div className="flex items-center gap-1 bg-slate-50 rounded-xl p-1">
              <button 
                onClick={() => setZoom(Math.max(25, zoom - 25))} 
                className="p-2 hover:bg-white hover:text-[#4f46e5] rounded-lg transition-all text-slate-400"
                title="Zoom Out"
              >
                <ZoomOut size={18} />
              </button>
              <div className="w-16 text-center">
                <span className="text-[11px] font-bold text-slate-600 tracking-tighter uppercase">{zoom}%</span>
              </div>
              <button 
                onClick={() => setZoom(Math.min(400, zoom + 25))} 
                className="p-2 hover:bg-white hover:text-[#4f46e5] rounded-lg transition-all text-slate-400"
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
                  className="flex-1 bg-slate-50 border-transparent text-sm focus:bg-white focus:border-[#4f46e5]/20"
                />
                <select 
                  className="w-24 rounded-xl border border-transparent bg-slate-50 px-3 text-xs font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/10 transition-all cursor-pointer"
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
                  className="w-full rounded-xl border border-transparent bg-slate-50 p-3 text-xs text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/10 transition-all min-h-[80px] resize-none"
                />
              </div>

              <Button className="w-full gap-2.5 h-11 font-bold shadow-lg shadow-indigo-100/50" onClick={handleShare} disabled={isSharing}>
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
                      <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 to-[#4f46e5] flex items-center justify-center text-white text-xs font-bold shadow-sm">
                        {share.shared_with_details?.first_name?.[0] || share.shared_with_details?.username?.[0] || 'U'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate">
                          {share.shared_with_details?.first_name || share.shared_with_details?.username}
                        </p>
                        <p className="text-[10px] text-slate-400 font-medium truncate">{share.shared_with_details?.email}</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 bg-indigo-50 text-[#4f46e5] text-[10px] font-bold rounded-lg border border-indigo-100/30 uppercase tracking-tighter">
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

            <div className="pt-6 border-t border-slate-50">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">OCR (Text Recognition)</h3>
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                <Button 
                  variant={file.ocr_status === 'COMPLETED' ? 'outline' : 'primary'} 
                  className={cn(
                    "w-full gap-2.5 h-11 font-bold transition-all shadow-sm",
                    isOCRProcessing && "animate-pulse"
                  )}
                  disabled={!isOCRSupported(file) || isOCRProcessing || file.role === 'VIEW'}
                  onClick={handleRunOCR}
                >
                  {isOCRProcessing ? (
                    <>Processing...</>
                  ) : (
                    <>
                      <ScanText size={18} /> 
                      {file.ocr_status === 'COMPLETED' ? 'Re-run OCR' : 'Extract Text (OCR)'}
                    </>
                  )}
                </Button>
                <div className="mt-4 flex items-center justify-center gap-2">
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    file.ocr_status === 'PENDING' ? "bg-slate-300" :
                    file.ocr_status === 'PROCESSING' ? "bg-indigo-500 animate-pulse" :
                    file.ocr_status === 'COMPLETED' ? "bg-emerald-500" : "bg-rose-500"
                  )} />
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    {!isOCRSupported(file) ? 'Not Supported' : `Status: ${file.ocr_status}`}
                  </span>
                </div>
                {file.ocr_status === 'COMPLETED' && (
                  <div className="mt-5 space-y-4">
                    <button 
                      onClick={() => setActiveView(activeView === 'ocr' ? 'original' : 'ocr')}
                      className="text-[10px] font-bold text-[#4f46e5] underline uppercase tracking-widest block w-full hover:text-[#4338ca] transition-colors"
                    >
                      {activeView === 'ocr' ? 'View Original' : 'Review Extracted Text'}
                    </button>

                    <div className="space-y-3 text-left">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                          Document Type
                        </label>
                        <select
                          value={documentTypeValue}
                          onChange={(e) => setDocumentTypeValue(e.target.value)}
                          disabled={file.role === 'VIEW'}
                          className="w-full rounded-xl border border-transparent bg-white px-3 py-3 text-xs font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/10 transition-all"
                        >
                          <option value="">Auto-detect / Select</option>
                          {SUPPORTED_DOCUMENT_TYPES.map((docType) => (
                            <option key={docType.value} value={docType.value}>{docType.label}</option>
                          ))}
                          <option value="other">Other</option>
                        </select>
                      </div>

                      {documentTypeValue === 'other' && (
                        <Input
                          value={customDocumentType}
                          onChange={(e) => setCustomDocumentType(e.target.value)}
                          placeholder="Enter custom document type"
                          className="bg-white border-transparent text-sm"
                        />
                      )}

                      <div className="rounded-xl bg-white border border-slate-100 p-3 space-y-2">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Detected Type</p>
                          <p className="mt-1 text-xs font-bold text-slate-800">{file.document_type_label || 'Needs confirmation'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Expiry Found</p>
                          <p className="mt-1 text-xs font-bold text-slate-800">{file.expiry_text || 'No expiry metadata detected'}</p>
                        </div>
                      </div>

                      <Button
                        variant="secondary"
                        className="w-full gap-2.5 h-11 font-bold shadow-sm"
                        onClick={handleSave}
                        disabled={file.role === 'VIEW'}
                      >
                        <Save size={16} /> Save OCR Review
                      </Button>

                      <Button
                        className="w-full gap-2.5 h-11 font-bold shadow-lg shadow-indigo-100/50"
                        onClick={handleGenerateNotarized}
                        disabled={file.role === 'VIEW' || isGeneratingNotarized}
                      >
                        <Download size={16} />
                        {isGeneratingNotarized ? 'Generating...' : 'Download Notarized Version'}
                      </Button>

                      {file.notarized_file_url && (
                        <Button
                          variant="outline"
                          className="w-full gap-2 h-11 font-bold"
                          onClick={() => startDownload(file.notarized_file_url, `${file.name.replace(/\.[^.]+$/, '') || file.name}_reconstructed.pdf`)}
                        >
                          <Download size={16} /> Download Current Copy
                        </Button>
                      )}
                    </div>
                  </div>
                )}
                {file.translation_status === 'COMPLETED' && (
                  <button 
                    onClick={() => setActiveView(activeView === 'translation' ? 'original' : 'translation')}
                    className="mt-2 text-[10px] font-bold text-[#4f46e5] underline uppercase tracking-widest block w-full hover:text-[#4338ca] transition-colors"
                  >
                    {activeView === 'translation' ? 'View Original' : `View ${file.translation_language} Translation`}
                  </button>
                )}
              </div>
            </div>

            <div className="pt-6 border-t border-gray-100">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Translate</h3>
              <div className="flex items-center gap-2 mb-4">
                <select 
                    className="flex-1 rounded-xl border border-transparent bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/10 transition-all cursor-pointer"
                    value="Original"
                    disabled
                >
                  <option>Original</option>
                </select>
                <span className="text-slate-300">→</span>
                <select 
                    className="flex-1 rounded-xl border border-transparent bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/10 transition-all cursor-pointer"
                    value={targetLanguage}
                    onChange={(e) => setTargetLanguage(e.target.value)}
                >
                  {languages.map(lang => (
                      <option key={lang} value={lang}>{lang}</option>
                  ))}
                </select>
              </div>
              <Button 
                variant={file.translation_status === 'COMPLETED' ? 'outline' : 'secondary'} 
                className={cn(
                    "w-full gap-2.5 h-11 font-bold shadow-sm",
                    isTranslationProcessing && "animate-pulse"
                )}
                onClick={handleTranslate}
                disabled={isTranslationProcessing || !file.ocr_text || file.role === 'VIEW'}
              >
                {isTranslationProcessing ? (
                    'Translating...'
                ) : (
                    <>
                        <Languages size={18} /> 
                        {file.translation_status === 'COMPLETED' ? 'Re-translate' : 'Translate'}
                    </>
                )}
              </Button>
              {!file.ocr_text && (
                  <p className="mt-2 text-[10px] text-rose-500 font-bold uppercase tracking-tight text-center italic">
                      Run OCR first to extract text for translation
                  </p>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default DocumentView;
