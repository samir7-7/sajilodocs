import React, { useState, useEffect, useRef } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import mammoth from 'mammoth';
import { useAuth } from '../../context/AuthContext';
import { fileAPI } from '../../utils/api';
import { useToast } from '../common/Toast';
import { Lock, Unlock, Loader2, Save, FileText, AlertCircle, Maximize2, Minimize2, ChevronDown } from 'lucide-react';
import { Button } from '../common/Button';
import { cn } from '../../utils/cn';

const DocxRichEditor = ({ file, readOnly = false }) => {
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [localLock, setLocalLock] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { user } = useAuth();
  const { showToast } = useToast();
  
  // CRITICAL FIX: Use user.id instead of user.pk
  const isOwner = file?.owner === user?.id;
  const isLockedByOthers = file?.locked_by && file?.locked_by !== user?.id;
  const isLockedByMe = file?.locked_by === user?.id || localLock;
  
  useEffect(() => {
    const loadFile = async () => {
      if (!file?.file_url) return;
      
      setIsLoading(true);
      try {
        const response = await fetch(file.file_url);
        const arrayBuffer = await response.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer });
        setContent(result.value);
      } catch (error) {
        console.error('Failed to load .docx:', error);
        showToast('Failed to load document content', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    loadFile();
  }, [file?.file_url]);

  const handleLock = async () => {
    try {
      await fileAPI.lock(file.id);
      setLocalLock(true);
      showToast('Document locked for editing', 'success');
    } catch (error) {
      showToast(error.response?.data?.error || 'Failed to lock document', 'error');
    }
  };

  const handleUnlock = async () => {
    try {
      await fileAPI.unlock(file.id);
      setLocalLock(false);
      showToast('Document unlocked', 'success');
    } catch (error) {
      showToast(error.response?.data?.error || 'Failed to unlock document', 'error');
    }
  };

  const handleSave = async () => {
    if (!isLockedByMe && !readOnly) {
      showToast('You must lock the document before saving', 'warning');
      return;
    }

    setIsSaving(true);
    try {
      await fileAPI.saveContent(file.id, content);
      showToast('Document saved successfully', 'success');
    } catch (error) {
      showToast(error.response?.data?.error || 'Failed to save document', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-slate-400">
        <Loader2 className="animate-spin mb-4" size={40} />
        <p className="font-medium">Opening your document...</p>
      </div>
    );
  }

  const modules = {
    toolbar: [
        [{ 'font': [] }, { 'size': ['small', false, 'large', 'huge'] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'script': 'sub' }, { 'script': 'super' }],
        [{ 'header': '1' }, { 'header': '2' }, 'blockquote', 'code-block'],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }, { 'indent': '-1' }, { 'indent': '+1' }],
        [{ 'direction': 'rtl' }, { 'align': [] }],
        ['link', 'image', 'video'],
        ['clean']
    ],
  };

  return (
    <div className={cn(
        "flex flex-col h-full bg-[#f8f9fa] transition-all duration-300",
        isFullscreen && "fixed inset-0 z-[100] h-screen w-screen"
    )}>
      {/* Premium Microsoft Word-inspired Ribbon/Header */}
      <div className="flex flex-col bg-white border-b border-slate-200 shadow-sm z-20">
        <div className="flex items-center justify-between px-6 py-2.5 bg-white">
            <div className="flex items-center gap-3">
                <div className="p-1.5 bg-blue-600 rounded shadow-sm">
                    <FileText className="text-white" size={18} />
                </div>
                <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-700 truncate max-w-[300px]">
                            {file.name}
                        </span>
                        <div className="h-4 w-px bg-slate-200" />
                        <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                            Saved to Cloud
                        </span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setIsFullscreen(!isFullscreen)} 
                    className="h-8 px-2 text-slate-500 hover:text-slate-900 border border-transparent hover:border-slate-200"
                >
                    {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                </Button>
                
                <div className="h-6 w-px bg-slate-200 mx-1" />

                {!readOnly && (
                    <>
                        {isLockedByMe ? (
                            <Button 
                                variant="secondary" 
                                size="sm" 
                                onClick={handleUnlock} 
                                className="h-8 px-3 gap-1.5 border-slate-200 text-slate-600 bg-white hover:bg-slate-50 font-medium"
                            >
                                <Unlock size={14} /> Finish
                            </Button>
                        ) : !file.locked_by ? (
                            <Button 
                                variant="primary" 
                                size="sm" 
                                onClick={handleLock} 
                                className="h-8 px-3 gap-1.5 bg-blue-600 hover:bg-blue-700 shadow-sm font-medium"
                            >
                                <Lock size={14} /> Start Editing
                            </Button>
                        ) : isOwner ? (
                             <Button 
                                variant="secondary" 
                                size="sm" 
                                onClick={handleUnlock} 
                                className="h-8 px-3 gap-1.5 border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100 font-medium"
                            >
                                <Unlock size={14} /> Force Unlock
                            </Button>
                        ) : null}

                        <Button 
                            variant="primary" 
                            size="sm" 
                            onClick={handleSave} 
                            disabled={isSaving || !isLockedByMe}
                            className="h-8 px-4 gap-1.5 bg-blue-600 hover:bg-blue-700 shadow-sm font-medium disabled:opacity-50"
                        >
                            {isSaving ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
                            Save
                        </Button>
                    </>
                )}
            </div>
        </div>

        {/* Status Notification Bar */}
        {(isLockedByOthers || isLockedByMe) && (
            <div className={cn(
                "px-6 py-1.5 flex items-center gap-3 border-t",
                isLockedByMe ? "bg-amber-50/50 border-amber-100" : "bg-rose-50/50 border-rose-100"
            )}>
                {isLockedByMe ? (
                    <div className="flex items-center gap-2 text-amber-600">
                        <Lock size={12} strokeWidth={2.5} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">You have an active editing session</span>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 text-rose-600">
                        <AlertCircle size={12} strokeWidth={2.5} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">
                            READ ONLY: Document is currently locked by {file.locked_by_details?.username || 'another user'}
                        </span>
                    </div>
                )}
            </div>
        )}
      </div>

      {/* Word-style centered workspace */}
      <div className="flex-1 overflow-auto custom-workspace py-10 px-4 flex justify-center">
        <div className="a4-page relative shadow-2xl transition-all duration-300">
            {/* Virtual Ruler */}
            <div className="absolute -top-8 left-0 right-0 flex justify-between px-1 text-[9px] text-slate-300 font-medium select-none pointer-events-none uppercase tracking-tighter">
                <span>0"</span>
                <span>1"</span>
                <span>2"</span>
                <span>3"</span>
                <span>4"</span>
                <span>5"</span>
                <span>6"</span>
                <span>7"</span>
                <span>8"</span>
            </div>

            <ReactQuill
                theme="snow"
                value={content}
                onChange={setContent}
                readOnly={!isLockedByMe || readOnly}
                modules={modules}
                className="quill-editor-page"
                placeholder="Start typing your content here..."
            />
        </div>
      </div>

      <style jsx="true" global="true">{`
        .custom-workspace {
            background-color: #f0f2f5;
            perspective: 1000px;
        }

        .a4-page {
            background: white;
            width: 100%;
            max-width: 816px; /* A4 width */
            min-height: 1056px;
            margin-bottom: 60px;
            display: flex;
            flex-direction: column;
            border: 1px solid #d1d5db;
            border-radius: 1px;
            transform-origin: top center;
        }

        .quill-editor-page {
            display: flex;
            flex-direction: column;
            flex: 1;
            min-height: 100%;
        }

        .quill-editor-page .ql-container {
            border: none !important;
            flex: 1;
            height: auto !important;
        }

        .quill-editor-page .ql-toolbar {
            border: none !important;
            border-bottom: 1px solid #edf2f7 !important;
            position: sticky;
            top: 0;
            z-index: 50;
            background: #ffffff;
            padding: 10px 40px !important;
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            gap: 2px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.02);
        }

        .quill-editor-page .ql-editor {
            padding: 96px 110px !important;
            font-size: 15px;
            line-height: 1.65;
            color: #2d3748;
            min-height: 1000px;
            height: auto;
            cursor: text;
        }

        /* Customize Quill Controls */
        .ql-snow.ql-toolbar button, 
        .ql-snow .ql-toolbar button,
        .ql-snow.ql-toolbar .ql-picker-label {
            border-radius: 4px;
            border: 1px solid transparent !important;
            padding: 2px 4px;
        }

        .ql-snow.ql-toolbar button:hover,
        .ql-snow.ql-toolbar .ql-picker-label:hover {
            background: #f7fafc !important;
            border-color: #e2e8f0 !important;
            color: #3182ce !important;
        }

        .ql-snow.ql-toolbar button.ql-active {
            background: #ebf8ff !important;
            color: #3182ce !important;
            border-color: #bee3f8 !important;
        }

        .ql-snow .ql-stroke {
            stroke: #4a5568;
        }
        
        .ql-snow .ql-fill {
            fill: #4a5568;
        }

        .ql-snow .ql-picker {
            color: #4a5568;
            font-size: 12px;
            font-weight: 500;
        }

        /* Custom scrollbar for the workspace */
        .custom-workspace::-webkit-scrollbar {
            width: 12px;
        }
        .custom-workspace::-webkit-scrollbar-track {
            background: #f0f2f5;
        }
        .custom-workspace::-webkit-scrollbar-thumb {
            background: #cbd5e0;
            border-radius: 10px;
            border: 3px solid #f0f2f5;
        }
        .custom-workspace::-webkit-scrollbar-thumb:hover {
            background: #a0aec0;
        }

        /* Fix for color picker alignment */
        .ql-color .ql-picker-options, .ql-background .ql-picker-options {
            padding: 8px !important;
            border-radius: 8px !important;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1) !important;
        }
      `}</style>
    </div>
  );
};

export default DocxRichEditor;
