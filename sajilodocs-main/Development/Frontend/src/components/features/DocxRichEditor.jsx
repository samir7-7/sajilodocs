import React, { useState, useEffect, useRef } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import mammoth from 'mammoth';
import { useAuth } from '../../context/AuthContext';
import { fileAPI } from '../../utils/api';
import { useToast } from '../common/Toast';
import { Lock, Unlock, Loader2, Save, FileText, AlertCircle, Maximize2, Minimize2, ChevronDown, CheckCircle2 } from 'lucide-react';
import { Button } from '../common/Button';
import { cn } from '../../utils/cn';

const DocxRichEditor = React.forwardRef(({ file, readOnly = false, zoom = 100 }, ref) => {
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [localLock, setLocalLock] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { user } = useAuth();
  const { showToast } = useToast();
  
  // Expose handleSave to parent
  React.useImperativeHandle(ref, () => ({
    save: handleSave,
    isSaving
  }));

  // CRITICAL FIX: Use user.id instead of user.pk
  const isOwner = file?.owner === user?.id;
  const isLockedByOthers = file?.locked_by && file?.locked_by !== user?.id;
  const isLockedByMe = file?.locked_by === user?.id || localLock;
  
  useEffect(() => {
    const loadFile = async () => {
      if (!file?.file_url) return;
      
      setIsLoading(true);
      try {
        // Add cache buster to ensure we get the latest content after a save
        const cacheBuster = `t=${new Date().getTime()}`;
        const urlWithBuster = file.file_url.includes('?') 
            ? `${file.file_url}&${cacheBuster}` 
            : `${file.file_url}?${cacheBuster}`;
        
        const response = await fetch(urlWithBuster);
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
    toolbar: '#toolbar',
  };

  return (
    <div className={cn(
        "flex flex-col h-full bg-[#f3f4f6] transition-all duration-300",
        isFullscreen && "fixed inset-0 z-[100] h-screen w-screen"
    )}>
      {/* Premium Microsoft Word-inspired Ribbon/Header - FIXED at top of flex container */}
      <div className="flex flex-col bg-white border-b border-slate-200 shadow-sm z-30 relative shrink-0">
        <div className="flex items-center justify-between px-6 py-2.5 bg-white">
            <div className="flex items-center gap-3">
                <div className="p-1.5 bg-[#4f46e5] rounded shadow-sm">
                    <FileText className="text-white" size={18} />
                </div>
                <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-700 truncate max-w-[300px]">
                            {file.name}
                        </span>
                        <div className="h-4 w-px bg-slate-200" />
                        <div className="flex items-center gap-1.5">
                            {isSaving ? (
                                <Loader2 className="animate-spin text-slate-400" size={10} />
                            ) : (
                                <CheckCircle2 className="text-emerald-500" size={10} />
                            )}
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                {isSaving ? 'Syncing...' : 'Cloud Synced'}
                            </span>
                        </div>
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
                                <Unlock size={14} /> Finish Editing
                            </Button>
                        ) : !file.locked_by ? (
                            <Button 
                                variant="primary" 
                                size="sm" 
                                onClick={handleLock} 
                                className="h-8 px-3 gap-1.5 bg-[#4f46e5] hover:bg-[#4338ca] shadow-sm font-medium"
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
                            className="h-8 px-4 gap-1.5 bg-emerald-600 hover:bg-emerald-700 shadow-sm font-medium disabled:opacity-50"
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
                        <span className="text-[10px] font-bold uppercase tracking-widest">Active session: Changes can be saved</span>
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

        {/* PERSISTENT TOOLBAR AREA */}
        <div 
          className={cn(
            "bg-white border-t border-slate-100 transition-all duration-300 overflow-hidden",
            (!isLockedByMe || readOnly) ? "h-0 opacity-0" : "h-auto opacity-100"
          )}
        >
          <div id="toolbar" className="!border-none !bg-white px-6 py-2 flex flex-wrap items-center justify-start gap-px overflow-x-auto no-scrollbar">
            <span className="ql-formats">
                <select className="ql-font"></select>
                <select className="ql-size"></select>
            </span>
            <div className="h-6 w-px bg-slate-200 mx-2 self-center" />
            <span className="ql-formats">
                <button className="ql-bold"></button>
                <button className="ql-italic"></button>
                <button className="ql-underline"></button>
                <button className="ql-strike"></button>
            </span>
            <div className="h-6 w-px bg-slate-200 mx-2 self-center" />
            <span className="ql-formats">
                <select className="ql-color"></select>
                <select className="ql-background"></select>
            </span>
            <div className="h-6 w-px bg-slate-200 mx-2 self-center" />
            <span className="ql-formats">
                <button className="ql-script" value="sub"></button>
                <button className="ql-script" value="super"></button>
            </span>
            <div className="h-6 w-px bg-slate-200 mx-2 self-center" />
            <span className="ql-formats">
                <button className="ql-header" value="1"></button>
                <button className="ql-header" value="2"></button>
                <button className="ql-blockquote"></button>
                <button className="ql-code-block"></button>
            </span>
            <div className="h-6 w-px bg-slate-200 mx-2 self-center" />
            <span className="ql-formats">
                <button className="ql-list" value="ordered"></button>
                <button className="ql-list" value="bullet"></button>
                <button className="ql-indent" value="-1"></button>
                <button className="ql-indent" value="+1"></button>
            </span>
            <div className="h-6 w-px bg-slate-200 mx-2 self-center" />
            <span className="ql-formats">
                <select className="ql-align"></select>
            </span>
            <div className="h-6 w-px bg-slate-200 mx-2 self-center" />
            <span className="ql-formats">
                <button className="ql-link"></button>
                <button className="ql-image"></button>
                <button className="ql-video"></button>
            </span>
            <div className="h-6 w-px bg-slate-200 mx-2 self-center" />
            <span className="ql-formats">
                <button className="ql-clean" title="Clear Formatting"></button>
            </span>
          </div>
        </div>
      </div>

      {/* Word-style centered workspace - IMPROVED Scrolling */}
      <div className="flex-1 overflow-y-auto overflow-x-auto custom-workspace py-12 px-8 flex flex-col items-center">
        <div 
            className="a4-page relative shadow-2xl transition-all duration-300 mb-20 shrink-0"
            style={{ 
                transform: `scale(${zoom/100})`, 
                transformOrigin: 'top center',
                marginBottom: `${20 * (zoom/100)}px` // Adjust margin to avoid cutting off
            }}
        >
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
            background-color: #f3f4f6;
        }

        .a4-page {
            background: white;
            width: 100%;
            max-width: 816px; /* A4 width */
            min-height: 1056px;
            display: flex;
            flex-direction: column;
            border: 1px solid #e5e7eb;
            border-radius: 1px;
        }

        .quill-editor-page {
            display: flex;
            flex-direction: column;
            flex: 1;
        }

        .quill-editor-page .ql-container {
            border: none !important;
            flex: 1;
        }

        /* PERSISTENT TOOLBAR STYLES */
        #toolbar {
            border: none !important;
            padding: 4px 12px !important;
            display: flex;
            flex-wrap: wrap;
            gap: 2px;
            background: #ffffff !important;
        }

        .quill-editor-page .ql-toolbar {
            display: none !important; /* Hide the default one if it appears */
        }

        .quill-editor-page .ql-editor {
            padding: 60px 80px !important;
            font-size: 15px;
            line-height: 1.7;
            color: #1f2937;
            min-height: 980px;
            height: auto;
            cursor: text;
        }

        /* Mobile adjustments and better fit */
        @media (max-width: 640px) {
            .quill-editor-page .ql-editor {
                padding: 40px 30px !important;
            }
            .quill-editor-page .ql-toolbar {
                padding: 8px !important;
            }
        }

        /* Customize Quill Controls */
        .ql-snow.ql-toolbar button, 
        .ql-snow .ql-toolbar button,
        .ql-snow.ql-toolbar .ql-picker-label {
            border-radius: 4px;
            border: 1px solid transparent !important;
        }

        .ql-snow.ql-toolbar button:hover,
        .ql-snow.ql-toolbar .ql-picker-label:hover {
            background: #f3f4f6 !important;
            color: #4f46e5 !important;
        }

        .ql-snow.ql-toolbar button.ql-active {
            background: #eff6ff !important;
            color: #4f46e5 !important;
        }

        .ql-snow .ql-stroke {
            stroke: #4b5563;
        }
        
        .ql-snow .ql-fill {
            fill: #4b5563;
        }

        /* Custom scrollbar for the workspace */
        .custom-workspace::-webkit-scrollbar {
            width: 8px;
        }
        .custom-workspace::-webkit-scrollbar-track {
            background: transparent;
        }
        .custom-workspace::-webkit-scrollbar-thumb {
            background: #d1d5db;
            border-radius: 10px;
        }
        .custom-workspace::-webkit-scrollbar-thumb:hover {
            background: #9ca3af;
        }
      `}</style>
    </div>
  );
});

export default DocxRichEditor;
