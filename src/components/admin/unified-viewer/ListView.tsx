import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Column } from "../UnifiedDataViewer";

interface ListViewProps<T> {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (record: T) => void;
}

export function ListView<T extends Record<string, any>>({
  data,
  columns,
  onRowClick,
}: ListViewProps<T>) {
  // Get primary column (first column) and secondary columns (up to 3 more)
  const primaryColumn = columns[0];
  const secondaryColumns = columns.slice(1, 4);

  return (
    <div className="space-y-2">
      {data.map((record, index) => {
        const primaryValue = record[primaryColumn.key as keyof T];
        
        return (
          <Card
            key={record.id || index}
            className={`${onRowClick ? "cursor-pointer hover:bg-muted/50 transition-colors" : ""}`}
            onClick={() => onRowClick?.(record)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-4">
                {/* Primary content */}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-foreground truncate">
                    {primaryColumn.render 
                      ? primaryColumn.render(primaryValue, record)
                      : String(primaryValue ?? '')}
                  </div>
                  {/* Secondary content */}
                  <div className="flex flex-wrap gap-2 mt-1">
                    {secondaryColumns.map((column) => {
                      const value = record[column.key as keyof T];
                      if (!value && value !== 0) return null;
                      
                      return (
                        <span key={String(column.key)} className="text-sm text-muted-foreground">
                          {column.render ? column.render(value, record) : String(value)}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* Additional info on the right */}
                {columns.slice(4).length > 0 && (
                  <div className="flex flex-wrap gap-1 items-center">
                    {columns.slice(4, 6).map((column) => {
                      const value = record[column.key as keyof T];
                      if (!value && value !== 0) return null;
                      
                      return (
                        <Badge key={String(column.key)} variant="secondary" className="text-xs">
                          {column.render ? column.render(value, record) : String(value)}
                        </Badge>
                      );
                    })}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
