import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Column } from "../UnifiedDataViewer";

interface TableViewProps<T> {
  data: T[];
  columns: Column<T>[];
  sortConfig: { field: string; direction: 'asc' | 'desc' } | null;
  onSort: (field: string) => void;
  onRowClick?: (record: T) => void;
  enableRowSelection?: boolean;
  selectedRows?: Set<string | number>;
  onRowSelect?: (id: string | number) => void;
  onSelectAll?: () => void;
}

export function TableView<T extends Record<string, any>>({
  data,
  columns,
  sortConfig,
  onSort,
  onRowClick,
  enableRowSelection = false,
  selectedRows = new Set(),
  onRowSelect,
  onSelectAll,
}: TableViewProps<T>) {
  const getSortIcon = (field: string) => {
    if (!sortConfig || sortConfig.field !== field) {
      return <ArrowUpDown className="h-4 w-4 ml-1 text-muted-foreground" />;
    }
    return sortConfig.direction === 'asc' ? (
      <ArrowUp className="h-4 w-4 ml-1" />
    ) : (
      <ArrowDown className="h-4 w-4 ml-1" />
    );
  };

  return (
    <ScrollArea className="w-full">
      <Table>
        <TableHeader>
          <TableRow>
            {enableRowSelection && (
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedRows.size === data.length && data.length > 0}
                  onCheckedChange={onSelectAll}
                />
              </TableHead>
            )}
            {columns.map((column) => (
              <TableHead
                key={String(column.key)}
                style={{
                  minWidth: column.minWidth,
                  maxWidth: column.maxWidth,
                  width: column.width,
                }}
                className={column.sortable ? "cursor-pointer hover:bg-muted/50" : ""}
                onClick={() => column.sortable && onSort(String(column.key))}
              >
                <div className="flex items-center">
                  {column.label}
                  {column.sortable && getSortIcon(String(column.key))}
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((record, index) => (
            <TableRow
              key={record.id || index}
              className={onRowClick ? "cursor-pointer" : ""}
              onClick={() => onRowClick?.(record)}
            >
              {enableRowSelection && (
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selectedRows.has(record.id)}
                    onCheckedChange={() => onRowSelect?.(record.id)}
                  />
                </TableCell>
              )}
              {columns.map((column) => {
                const value = record[column.key as keyof T];
                return (
                  <TableCell key={String(column.key)}>
                    {column.render ? column.render(value, record) : String(value ?? '')}
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ScrollArea>
  );
}
