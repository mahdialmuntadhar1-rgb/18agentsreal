/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const STATUS_COLORS = {
  // Job Statuses
  IDLE: 'bg-slate-50 text-slate-500 border-slate-100',
  RUNNING: 'bg-blue-50 text-blue-700 border-blue-100',
  PAUSED: 'bg-amber-50 text-amber-700 border-amber-100',
  COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  WAITING: 'bg-amber-50 text-amber-700 border-amber-100',
  FAILED: 'bg-rose-50 text-rose-700 border-rose-100',

  // Record Statuses
  RAW: 'bg-slate-50 text-slate-700 border-slate-100',
  NEEDS_CLEANING: 'bg-orange-50 text-orange-700 border-orange-100',
  DUPLICATE_SUSPECT: 'bg-purple-50 text-purple-700 border-purple-100',
  STAGED: 'bg-cyan-50 text-cyan-700 border-cyan-100',
  APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  REJECTED: 'bg-rose-50 text-rose-700 border-rose-100',
} as const;

export type StatusType = keyof typeof STATUS_COLORS;
