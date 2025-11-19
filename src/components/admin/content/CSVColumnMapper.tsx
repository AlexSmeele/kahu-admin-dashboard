import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronUp, ChevronDown, AlertCircle } from "lucide-react";
import { validateSQLIdentifier } from "@/lib/validators";
import { ColumnGroup } from "./ColumnGroupManager";

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
  existingFields?: string[];
  mappings: ColumnMapping[];
  onMappingChange: (mappings: ColumnMapping[]) => void;
  mode: 'create' | 'import';
  columnGroups?: ColumnGroup[];
}

export const CSVColumnMapper = ({ columns, existingFields, mappings, onMappingChange, mode, columnGroups = [] }: CSVColumnMapperProps) => {
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const groupedColumnsSet = new Set(columnGroups.flatMap(g => g.sourceColumns));

  const updateMapping = (csvColumn: string, updates: Partial<ColumnMapping>) => {
    const newMappings = mappings.map(m => m.csvColumn === csvColumn ? { ...m, ...updates } : m);
    if (updates.targetField) {
      const validation = validateSQLIdentifier(updates.targetField);
      if (!validation.valid) {
        setValidationErrors(prev => ({ ...prev, [csvColumn]: validation.error || '' }));
      } else {
        setValidationErrors(prev => { const newErrors = { ...prev }; delete newErrors[csvColumn]; return newErrors; });
      }
    }
    onMappingChange(newMappings);
  };

  const reorderMapping = (identifier: string, direction: 'up' | 'down') => {
    const group = columnGroups.find(g => g.targetField === identifier);
    if (group) {
      const firstColumnInGroup = group.sourceColumns[0];
      const currentIndex = mappings.findIndex(m => m.csvColumn === firstColumnInGroup);
      if (currentIndex === -1) return;
      const groupSize = group.sourceColumns.length;
      const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + groupSize;
      if (newIndex < 0 || (direction === 'down' && newIndex > mappings.length)) return;
      const groupMappings = mappings.slice(currentIndex, currentIndex + groupSize);
      const otherMappings = mappings.filter((_, idx) => idx < currentIndex || idx >= currentIndex + groupSize);
      const insertIndex = direction === 'up' ? newIndex : newIndex - groupSize + 1;
      const newMappings = [...otherMappings.slice(0, insertIndex), ...groupMappings, ...otherMappings.slice(insertIndex)];
      onMappingChange(newMappings);
    } else {
      const currentIndex = mappings.findIndex(m => m.csvColumn === identifier);
      if (currentIndex === -1 || groupedColumnsSet.has(identifier)) return;
      const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      if (newIndex < 0 || newIndex >= mappings.length) return;
      const newMappings = [...mappings];
      [newMappings[currentIndex], newMappings[newIndex]] = [newMappings[newIndex], newMappings[currentIndex]];
      onMappingChange(newMappings);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Column Mapping</CardTitle>
        <CardDescription>Map CSV columns to table fields. Grouped columns will form arrays.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-muted-foreground mb-4">Field names: lowercase, numbers, underscores only. Cannot start with number.</div>
        <ScrollArea className="h-[600px] w-full">
          <div className="min-w-max">
            <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Order</TableHead>
              <TableHead>CSV Column / Target Field</TableHead>
              <TableHead className="w-[200px]">Sample Data</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="w-[200px]">Configuration</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(() => {
              const renderedItems: React.ReactNode[] = [];
              const processedColumns = new Set<string>();
              mappings.forEach((mapping, mappingIndex) => {
                if (processedColumns.has(mapping.csvColumn)) return;
                const group = columnGroups.find(g => g.targetField === mapping.targetField);
                const isGrouped = groupedColumnsSet.has(mapping.csvColumn);
                if (group && group.sourceColumns[0] === mapping.csvColumn) {
                  const groupIndex = mappings.findIndex(m => m.csvColumn === group.sourceColumns[0]);
                  const canMoveUp = groupIndex > 0;
                  const canMoveDown = groupIndex + group.sourceColumns.length < mappings.length;
                  renderedItems.push(
                    <TableRow key={`group-${group.targetField}`} className="bg-blue-50/50 dark:bg-blue-950/20 font-medium">
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => reorderMapping(group.targetField, 'up')} disabled={!canMoveUp}><ChevronUp className="h-3 w-3" /></Button>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => reorderMapping(group.targetField, 'down')} disabled={!canMoveDown}><ChevronDown className="h-3 w-3" /></Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {mode === 'create' ? (
                            <div className="flex-1">
                              <Input value={group.targetField} onChange={(e) => { group.sourceColumns.forEach(col => updateMapping(col, { targetField: e.target.value })); }} placeholder="Target field name" className={validationErrors[mapping.csvColumn] ? "border-destructive" : ""} />
                              {validationErrors[mapping.csvColumn] && <div className="flex items-center gap-1 text-xs text-destructive mt-1"><AlertCircle className="h-3 w-3" />{validationErrors[mapping.csvColumn]}</div>}
                            </div>
                          ) : <span>{group.targetField}</span>}
                          <Badge variant="secondary" className="text-xs">Grouped ({group.sourceColumns.length})</Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground">Array of values</span>
                      </TableCell>
                      <TableCell><Badge variant="outline">json</Badge></TableCell>
                      <TableCell><span className="text-xs text-muted-foreground">Array field</span></TableCell>
                    </TableRow>
                  );
                  group.sourceColumns.forEach((colName) => {
                    processedColumns.add(colName);
                    const column = columns.find(c => c.name === colName);
                    if (!column) return;
                    renderedItems.push(
                      <TableRow key={`child-${colName}`} className="bg-muted/30">
                        <TableCell></TableCell>
                        <TableCell className="pl-8"><div className="flex items-center gap-2"><span className="text-muted-foreground">↳</span><span className="text-sm">{column.name}</span></div></TableCell>
                        <TableCell>
                          <span className="text-xs text-muted-foreground truncate max-w-[200px] block">
                            {column.sampleValues[0] || 'empty'}
                          </span>
                        </TableCell>
                        <TableCell><Badge variant="outline" className="text-xs">{column.detectedType}</Badge></TableCell>
                        <TableCell><span className="text-xs text-muted-foreground">Element {group.sourceColumns.indexOf(colName) + 1}</span></TableCell>
                      </TableRow>
                    );
                  });
                } else if (!isGrouped) {
                  const column = columns.find(c => c.name === mapping.csvColumn);
                  if (!column) return;
                  const canMoveUp = mappingIndex > 0;
                  const canMoveDown = mappingIndex < mappings.length - 1;
                  renderedItems.push(
                    <TableRow key={column.name}>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => reorderMapping(column.name, 'up')} disabled={!canMoveUp}><ChevronUp className="h-3 w-3" /></Button>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => reorderMapping(column.name, 'down')} disabled={!canMoveDown}><ChevronDown className="h-3 w-3" /></Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2"><span className="text-sm text-muted-foreground">{column.name}</span><span className="text-muted-foreground">→</span></div>
                          {mode === 'create' ? (
                            <div>
                              <Input value={mapping.targetField} onChange={(e) => updateMapping(column.name, { targetField: e.target.value })} placeholder="Target field name" className={validationErrors[column.name] ? "border-destructive" : ""} />
                              {validationErrors[column.name] && <div className="flex items-center gap-1 text-xs text-destructive mt-1"><AlertCircle className="h-3 w-3" />{validationErrors[column.name]}</div>}
                            </div>
                          ) : (
                            <Select value={mapping.targetField || ''} onValueChange={(value) => updateMapping(column.name, { targetField: value })}>
                              <SelectTrigger><SelectValue placeholder="Select target field" /></SelectTrigger>
                              <SelectContent>{existingFields?.map(field => <SelectItem key={field} value={field}>{field}</SelectItem>)}</SelectContent>
                            </Select>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs text-muted-foreground space-y-1">
                          {column.sampleValues.slice(0, 2).map((val, idx) => (
                            <div key={idx} className="truncate max-w-[200px]">
                              {val || <span className="italic">empty</span>}
                            </div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{column.detectedType}</Badge></TableCell>
                      <TableCell>
                        {mode === 'create' && (
                          <Select value={mapping.dataType} onValueChange={(value) => updateMapping(column.name, { dataType: value })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="text">Text</SelectItem>
                              <SelectItem value="integer">Integer</SelectItem>
                              <SelectItem value="numeric">Numeric</SelectItem>
                              <SelectItem value="boolean">Boolean</SelectItem>
                              <SelectItem value="date">Date</SelectItem>
                              <SelectItem value="timestamp">Timestamp</SelectItem>
                              <SelectItem value="json">JSON</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                }
              });
              return renderedItems;
            })()}
          </TableBody>
        </Table>
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
