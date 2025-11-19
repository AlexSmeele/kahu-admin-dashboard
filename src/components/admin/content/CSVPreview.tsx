import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { ColumnMapping } from "./CSVColumnMapper";
import { ColumnGroup } from "./ColumnGroupManager";

interface CSVPreviewProps {
  data: any[];
  mappings: ColumnMapping[];
  columnGroups: ColumnGroup[];
  maxRows?: number;
}

export function CSVPreview({ data, mappings, columnGroups, maxRows = 5 }: CSVPreviewProps) {
  const previewData = data.slice(0, maxRows);
  
  const groupedColumns = new Set(columnGroups.flatMap(g => g.sourceColumns));
  
  const transformedData = previewData.map(row => {
    const transformed: any = {};
    
    columnGroups.forEach(group => {
      const arrayValues = group.sourceColumns
        .map(colName => row[colName])
        .filter(val => val && val.trim())
        .map(val => val.trim());
      transformed[group.targetField] = arrayValues;
    });
    
    mappings.forEach(mapping => {
      if (!mapping.targetField || mapping.isGrouped || groupedColumns.has(mapping.csvColumn)) return;
      transformed[mapping.targetField] = row[mapping.csvColumn];
    });
    
    return transformed;
  });
  
  const groupFields = columnGroups.map(g => ({ 
    name: g.targetField, 
    type: 'json' 
  }));
  
  const ungroupedFields = mappings
    .filter(m => 
      m.targetField && 
      !groupedColumns.has(m.csvColumn) && 
      !m.isGrouped
    )
    .map(m => ({ 
      name: m.targetField, 
      type: m.dataType 
    }));
  
  const allFields = [...groupFields, ...ungroupedFields];
  const renderValue = (value: any, type: string) => {
    if (value === null || value === undefined || value === '') return <span className="text-muted-foreground italic">null</span>;
    if (type === 'json' || Array.isArray(value)) return <Badge variant="outline" className="font-mono text-xs max-w-[200px] truncate">{JSON.stringify(value)}</Badge>;
    if (type === 'boolean') return <Badge variant={value ? "default" : "secondary"}>{String(value)}</Badge>;
    const strValue = String(value);
    if (strValue.length > 50) return <span className="text-sm" title={strValue}>{strValue.substring(0, 47)}...</span>;
    return <span className="text-sm">{strValue}</span>;
  };
  return (
    <Card>
      <CardHeader>
        <CardTitle>Import Preview</CardTitle>
        <CardDescription>Preview of how your data will be imported (showing {previewData.length} of {data.length} rows)</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] w-full">
          <div className="min-w-max">
            <Table>
              <TableHeader>
                <TableRow>
                  {allFields.map(field => (
                    <TableHead key={field.name} className="min-w-[150px] whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <span className="font-medium">{field.name}</span>
                        <Badge variant="outline" className="text-xs w-fit">{field.type}</Badge>
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {transformedData.map((row, idx) => (
                  <TableRow key={idx}>
                    {allFields.map(field => <TableCell key={field.name}>{renderValue(row[field.name], field.type)}</TableCell>)}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
        {data.length > maxRows && <p className="text-sm text-muted-foreground mt-4 text-center">+ {data.length - maxRows} more rows will be imported</p>}
      </CardContent>
    </Card>
  );
}
