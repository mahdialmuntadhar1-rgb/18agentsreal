/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

export interface Column<T> {
  header: string;
  accessor: keyof T | ((item: T) => React.ReactNode);
  className?: string;
  headerClassName?: string;
  sortKey?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (item: T) => void;
  keyExtractor: (item: T) => string;
  dense?: boolean;
  sortConfig?: { key: string; direction: 'asc' | 'desc' } | null;
  onSort?: (key: string) => void;
}

export function DataTable<T>({ 
  columns, 
  data, 
  onRowClick, 
  keyExtractor,
  dense = false,
  sortConfig,
  onSort
}: DataTableProps<T>) {
  return (
    <div className="bg-white border border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold tracking-wider border-b border-slate-200">
            <tr>
              {columns.map((col, i) => {
                const isSortable = !!col.sortKey && !!onSort;
                const isSorted = sortConfig?.key === col.sortKey;
                
                return (
                  <th 
                    key={i} 
                    className={`px-6 py-4 ${col.headerClassName || ''} ${isSortable ? 'cursor-pointer hover:bg-slate-100 transition-colors' : ''}`}
                    onClick={() => isSortable && onSort(col.sortKey!)}
                  >
                    <div className="flex items-center space-x-1">
                      <span>{col.header}</span>
                      {isSortable && (
                        <span className="text-slate-400">
                          {isSorted ? (
                            sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                          ) : (
                            <ChevronsUpDown className="w-3 h-3 opacity-30" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center text-slate-400 text-sm">
                  No records found.
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <tr 
                  key={keyExtractor(item)} 
                  onClick={() => onRowClick?.(item)}
                  className={`transition-colors ${onRowClick ? 'hover:bg-slate-50 cursor-pointer' : ''}`}
                >
                  {columns.map((col, i) => (
                    <td key={i} className={`px-6 ${dense ? 'py-3' : 'py-4'} ${col.className || ''}`}>
                      {typeof col.accessor === 'function' 
                        ? col.accessor(item) 
                        : (item[col.accessor] as React.ReactNode)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
