/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X } from 'lucide-react';

interface SidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const SidePanel: React.FC<SidePanelProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  subtitle, 
  children,
  footer
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-[450px] bg-white shadow-2xl border-l border-slate-200 z-50 flex flex-col animate-in slide-in-from-right duration-300">
      <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-950 text-white">
        <div>
          <h3 className="font-bold text-lg">{title}</h3>
          {subtitle && <p className="text-xs text-slate-400 font-mono uppercase tracking-widest">{subtitle}</p>}
        </div>
        <button 
          onClick={onClose}
          className="p-2 hover:bg-slate-800 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6">
        {children}
      </div>

      {footer && (
        <div className="p-6 border-t border-slate-200 bg-slate-50">
          {footer}
        </div>
      )}
    </div>
  );
};
