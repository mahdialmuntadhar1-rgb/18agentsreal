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
  className?: string;
  headerClassName?: string;
  rowClassName?: string;
  pagination?: {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    pageSize: number;
    onPageSizeChange?: (size: number) => void;
    totalCount?: number;
  };
}

export function DataTable<T>({ 
  columns, 
  data, 
  onRowClick, 
  keyExtractor,
  dense = false,
  sortConfig,
  onSort,
  className = "bg-white border border-slate-200 shadow-sm rounded-lg",
  headerClassName = "bg-slate-50/50 text-slate-500 border-b border-slate-200",
  rowClassName = "divide-y divide-slate-100",
  pagination
}: DataTableProps<T>) {
  return (
    <div className={`${className} overflow-hidden flex flex-col`}>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className={`${headerClassName} text-[10px] uppercase font-bold tracking-wider`}>
            <tr>
              {columns.map((col, i) => {
                const isSortable = !!col.sortKey && !!onSort;
                const isSorted = sortConfig?.key === col.sortKey;
                
                return (
                  <th 
                    key={i} 
                    className={`px-6 py-4 ${col.headerClassName || ''} ${isSortable ? 'cursor-pointer hover:bg-slate-100/80 transition-colors' : ''}`}
                    onClick={() => isSortable && onSort(col.sortKey!)}
                  >
                    <div className="flex items-center space-x-1.5">
                      <span>{col.header}</span>
                      {isSortable && (
                        <span className="text-slate-400">
                          {isSorted ? (
                            sortConfig.direction === 'asc' ? <ChevronUp className="w-3.5 h-3.5 text-blue-600" /> : <ChevronDown className="w-3.5 h-3.5 text-blue-600" />
                          ) : (
                            <ChevronsUpDown className="w-3.5 h-3.5 opacity-30" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className={rowClassName}>
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <div className="p-3 bg-slate-50 rounded-full">
                      <ChevronsUpDown className="w-6 h-6 text-slate-300" />
                    </div>
                    <p className="text-slate-400 text-sm font-medium">No records found in this view.</p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <tr 
                  key={keyExtractor(item)} 
                  onClick={() => onRowClick?.(item)}
                  className={`transition-colors group ${onRowClick ? 'hover:bg-blue-50/30 cursor-pointer' : 'hover:bg-slate-50/50'}`}
                >
                  {columns.map((col, i) => (
                    <td key={i} className={`px-6 ${dense ? 'py-3' : 'py-4.5'} ${col.className || ''}`}>
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

      {pagination && (
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/30 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <p className="text-xs text-slate-500 font-medium">
              Showing <span className="text-slate-900">{data.length}</span> of <span className="text-slate-900">{pagination.totalCount || 'many'}</span> results
            </p>
            {pagination.onPageSizeChange && (
              <select 
                className="text-xs bg-transparent border-none focus:ring-0 text-slate-600 font-bold cursor-pointer"
                value={pagination.pageSize}
                onChange={(e) => pagination.onPageSizeChange?.(Number(e.target.value))}
              >
                <option value={10}>10 per page</option>
                <option value={25}>25 per page</option>
                <option value={50}>50 per page</option>
                <option value={100}>100 per page</option>
              </select>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <button 
              disabled={pagination.currentPage === 1}
              onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
              className="p-1.5 rounded border border-slate-200 bg-white text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
            >
              <ChevronUp className="w-4 h-4 -rotate-90" />
            </button>
            
            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                // Simple pagination logic for demo
                let pageNum = i + 1;
                if (pagination.totalPages > 5 && pagination.currentPage > 3) {
                  pageNum = pagination.currentPage - 3 + i + 1;
                  if (pageNum > pagination.totalPages) pageNum = pagination.totalPages - (4 - i);
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => pagination.onPageChange(pageNum)}
                    className={`min-w-[32px] h-8 text-xs font-bold rounded transition-colors ${
                      pagination.currentPage === pageNum 
                        ? 'bg-blue-600 text-white shadow-sm' 
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button 
              disabled={pagination.currentPage === pagination.totalPages}
              onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
              className="p-1.5 rounded border border-slate-200 bg-white text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
            >
              <ChevronUp className="w-4 h-4 rotate-90" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
