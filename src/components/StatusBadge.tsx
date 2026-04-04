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
  const colorClass = STATUS_COLORS[status as StatusType] || 'bg-slate-500 text-white';
  
  return (
    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${colorClass} ${className}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
};
