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
    <div className="rounded-lg border border-gray-200 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {viewAllHref && (
          <Link
            href={viewAllHref}
            className="text-sm font-medium text-primary-base transition-colors hover:text-primary-dark"
          >
            View All
          </Link>
        )}
      </div>

      {data.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-12 px-6">
          <p className="text-sm text-gray-500">{emptyMessage}</p>
          {emptyAction && (
            <Link
              href={emptyAction.href}
              className="mt-3 text-sm font-medium text-primary-base transition-colors hover:text-primary-dark"
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
                <tr className="bg-gray-50">
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                      style={col.width ? { width: col.width } : undefined}
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.map((row, idx) => (
                  <tr
                    key={idx}
                    className={`transition-colors hover:bg-gray-50 ${
                      onRowClick ? 'cursor-pointer' : ''
                    }`}
                    onClick={() => onRowClick?.(row)}
                  >
                    {columns.map((col) => (
                      <td key={col.key} className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">
                        {renderCell ? renderCell(col.key, row[col.key], row) : row[col.key]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile card view */}
          <div className="sm:hidden divide-y divide-gray-200">
            {data.map((row, idx) => (
              <div
                key={idx}
                className={`p-4 ${onRowClick ? 'cursor-pointer active:bg-gray-50' : ''}`}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((col) => (
                  <div key={col.key} className="flex justify-between py-1">
                    <span className="text-xs font-medium text-gray-500">{col.label}</span>
                    <span className="text-sm text-gray-700">
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
