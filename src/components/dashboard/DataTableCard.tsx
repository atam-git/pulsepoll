'use client'

import Link from 'next/link'
import { ReactNode } from 'react'

interface Column {
  key: string
  label: string
  width?: string
}

interface DataTableCardProps {
  title: string
  viewAllHref?: string
  columns: Column[]
  data: Array<Record<string, any>>
  emptyMessage?: string
  emptyAction?: {
    label: string
    href: string
  }
  renderCell?: (key: string, value: any, row: any) => ReactNode
  onRowClick?: (row: any) => void
}

export function DataTableCard({
  title,
  viewAllHref,
  columns,
  data,
  emptyMessage = 'No data available',
  emptyAction,
  renderCell,
  onRowClick,
}: DataTableCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 px-8 py-6">
        <h3 className="text-xl font-bold text-slate-900">{title}</h3>
        {viewAllHref && (
          <Link
            href={viewAllHref}
            className="text-sm font-semibold text-green-600 hover:text-green-700 transition-colors"
          >
            View All →
          </Link>
        )}
      </div>

      {data.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-16 px-6">
          <svg className="w-12 h-12 text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <p className="text-base text-slate-600 font-medium">{emptyMessage}</p>
          {emptyAction && (
            <Link
              href={emptyAction.href}
              className="mt-6 inline-block px-6 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
            >
              {emptyAction.label}
            </Link>
          )}
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      className="px-8 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-600"
                      style={col.width ? { width: col.width } : undefined}
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {data.map((row, idx) => (
                  <tr
                    key={idx}
                    className={`transition-all duration-200 hover:bg-slate-50 ${
                      onRowClick ? 'cursor-pointer' : ''
                    }`}
                    onClick={() => onRowClick?.(row)}
                  >
                    {columns.map((col) => (
                      <td key={col.key} className="whitespace-nowrap px-8 py-5 text-sm text-slate-700 font-medium">
                        {renderCell ? renderCell(col.key, row[col.key], row) : row[col.key]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile card view */}
          <div className="sm:hidden divide-y divide-slate-200">
            {data.map((row, idx) => (
              <div
                key={idx}
                className={`p-6 transition-colors duration-200 ${onRowClick ? 'cursor-pointer active:bg-slate-50' : ''}`}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((col) => (
                  <div key={col.key} className="flex justify-between items-center py-2">
                    <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">{col.label}</span>
                    <span className="text-sm font-medium text-slate-900">
                      {renderCell ? renderCell(col.key, row[col.key], row) : row[col.key]}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
