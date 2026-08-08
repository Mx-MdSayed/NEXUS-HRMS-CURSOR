import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import {
  flexRender,
  type ColumnVisibilityState,
  type PaginationState,
  type SortingState,
} from '@tanstack/react-table'
import {
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useLegacyTable,
} from '@tanstack/react-table/legacy'
import { ArrowDown, ArrowUp, ArrowUpDown, Columns3, Search } from 'lucide-react'
import { Button, Card, CardContent, EmptyState, Input } from '@/components/ui'

export interface ReportTableColumn<T extends object> {
  key: keyof T
  header: string
  render?: (row: T) => ReactNode
  enableHiding?: boolean
}

interface ReportTableProps<T extends object> {
  title: string
  rows: T[]
  columns: Array<ReportTableColumn<T>>
  searchPlaceholder?: string
  pageSize?: number
}

export function ReportTable<T extends object>({
  title,
  rows,
  columns,
  searchPlaceholder = 'Search table...',
  pageSize = 10,
}: ReportTableProps<T>) {
  const [search, setSearch] = useState('')
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibilityState>({})
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize,
  })

  const columnSignature = columns.map((column) => `${String(column.key)}:${column.header}`).join('|')

  const tableColumns = useMemo(
    () =>
      columns.map((column) => ({
        id: String(column.key),
        accessorFn: (row: T) => row[column.key],
        header: column.header,
        enableHiding: column.enableHiding ?? true,
        cell: (info: { row: { original: T }; getValue: () => unknown }) =>
          column.render ? column.render(info.row.original) : String(info.getValue() ?? '—'),
      })),
    // Column renderers are captured from the latest matching signature.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [columnSignature],
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return rows
    const keys = columnSignature.split('|').map((part) => part.split(':')[0] ?? '')
    return rows.filter((row) =>
      keys.some((key) => String(row[key as keyof T] ?? '').toLowerCase().includes(q)),
    )
  }, [columnSignature, rows, search])

  const table = useLegacyTable({
    data: filtered,
    columns: tableColumns as never,
    state: {
      sorting,
      columnVisibility,
      pagination,
    },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  const pageCount = Math.max(1, table.getPageCount())
  const pageIndex = table.getState().pagination.pageIndex
  const visibleRows = table.getRowModel().rows

  return (
    <Card>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-card-title">{title}</h2>
          <div className="flex flex-wrap items-center gap-2 no-print">
            <Input
              className="w-64"
              placeholder={searchPlaceholder}
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)
                setPagination((prev) => ({ ...prev, pageIndex: 0 }))
              }}
              leftIcon={<Search className="h-4 w-4" />}
              aria-label={`Search ${title}`}
            />
            <details className="relative">
              <summary className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-surface-300 px-3 text-sm dark:border-surface-700">
                <Columns3 className="h-4 w-4" /> Columns
              </summary>
              <div className="absolute right-0 z-10 mt-2 w-56 rounded-lg border border-surface-200 bg-white p-3 shadow-elevated dark:border-surface-700 dark:bg-surface-900">
                {table.getAllLeafColumns().map((column) => (
                  <label key={column.id} className="flex items-center gap-2 py-1 text-sm">
                    <input
                      type="checkbox"
                      checked={column.getIsVisible()}
                      disabled={!column.getCanHide()}
                      onChange={column.getToggleVisibilityHandler()}
                    />
                    {column.id}
                  </label>
                ))}
              </div>
            </details>
          </div>
        </div>

        {rows.length === 0 ? (
          <EmptyState title="No report rows" description="No data available for the selected filters." />
        ) : filtered.length === 0 ? (
          <EmptyState title="No matching rows" description="No rows matched the current table search." />
        ) : (
          <>
            <div className="overflow-x-auto rounded-lg border border-surface-200 dark:border-surface-800">
              <table className="min-w-full divide-y divide-surface-200 text-sm dark:divide-surface-800">
                <thead className="bg-surface-50 dark:bg-surface-900">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <th
                          key={header.id}
                          scope="col"
                          className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-surface-500"
                        >
                          <button
                            type="button"
                            className="inline-flex items-center gap-1"
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {header.column.getIsSorted() === 'asc' ? (
                              <ArrowUp className="h-3 w-3" aria-hidden />
                            ) : header.column.getIsSorted() === 'desc' ? (
                              <ArrowDown className="h-3 w-3" aria-hidden />
                            ) : (
                              <ArrowUpDown className="h-3 w-3" aria-hidden />
                            )}
                          </button>
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody className="divide-y divide-surface-100 bg-white dark:divide-surface-800 dark:bg-surface-900">
                  {visibleRows.map((row) => (
                    <tr key={row.id}>
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-4 py-3 text-surface-700 dark:text-surface-200">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-surface-500 no-print">
              <span>
                Showing {visibleRows.length} of {filtered.length} rows
              </span>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={!table.getCanPreviousPage()}
                  onClick={() => table.previousPage()}
                >
                  Previous
                </Button>
                <span className="flex items-center px-2">
                  Page {pageIndex + 1} of {pageCount}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={!table.getCanNextPage()}
                  onClick={() => table.nextPage()}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
