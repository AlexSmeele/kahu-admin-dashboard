import { Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Column } from "../UnifiedDataViewer";

interface ColumnVisibilityMenuProps<T> {
  columns: Column<T>[];
  visibleColumns: Set<string>;
  onToggleColumn: (key: string) => void;
  onResetColumns: () => void;
}

export function ColumnVisibilityMenu<T>({
  columns,
  visibleColumns,
  onToggleColumn,
  onResetColumns,
}: ColumnVisibilityMenuProps<T>) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings2 className="h-4 w-4 mr-2" />
          Columns
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 z-50 bg-popover">
        <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {columns.map((column) => (
          <DropdownMenuItem
            key={String(column.key)}
            className="cursor-pointer"
            onSelect={(e) => {
              e.preventDefault();
              onToggleColumn(String(column.key));
            }}
          >
            <Checkbox
              checked={visibleColumns.has(String(column.key))}
              onCheckedChange={() => onToggleColumn(String(column.key))}
              className="mr-2"
            />
            {column.label}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onResetColumns} className="cursor-pointer">
          Reset to default
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
