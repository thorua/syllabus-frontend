import { ReactNode } from 'react';
import { TableSkeleton } from '../ui/loading-skeleton';

interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => ReactNode;
  className?: string;
  sortable?: boolean;
}

interface RowAction<T> {
  label: string;
  icon?: ReactNode;
  onClick: (item: T) => void;
  variant?: 'default' | 'danger';
  if?: (item: T) => boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  emptyMessage?: string;
  emptyIcon?: ReactNode;
  rowActions?: RowAction<T>[];
  keyExtractor: (item: T) => string;
  onRowClick?: (item: T) => void;
}

function DataTable<T>({
  columns,
  data,
  isLoading = false,
  emptyMessage = 'No hay datos para mostrar',
  emptyIcon,
  rowActions = [],
  keyExtractor,
  onRowClick,
}: DataTableProps<T>) {
  if (isLoading) {
    return <TableSkeleton rows={data.length || 5} />;
  }

  return (
    <div className="w-full overflow-x-auto rounded-lg border border-gray-200">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 ${col.className || ''}`}
              >
                {col.header}
              </th>
            ))}
            {rowActions.length > 0 && (
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                Acciones
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length + (rowActions.length > 0 ? 1 : 0)}
                className="px-4 py-12 text-center"
              >
                {emptyIcon && (
                  <div className="mx-auto mb-3 w-12 h-12 text-gray-400">{emptyIcon}</div>
                )}
                <p className="text-sm text-gray-500">{emptyMessage}</p>
              </td>
            </tr>
          ) : (
            data.map((item) => (
              <tr
                key={keyExtractor(item)}
                className={`border-b border-gray-100 last:border-0 hover:bg-gray-50 ${onRowClick ? 'cursor-pointer' : ''}`}
                onClick={() => onRowClick?.(item)}
              >
                {columns.map((col) => (
                  <td key={col.key} className={`px-4 py-3 ${col.className || ''}`}>
                    {col.render ? col.render(item) : String((item as Record<string, unknown>)[col.key])}
                  </td>
                ))}
                {rowActions.length > 0 && (
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {rowActions.map((action) => {
                        if (action.if && !action.if(item)) return null;
                        return (
                          <button
                            key={action.label}
                            title={action.label}
                            onClick={(e) => {
                              e.stopPropagation();
                              action.onClick(item);
                            }}
                            className={`inline-flex items-center justify-center rounded p-1.5 text-sm transition-colors ${
                              action.variant === 'danger'
                                ? 'text-red-600 hover:bg-red-50 hover:text-red-700'
                                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
                            }`}
                          >
                            {action.icon ?? action.label}
                          </button>
                        );
                      })}
                    </div>
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export { DataTable, type Column, type RowAction, type DataTableProps };
