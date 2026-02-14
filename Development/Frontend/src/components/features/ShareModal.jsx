import React, { useState } from 'react';
import { X, Mail, Shield, Calendar, MessageSquare, Share2 } from 'lucide-react';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { cn } from '../../utils/cn';
import { shareAPI } from '../../utils/api';
import { useFileSystem } from '../../context/FileSystemContext';

const ShareModal = ({ isOpen, onClose, item, type = 'file' }) => {
  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState('VIEW');
  const [expiration, setExpiration] = useState('');
  const [message, setMessage] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  const { showToast } = useFileSystem();

  if (!isOpen || !item) return null;

  const handleShare = async () => {
    if (!email) {
      showToast('Please enter an email address', 'error');
      return;
    }

    setIsSharing(true);
    try {
      const payload = {
        [type]: item.id,
        shared_with_email: email,
        permission: permission,
        expires_at: expiration || null,
        message: message,
      };

      if (type === 'file') {
        await shareAPI.shareFile(payload);
      } else {
        await shareAPI.shareFolder(payload);
      }

      showToast(`Access granted to ${email} as ${permission}`, 'success');
      onClose();
      setEmail('');
      setExpiration('');
      setMessage('');
    } catch (error) {
      console.error('Share failed:', error);
      const errorMsg = error.response?.data?.non_field_errors?.[0] || 
                       error.response?.data?.detail || 
                       'Failed to share item';
      showToast(errorMsg, 'error');
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-8 pt-8 pb-6 flex items-center justify-between border-b border-slate-50">
          <div>
            <h2 className="text-xl font-bold text-slate-900 leading-tight">Share {type === 'file' ? 'File' : 'Folder'}</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Manage access & permissions</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-8 space-y-6">
          <div className="flex items-center gap-4 p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
             <div className="p-2.5 bg-white rounded-xl shadow-sm border border-slate-100">
                <Share2 size={24} className="text-[#0061FF]" />
             </div>
             <div className="min-w-0">
                <h4 className="font-bold text-slate-900 truncate">{item.name}</h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Current implementation: Read-only access by default</p>
             </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Recipient Email</label>
              <div className="relative">
                <Input
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12 bg-slate-50/50 border-transparent focus:bg-white focus:border-[#0061FF]/20 text-sm font-medium"
                />
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Access Role</label>
                <div className="relative">
                  <select
                    className="w-full h-12 bg-slate-50/50 border-transparent rounded-xl px-10 text-xs font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#0061FF]/10 appearance-none cursor-pointer"
                    value={permission}
                    onChange={(e) => setPermission(e.target.value)}
                  >
                    <option value="VIEW">Viewer</option>
                    <option value="EDIT">Editor</option>
                  </select>
                  <Shield size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Expires On</label>
                <div className="relative">
                  <Input
                    type="date"
                    value={expiration}
                    onChange={(e) => setExpiration(e.target.value)}
                    className="pl-10 h-12 bg-slate-50/50 border-transparent focus:bg-white focus:border-[#0061FF]/20 text-xs font-bold text-slate-600"
                  />
                  <Calendar size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Personal Message</label>
              <div className="relative">
                <textarea
                  placeholder="Add a message (optional)"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full rounded-2xl border border-transparent bg-slate-50/50 p-4 pl-10 text-xs text-slate-600 font-medium focus:outline-none focus:ring-2 focus:ring-[#0061FF]/10 transition-all min-h-[100px] resize-none"
                />
                <MessageSquare size={16} className="absolute left-3.5 top-5 text-slate-300" />
              </div>
            </div>
          </div>
        </div>

        <div className="px-8 py-6 bg-slate-50/50 flex flex-col gap-3 border-t border-slate-50">
          <Button 
            className="w-full h-12 gap-2.5 font-bold shadow-lg shadow-blue-500/10" 
            onClick={handleShare} 
            disabled={isSharing}
          >
            {isSharing ? 'Processing...' : `Share ${type === 'file' ? 'File' : 'Folder'}`}
          </Button>
          <button 
            onClick={onClose}
            className="w-full py-2 text-[10px] font-black text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-[0.2em]"
          >
            Cancel and Go Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
