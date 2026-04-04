/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const STATUS_COLORS = {
  // Job Statuses
  RUNNING: 'bg-blue-500 text-white',
  COMPLETED: 'bg-green-500 text-white',
  WAITING: 'bg-yellow-500 text-black',
  FAILED: 'bg-red-500 text-white',

  // Record Statuses
  RAW: 'bg-gray-500 text-white',
  NEEDS_CLEANING: 'bg-orange-500 text-white',
  DUPLICATE_SUSPECT: 'bg-purple-500 text-white',
  STAGED: 'bg-cyan-500 text-white',
  APPROVED: 'bg-emerald-500 text-white',
  REJECTED: 'bg-rose-500 text-white',
} as const;

export type StatusType = keyof typeof STATUS_COLORS;
