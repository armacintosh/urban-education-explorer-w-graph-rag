import { useState, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  ColumnDef,
  SortingState,
  ColumnFiltersState,
} from '@tanstack/react-table';
import { ArrowUpDown, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { Institution } from '../types/institution';

interface DataTableProps {
  data: Institution[];
  onRowHover: (institution: Institution | null) => void;
}

const formatNumber = (value: number | null): string => {
  if (value === null || isNaN(value)) return 'N/A';
  return value.toLocaleString();
};

const formatPercent = (value: number | null): string => {
  if (value === null || isNaN(value)) return 'N/A';
  return `${(value * 100).toFixed(1)}%`;
};

const formatCurrency = (value: number | null): string => {
  if (value === null || isNaN(value)) return 'N/A';
  return `$${value.toLocaleString()}`;
};

export default function DataTable({ data, onRowHover }: DataTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  const columns = useMemo<ColumnDef<Institution>[]>(() => [
    {
      accessorKey: 'inst_name',
      header: 'Institution Name',
    },
    {
      accessorKey: 'admit_rate',
      header: 'Admission Rate',
      cell: info => formatPercent(info.getValue() as number),
    },
    {
      accessorKey: 'number_enrolled_total',
      header: 'Enrollment',
      cell: info => formatNumber(info.getValue() as number),
    },
    {
      accessorKey: 'yield_rate',
      header: 'Yield Rate',
      cell: info => formatPercent(info.getValue() as number),
    },
    {
      accessorKey: 'sum_average_amount',
      header: 'Avg. Amount',
      cell: info => formatCurrency(info.getValue() as number),
    },
  ], []);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const exportData = () => {
    const headers = columns.map(col => String(col.header)).join(',');
    const rows = data.map(row => 
      columns.map(col => row[col.accessorKey as keyof Institution]).join(',')
    ).join('\n');
    const csv = `${headers}\n${rows}`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'institutions.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white shadow-lg rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <input
          type="text"
          placeholder="Search all columns..."
          value={globalFilter}
          onChange={e => setGlobalFilter(e.target.value)}
          className="border rounded-lg p-2 w-64"
        />
        <button
          onClick={exportData}
          className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th key={header.id} className="px-4 py-2 text-left">
                    {header.isPlaceholder ? null : (
                      <div className="flex items-center gap-1 cursor-pointer" onClick={() => header.column.toggleSorting()}>
                        {String(header.column.columnDef.header)}
                        <ArrowUpDown className="w-4 h-4" />
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map(row => (
              <tr
                key={row.id}
                className="hover:bg-gray-100 cursor-pointer"
                onMouseEnter={() => onRowHover(row.original)}
                onMouseLeave={() => onRowHover(null)}
              >
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id} className="px-4 py-2 border-t">
                    {cell.column.columnDef.cell?.(cell) ?? String(cell.getValue())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-gray-600">
          Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{' '}
          {Math.min(
            (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
            table.getFilteredRowModel().rows.length
          )}{' '}
          of {table.getFilteredRowModel().rows.length} results
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="p-2 disabled:opacity-50"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm">
            Page {table.getState().pagination.pageIndex + 1} of{' '}
            {table.getPageCount()}
          </span>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="p-2 disabled:opacity-50"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}