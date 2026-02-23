import React from 'react';
import { Trash2, AlertCircle, X } from 'lucide-react';
import { Button } from './Button';
import { cn } from '../../utils/cn';

const ConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Are you sure?", 
  message = "This action cannot be undone.", 
  confirmText = "Delete", 
  cancelText = "Cancel",
  variant = "danger" // 'danger' | 'warning' | 'info'
}) => {
  if (!isOpen) return null;

  const variants = {
    danger: {
      icon: <Trash2 size={24} />,
      iconBg: "bg-rose-50",
      iconColor: "text-rose-500",
      confirmBtn: "bg-rose-500 hover:bg-rose-600 text-white shadow-rose-200"
    },
    warning: {
      icon: <AlertCircle size={24} />,
      iconBg: "bg-amber-50",
      iconColor: "text-amber-500",
      confirmBtn: "bg-amber-500 hover:bg-amber-600 text-white shadow-amber-200"
    },
    info: {
      icon: <AlertCircle size={24} />,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-500",
      confirmBtn: "bg-blue-500 hover:bg-blue-600 text-white shadow-blue-200"
    }
  };

  const currentVariant = variants[variant] || variants.danger;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", currentVariant.iconBg, currentVariant.iconColor)}>
              {currentVariant.icon}
            </div>
            <button 
              onClick={onClose}
              className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
          <p className="text-sm text-slate-500 leading-relaxed">
            {message}
          </p>
        </div>
        <div className="bg-slate-50 p-4 flex gap-3">
          <Button 
            variant="ghost" 
            className="flex-1 font-bold text-slate-600 hover:bg-white border border-slate-200" 
            onClick={onClose}
          >
            {cancelText}
          </Button>
          <Button 
            className={cn("flex-1 font-bold shadow-lg transition-all active:scale-95", currentVariant.confirmBtn)} 
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
