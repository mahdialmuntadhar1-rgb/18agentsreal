/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { STATUS_COLORS, StatusType } from '../constants/statusColors';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const colorClass = STATUS_COLORS[status as StatusType] || 'bg-slate-50 text-slate-700 border-slate-100';
  
  return (
    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${colorClass} ${className}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
};
