import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowRight } from "lucide-react";

export interface CSVColumn {
  name: string;
  index: number;
  sampleValues: string[];
  detectedType: 'text' | 'number' | 'boolean' | 'date' | 'datetime' | 'json';
}

export interface ColumnMapping {
  csvColumn: string;
  targetField: string;
  dataType: string;
  transform?: string;
  isGrouped?: boolean;
  groupId?: string;
}

interface CSVColumnMapperProps {
  columns: CSVColumn[];
  targetFields?: { name: string; type: string; label: string }[];
  mappings: ColumnMapping[];
  onMappingChange: (mappings: ColumnMapping[]) => void;
  mode: 'create' | 'import';
  groupedColumns?: Set<string>;
}

const dataTypes = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'boolean', label: 'Boolean' },
  { value: 'date', label: 'Date' },
  { value: 'datetime', label: 'Date & Time' },
  { value: 'json', label: 'JSON' },
  { value: 'uuid', label: 'UUID' },
];

export function CSVColumnMapper({
  columns,
  targetFields = [],
  mappings,
  onMappingChange,
  mode,
  groupedColumns = new Set(),
}: CSVColumnMapperProps) {
  const updateMapping = (csvColumn: string, updates: Partial<ColumnMapping>) => {
    const newMappings = mappings.map((m) =>
      m.csvColumn === csvColumn ? { ...m, ...updates } : m
    );
    onMappingChange(newMappings);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Column Mapping</CardTitle>
        <CardDescription>
          {mode === 'create'
            ? 'Map CSV columns to new table fields and set data types'
            : 'Map CSV columns to existing table fields'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">CSV Column</TableHead>
                <TableHead className="w-[150px]">Detected Type</TableHead>
                <TableHead className="w-[50px]"></TableHead>
                <TableHead className="w-[200px]">
                  {mode === 'create' ? 'Field Name' : 'Target Field'}
                </TableHead>
                <TableHead className="w-[150px]">Data Type</TableHead>
                <TableHead>Sample Values</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {columns.map((column) => {
                const mapping = mappings.find((m) => m.csvColumn === column.name);
                const isGrouped = groupedColumns.has(column.name);
                return (
                  <TableRow key={column.name} className={isGrouped ? "opacity-50" : ""}>
                    <TableCell className="font-medium">
                      {column.name}
                      {isGrouped && (
                        <Badge variant="secondary" className="ml-2 text-xs">
                          Grouped
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{column.detectedType}</Badge>
                    </TableCell>
                    <TableCell>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </TableCell>
                    <TableCell>
                      {mode === 'create' ? (
                        <input
                          type="text"
                          value={mapping?.targetField || column.name.toLowerCase().replace(/\s+/g, '_')}
                          onChange={(e) =>
                            updateMapping(column.name, { targetField: e.target.value })
                          }
                          className="w-full px-2 py-1 border rounded text-sm"
                          placeholder="field_name"
                          disabled={isGrouped}
                        />
                      ) : (
                        <Select
                          value={mapping?.targetField || ''}
                          onValueChange={(value) =>
                            updateMapping(column.name, { targetField: value })
                          }
                          disabled={isGrouped}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select field..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">Skip column</SelectItem>
                            {targetFields.map((field) => (
                              <SelectItem key={field.name} value={field.name}>
                                {field.label} ({field.type})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={mapping?.dataType || column.detectedType}
                        onValueChange={(value) =>
                          updateMapping(column.name, { dataType: value })
                        }
                        disabled={isGrouped}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {dataTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {column.sampleValues.slice(0, 3).map((value, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {value.length > 20 ? value.substring(0, 20) + '...' : value}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
