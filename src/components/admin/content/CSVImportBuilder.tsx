import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, AlertCircle, Code, Sparkles, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Papa from "papaparse";
import { CSVUploader } from "./CSVUploader";
import { CSVColumnMapper, CSVColumn, ColumnMapping } from "./CSVColumnMapper";
import { ColumnGroupManager, ColumnGroup } from "./ColumnGroupManager";
import { CSVPreview } from "./CSVPreview";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { validateSQLIdentifier, sanitizeSQLIdentifier } from "@/lib/validators";

interface CSVImportBuilderProps {
  sectionId: string;
}

type ImportStep = 'upload' | 'mapping' | 'importing' | 'complete';

export function CSVImportBuilder({ sectionId }: CSVImportBuilderProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [step, setStep] = useState<ImportStep>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<any[]>([]);
  const [columns, setColumns] = useState<CSVColumn[]>([]);
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);
  const [columnGroups, setColumnGroups] = useState<ColumnGroup[]>([]);
  const [importMode, setImportMode] = useState<'create' | 'import'>('create');
  const [newTableName, setNewTableName] = useState('');
  const [newTableDisplayName, setNewTableDisplayName] = useState('');
  const [progress, setProgress] = useState(0);
  const [importStats, setImportStats] = useState({ success: 0, failed: 0, total: 0 });
  const [errors, setErrors] = useState<string[]>([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [tableNameError, setTableNameError] = useState<string>('');

  const syncMappingsWithGroups = (
    currentMappings: ColumnMapping[], 
    groups: ColumnGroup[]
  ): ColumnMapping[] => {
    const groupedColumnsMap = new Map<string, string>();
    
    groups.forEach(group => {
      group.sourceColumns.forEach(col => {
        groupedColumnsMap.set(col, group.targetField);
      });
    });
    
    return currentMappings.map(mapping => {
      const groupTargetField = groupedColumnsMap.get(mapping.csvColumn);
      if (groupTargetField) {
        return {
          ...mapping,
          targetField: groupTargetField,
          isGrouped: true,
          dataType: 'json'
        };
      }
      return {
        ...mapping,
        isGrouped: false
      };
    });
  };

  const detectDataType = (values: string[]): CSVColumn['detectedType'] => {
    const nonEmpty = values.filter(v => v && v.trim());
    if (nonEmpty.length === 0) return 'text';

    if (nonEmpty.every(v => !isNaN(Number(v)))) return 'number';

    const boolValues = ['true', 'false', '1', '0', 'yes', 'no'];
    if (nonEmpty.every(v => boolValues.includes(v.toLowerCase()))) return 'boolean';

    const datePattern = /^\d{4}-\d{2}-\d{2}/;
    if (nonEmpty.every(v => datePattern.test(v))) {
      const timePattern = /T\d{2}:\d{2}/;
      return nonEmpty.some(v => timePattern.test(v)) ? 'datetime' : 'date';
    }

    if (nonEmpty.every(v => {
      try { JSON.parse(v); return true; } catch { return false; }
    })) return 'json';

    return 'text';
  };

  const detectColumnGroups = (cols: CSVColumn[]): ColumnGroup[] => {
    const groups: Map<string, string[]> = new Map();
    
    cols.forEach(col => {
      const match1 = col.name.match(/^(.+)\s+Step\s+(\d+)$/i);
      if (match1) {
        const [_, prefix, stepNum] = match1;
        const key = prefix.trim();
        if (!groups.has(key)) groups.set(key, []);
        const index = parseInt(stepNum) - 1;
        if (!groups.get(key)![index]) {
          groups.get(key)![index] = col.name;
        }
      }
      
      const match2 = col.name.match(/^(.+)\s+(\d+)$/i);
      if (match2 && !match1) {
        const [_, prefix, num] = match2;
        const key = prefix.trim();
        if (!groups.has(key)) groups.set(key, []);
        const index = parseInt(num) - 1;
        if (!groups.get(key)![index]) {
          groups.get(key)![index] = col.name;
        }
      }
    });
    
    return Array.from(groups.entries())
      .filter(([_, colNames]) => colNames.filter(Boolean).length >= 2)
      .map(([prefix, sourceColumns]) => ({
        id: `group_${Date.now()}_${Math.random()}`,
        targetField: prefix.toLowerCase().replace(/\s+/g, '_'),
        sourceColumns: sourceColumns.filter(Boolean),
        dataType: 'json' as const,
      }));
  };

  const parseCSV = (text: string): any[] => {
    const result = Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
      transformHeader: (h) => h.trim(),
      transform: (value) => value.trim(),
    });
    
    if (result.errors.length > 0) {
      console.error('CSV parsing errors:', result.errors);
      result.errors.forEach(error => {
        if (error.type !== 'FieldMismatch') {
          toast({
            title: "CSV parsing warning",
            description: error.message,
            variant: "destructive",
          });
        }
      });
    }
    
    return result.data as any[];
  };

  const handleFileSelect = async (selectedFile: File) => {
    if (selectedFile.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Maximum file size is 10MB",
        variant: "destructive",
      });
      return;
    }

    setFile(selectedFile);
    
    try {
      const text = await selectedFile.text();
      const parsed = parseCSV(text);
      
      if (parsed.length === 0) {
        toast({
          title: "Invalid CSV",
          description: "CSV file must contain at least one row of data",
          variant: "destructive",
        });
        return;
      }

      const headers = Object.keys(parsed[0]).filter(h => h && h.trim());
      if (headers.length === 0) {
        toast({
          title: "Invalid CSV",
          description: "No valid columns found in CSV",
          variant: "destructive",
        });
        return;
      }
      
      const dataRows = parsed;
      
      const analyzedColumns: CSVColumn[] = headers.map((header: string, index: number) => {
        const values = dataRows.map(row => row[header]);
        return {
          name: header,
          index,
          sampleValues: values.slice(0, 5),
          detectedType: detectDataType(values),
        };
      });

      const detectedGroups = detectColumnGroups(analyzedColumns);

      setColumns(analyzedColumns);
      setColumnGroups(detectedGroups);
      setCsvData(dataRows);
      
      const initialMappings: ColumnMapping[] = analyzedColumns.map(col => ({
        csvColumn: col.name,
        targetField: col.name.toLowerCase().replace(/\s+/g, '_'),
        dataType: col.detectedType,
      }));
      
      const syncedMappings = syncMappingsWithGroups(initialMappings, detectedGroups);
      setMappings(syncedMappings);

      const defaultTableName = selectedFile.name.replace('.csv', '').toLowerCase().replace(/[^a-z0-9]/g, '_');
      setNewTableName(defaultTableName);
      setNewTableDisplayName(selectedFile.name.replace('.csv', '').replace(/_/g, ' '));
      
      setStep('mapping');
      
      toast({
        title: "CSV parsed successfully",
        description: `Detected ${analyzedColumns.length} columns and ${detectedGroups.length} column groups`,
      });
    } catch (error: any) {
      toast({
        title: "Error parsing CSV",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const generateTableSQL = () => {
    let sql = `-- Create table from CSV: ${file?.name}\n`;
    sql += `CREATE TABLE IF NOT EXISTS public.${newTableName} (\n`;
    sql += `  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n`;
    
    // Add columns from column groups
    columnGroups.forEach(group => {
      sql += `  ${group.targetField} JSONB,\n`;
    });

    // Add regular mapped columns (excluding grouped ones)
    const groupedColumns = new Set(columnGroups.flatMap(g => g.sourceColumns));
    mappings.forEach(mapping => {
      if (!groupedColumns.has(mapping.csvColumn)) {
        let sqlType = 'TEXT';
        switch (mapping.dataType) {
          case 'number': sqlType = 'INTEGER'; break;
          case 'decimal': sqlType = 'DECIMAL'; break;
          case 'boolean': sqlType = 'BOOLEAN'; break;
          case 'date': sqlType = 'DATE'; break;
          case 'datetime': sqlType = 'TIMESTAMP WITH TIME ZONE'; break;
          case 'json': sqlType = 'JSONB'; break;
        }
        sql += `  ${mapping.targetField} ${sqlType},\n`;
      }
    });
    
    sql += `  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),\n`;
    sql += `  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()\n`;
    sql += `);\n\n`;

    sql += `-- Enable Row Level Security\n`;
    sql += `ALTER TABLE public.${newTableName} ENABLE ROW LEVEL SECURITY;\n\n`;
    
    sql += `-- Create policy for admins\n`;
    sql += `CREATE POLICY "Admins can manage all records"\n`;
    sql += `  ON public.${newTableName}\n`;
    sql += `  FOR ALL\n`;
    sql += `  TO authenticated\n`;
    sql += `  USING (public.has_role(auth.uid(), 'admin'));\n\n`;

    sql += `-- Create trigger for updated_at\n`;
    sql += `CREATE TRIGGER update_${newTableName}_updated_at\n`;
    sql += `  BEFORE UPDATE ON public.${newTableName}\n`;
    sql += `  FOR EACH ROW\n`;
    sql += `  EXECUTE FUNCTION public.update_updated_at_column();\n`;

    return sql;
  };

  const handleImport = async () => {
    if (importMode === 'create' && !newTableName) {
      toast({
        title: "Table name required",
        description: "Please provide a name for the new table",
        variant: "destructive",
      });
      return;
    }
    
    // Validate table name
    const validation = validateSQLIdentifier(newTableName);
    if (!validation.valid) {
      setTableNameError(validation.error || 'Invalid table name');
      toast({
        title: "Validation Error",
        description: validation.error,
        variant: "destructive",
      });
      return;
    }
    
    // Validate all field names
    const invalidFields = mappings.filter(m => !validateSQLIdentifier(m.targetField).valid);
    if (invalidFields.length > 0) {
      toast({
        title: "Validation Error",
        description: `Invalid field names: ${invalidFields.map(f => f.targetField).join(', ')}`,
        variant: "destructive",
      });
      return;
    }

    setStep('importing');
    setProgress(0);
    setImportStats({ success: 0, failed: 0, total: csvData.length });
    const errorList: string[] = [];

    try {
      // If creating a new table, execute DDL first
      if (importMode === 'create') {
        const sql = generateTableSQL();
        
        console.log('=== CSV IMPORT DEBUG ===');
        console.log('Generated SQL:', sql);
        console.log('Table metadata:', {
          section_id: sectionId,
          name: newTableName,
          display_name: newTableDisplayName,
          table_name: newTableName,
        });

        const { data: ddlResult, error: ddlError } = await supabase.functions.invoke('execute-ddl', {
          body: {
            sql,
            tableMetadata: {
              section_id: sectionId,
              name: newTableName,
              display_name: newTableDisplayName,
              description: `Imported from ${file?.name}`,
              table_name: newTableName,
              schema_definition: {
                columns: mappings,
                columnGroups: columnGroups,
              },
              order_index: 0,
              is_active: true,
              creation_method: 'csv',
              source_csv_name: file?.name,
            },
          },
        });

        console.log('DDL Response:', { data: ddlResult, error: ddlError });

        if (ddlError) {
          console.error('DDL Error Details:', {
            message: ddlError.message,
            status: ddlError.status,
            details: ddlError
          });
          throw new Error(`Failed to create table: ${ddlError.message}`);
        }

        if (!ddlResult.success) {
          console.error('DDL Failed:', ddlResult);
          throw new Error(ddlResult.error || 'Failed to create table');
        }

        toast({
          title: "Table created",
          description: "Refreshing database schema...",
        });

        // Wait for Supabase schema cache to refresh
        console.log('Waiting 3 seconds for Supabase schema cache to refresh...');
        for (let i = 0; i < 3; i++) {
          console.log(`Schema refresh wait: ${i + 1}/3 seconds...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

        console.log('Schema cache should be refreshed. Beginning data import...');

        toast({
          title: "Ready to import",
          description: "Starting data import...",
        });
      }

      // Import data in batches
      const batchSize = 100;
      const tableName = importMode === 'create' ? newTableName : 'existing_table'; // TODO: Add table selector

      for (let i = 0; i < csvData.length; i += batchSize) {
        const batch = csvData.slice(i, i + batchSize);
        
        const transformedBatch = batch.map(row => {
          const transformed: any = {};
          
          // Handle column groups
          columnGroups.forEach(group => {
            const values = group.sourceColumns
              .map(col => row[col])
              .filter(v => v !== null && v !== undefined && v !== '');
            if (values.length > 0) {
              transformed[group.targetField] = values;
            }
          });

          // Handle regular mappings
      const groupedColumns = new Set<string>(columnGroups.flatMap(g => g.sourceColumns));
      mappings.forEach(mapping => {
        if (!groupedColumns.has(mapping.csvColumn)) {
              let value = row[mapping.csvColumn];
              
              if (value !== null && value !== undefined && value !== '') {
                switch (mapping.dataType) {
                  case 'number':
                  case 'decimal':
                    transformed[mapping.targetField] = Number(value);
                    break;
                  case 'boolean':
                    transformed[mapping.targetField] = ['true', '1', 'yes'].includes(String(value).toLowerCase());
                    break;
                  case 'json':
                    try {
                      transformed[mapping.targetField] = JSON.parse(value);
                    } catch {
                      transformed[mapping.targetField] = value;
                    }
                    break;
                  default:
                    transformed[mapping.targetField] = value;
                }
              }
            }
          });

          return transformed;
        });

        // Retry logic for schema cache errors
        let insertError = null;
        let retries = 0;
        const maxRetries = 3;
        
        while (retries < maxRetries) {
          const { error } = await supabase
            .from(tableName as any)
            .insert(transformedBatch);
          
          if (!error) {
            // Success!
            insertError = null;
            break;
          }
          
          // Check if it's a schema cache error
          if (error.message?.includes('schema cache') && retries < maxRetries - 1) {
            console.warn(`Schema cache error on batch ${i / batchSize + 1}, retry ${retries + 1}/${maxRetries}...`);
            await new Promise(resolve => setTimeout(resolve, 2000));
            retries++;
          } else {
            insertError = error;
            break;
          }
        }

        if (insertError) {
          errorList.push(`Batch ${i / batchSize + 1}: ${insertError.message}`);
          setImportStats(prev => ({
            ...prev,
            failed: prev.failed + batch.length,
          }));
        } else {
          setImportStats(prev => ({
            ...prev,
            success: prev.success + batch.length,
          }));
        }

        setProgress(Math.round(((i + batch.length) / csvData.length) * 100));
      }

      setErrors(errorList);
      setStep('complete');

      if (errorList.length === 0) {
        toast({
          title: "Import completed successfully",
          description: `Imported ${importStats.success} records`,
        });
      } else {
        toast({
          title: "Import completed with errors",
          description: `${importStats.success} succeeded, ${importStats.failed} failed`,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Import failed:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      toast({
        title: "Import failed",
        description: (
          <div className="space-y-2">
            <p className="font-semibold">{errorMessage}</p>
            <p className="text-xs text-muted-foreground">
              Check the browser console (F12) for detailed logs
            </p>
          </div>
        ),
        variant: "destructive",
      });
      setStep('mapping');
    }
  };

  if (step === 'upload') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Upload CSV File</CardTitle>
          <CardDescription>
            Upload a CSV file to automatically create a table and import data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CSVUploader onFileSelect={handleFileSelect} />
        </CardContent>
      </Card>
    );
  }

  if (step === 'mapping') {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Import Mode</CardTitle>
            <CardDescription>Choose how to import your CSV data</CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup value={importMode} onValueChange={(value) => setImportMode(value as 'create' | 'import')}>
              <div className="flex items-center space-x-2 p-3 border rounded">
                <RadioGroupItem value="create" id="create" />
                <Label htmlFor="create" className="flex-1 cursor-pointer">
                  <div className="font-semibold">Create new table from CSV</div>
                  <div className="text-sm text-muted-foreground">
                    Automatically create a new table based on CSV structure
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-3 border rounded">
                <RadioGroupItem value="import" id="import" />
                <Label htmlFor="import" className="flex-1 cursor-pointer">
                  <div className="font-semibold">Import to existing table</div>
                  <div className="text-sm text-muted-foreground">
                    Import data into an existing table (coming soon)
                  </div>
                </Label>
              </div>
            </RadioGroup>

            {importMode === 'create' && (
              <div className="mt-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="tableName">Table Name *</Label>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Input
                        id="tableName"
                        value={newTableName}
                        onChange={(e) => {
                          setNewTableName(e.target.value);
                          const validation = validateSQLIdentifier(e.target.value);
                          setTableNameError(validation.valid ? '' : validation.error || '');
                        }}
                        placeholder="e.g., training_skills"
                        required
                        className={tableNameError ? "border-destructive" : ""}
                      />
                      {tableNameError && (
                        <div className="flex items-center gap-1 text-xs text-destructive mt-1">
                          <AlertCircle className="h-3 w-3" />
                          {tableNameError}
                        </div>
                      )}
                      {!tableNameError && newTableName && (
                        <div className="text-xs text-muted-foreground mt-1">
                          ✓ Valid table name
                        </div>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const sanitized = sanitizeSQLIdentifier(newTableName);
                        setNewTableName(sanitized);
                        const validation = validateSQLIdentifier(sanitized);
                        setTableNameError(validation.valid ? '' : validation.error || '');
                      }}
                      disabled={!newTableName}
                    >
                      <Sparkles className="h-4 w-4 mr-1" />
                      Fix
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Use lowercase letters, numbers, and underscores only. Cannot start with a number.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tableDisplayName">Display Name *</Label>
                  <Input
                    id="tableDisplayName"
                    value={newTableDisplayName}
                    onChange={(e) => setNewTableDisplayName(e.target.value)}
                    placeholder="e.g., Training Skills"
                    required
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {columnGroups.length > 0 && (
          <ColumnGroupManager
            columns={columns}
            groups={columnGroups}
            onGroupsChange={(newGroups) => {
              setColumnGroups(newGroups);
              setMappings(prev => syncMappingsWithGroups(prev, newGroups));
            }}
            groupedColumns={new Set(columnGroups.flatMap(g => g.sourceColumns))}
          />
        )}

        <CSVColumnMapper
          columns={columns}
          mappings={mappings}
          onMappingChange={setMappings}
          mode={importMode}
          columnGroups={columnGroups}
        />

        <CSVPreview
          data={csvData}
          mappings={mappings}
          columnGroups={columnGroups}
          maxRows={5}
        />

        {importMode === 'create' && (
          <Card>
            <CardHeader>
              <CardTitle>Generated SQL</CardTitle>
              <CardDescription>
                This SQL will be executed to create your table
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full">
                    <Code className="h-4 w-4 mr-2" />
                    View SQL
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[80vh]">
                  <DialogHeader>
                    <DialogTitle>Generated SQL Migration</DialogTitle>
                    <DialogDescription>
                      This SQL will be automatically executed when you start the import
                    </DialogDescription>
                  </DialogHeader>
                  <ScrollArea className="h-[500px] w-full rounded-md border p-4">
                    <pre className="text-sm">{generateTableSQL()}</pre>
                  </ScrollArea>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        )}

        <div className="flex gap-2">
          {importMode === 'create' && (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                const sql = generateTableSQL();
                console.log('=== PREVIEW SQL ===');
                console.log(sql);
                navigator.clipboard.writeText(sql);
                toast({
                  title: "SQL Copied",
                  description: "Generated SQL has been copied to clipboard and logged to console (F12)",
                });
              }}
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview SQL
            </Button>
          )}
          <Button onClick={handleImport} size="lg">
            {importMode === 'create' ? 'Create Table & Import Data' : 'Import Data'}
          </Button>
        </div>
      </div>
    );
  }

  if (step === 'importing') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Importing Data</CardTitle>
          <CardDescription>Please wait while we import your data...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Progress value={progress} />
          <div className="text-center text-sm text-muted-foreground">
            {importStats.success} of {importStats.total} records imported
          </div>
        </CardContent>
      </Card>
    );
  }

  if (step === 'complete') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {errors.length === 0 ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <AlertCircle className="h-5 w-5 text-yellow-500" />
            )}
            Import Complete
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">{importStats.success}</div>
              <div className="text-sm text-muted-foreground">Successful</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">{importStats.failed}</div>
              <div className="text-sm text-muted-foreground">Failed</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{importStats.total}</div>
              <div className="text-sm text-muted-foreground">Total</div>
            </div>
          </div>

          {errors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="font-semibold mb-2">Errors encountered:</div>
                <ul className="list-disc list-inside space-y-1">
                  {errors.map((error, i) => (
                    <li key={i} className="text-sm">{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            <Button onClick={() => navigate(`/admin/content/sections/${sectionId}`)}>
              View Tables
            </Button>
            <Button variant="outline" onClick={() => {
              setStep('upload');
              setFile(null);
              setCsvData([]);
              setColumns([]);
              setMappings([]);
              setColumnGroups([]);
              setErrors([]);
            }}>
              Import Another File
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}
