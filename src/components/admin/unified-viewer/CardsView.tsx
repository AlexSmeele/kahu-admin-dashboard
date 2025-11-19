import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Column } from "../UnifiedDataViewer";

interface CardsViewProps<T> {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (record: T) => void;
  renderCard?: (record: T) => React.ReactNode;
}

export function CardsView<T extends Record<string, any>>({
  data,
  columns,
  onRowClick,
  renderCard,
}: CardsViewProps<T>) {
  // If custom card renderer provided, use it
  if (renderCard) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.map((record, index) => (
          <div
            key={record.id || index}
            className={onRowClick ? "cursor-pointer" : ""}
            onClick={() => onRowClick?.(record)}
          >
            {renderCard(record)}
          </div>
        ))}
      </div>
    );
  }

  // Default card layout
  const titleColumn = columns[0];
  const descriptionColumn = columns[1];
  const contentColumns = columns.slice(2, 5);
  const badgeColumns = columns.slice(5, 8);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {data.map((record, index) => {
        const titleValue = record[titleColumn.key as keyof T];
        const descValue = descriptionColumn ? record[descriptionColumn.key as keyof T] : null;

        return (
          <Card
            key={record.id || index}
            className={`${onRowClick ? "cursor-pointer hover:shadow-lg transition-shadow" : ""}`}
            onClick={() => onRowClick?.(record)}
          >
            <CardHeader>
              <CardTitle className="text-lg">
                {titleColumn.render 
                  ? titleColumn.render(titleValue, record)
                  : String(titleValue ?? '')}
              </CardTitle>
              {descValue && (
                <CardDescription className="line-clamp-2">
                  {descriptionColumn.render 
                    ? descriptionColumn.render(descValue, record)
                    : String(descValue)}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Content fields */}
              {contentColumns.map((column) => {
                const value = record[column.key as keyof T];
                if (!value && value !== 0) return null;

                return (
                  <div key={String(column.key)} className="text-sm">
                    <span className="text-muted-foreground">{column.label}: </span>
                    <span className="text-foreground">
                      {column.render ? column.render(value, record) : String(value)}
                    </span>
                  </div>
                );
              })}

              {/* Badge fields */}
              {badgeColumns.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-2">
                  {badgeColumns.map((column) => {
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
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
