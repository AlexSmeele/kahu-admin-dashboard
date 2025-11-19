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
import { ExistingTableSelector } from "./ExistingTableSelector";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { validateSQLIdentifier, sanitizeSQLIdentifier } from "@/lib/validators";

interface TableSchema {
  columns: Array<{
    column_name: string;
    data_type: string;
    is_nullable: string;
    column_default: string | null;
  }>;
}

interface CSVImportBuilderProps {
  sectionId?: string;
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
  const [selectedExistingTableId, setSelectedExistingTableId] = useState<string | null>(null);
  const [selectedExistingTableName, setSelectedExistingTableName] = useState<string | null>(null);
  const [existingTableSchema, setExistingTableSchema] = useState<TableSchema | null>(null);
  const [progress, setProgress] = useState(0);
  const [importStats, setImportStats] = useState({ success: 0, failed: 0, total: 0 });
  const [errors, setErrors] = useState<string[]>([]);
  const [detailedErrors, setDetailedErrors] = useState<Array<{ row: number; field?: string; error: string; type: 'validation' | 'insert' }>>([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [tableNameError, setTableNameError] = useState<string>('');
  const [validationResults, setValidationResults] = useState<{
    valid: number;
    warnings: string[];
    errors: string[];
  } | null>(null);
  const [showValidation, setShowValidation] = useState(false);
  const [conflictStrategy, setConflictStrategy] = useState<'skip' | 'upsert' | 'fail'>('fail');
  const [showImportConfirm, setShowImportConfirm] = useState(false);

  // Detect primary key columns from schema
  const detectPrimaryKeys = (): string[] => {
    if (!existingTableSchema) return [];
    
    // Try to find primary key from column_default containing 'gen_random_uuid'
    // or common primary key names
    const pkColumns = existingTableSchema.columns.filter(col => 
      col.column_name === 'id' || 
      col.column_default?.includes('gen_random_uuid') ||
      col.column_default?.includes('nextval')
    );
    
    return pkColumns.map(col => col.column_name);
  };

  const transformValue = (value: any, targetType: string): any => {
    if (value === null || value === undefined || value === '') return null;

    const strValue = String(value).trim();
    
    // Handle PostgreSQL types
    if (targetType.includes('int') || targetType === 'bigint' || targetType === 'smallint') {
      const num = parseInt(strValue);
      if (isNaN(num)) throw new Error(`Cannot convert "${strValue}" to integer`);
      return num;
    }
    
    if (targetType.includes('numeric') || targetType.includes('decimal') || targetType === 'real' || targetType === 'double precision') {
      const num = parseFloat(strValue);
      if (isNaN(num)) throw new Error(`Cannot convert "${strValue}" to number`);
      return num;
    }
    
    if (targetType === 'boolean' || targetType === 'bool') {
      const lower = strValue.toLowerCase();
      if (['true', '1', 'yes', 't', 'y'].includes(lower)) return true;
      if (['false', '0', 'no', 'f', 'n'].includes(lower)) return false;
      throw new Error(`Cannot convert "${strValue}" to boolean`);
    }
    
    if (targetType === 'date') {
      const date = new Date(strValue);
      if (isNaN(date.getTime())) throw new Error(`Cannot convert "${strValue}" to date`);
      return date.toISOString().split('T')[0];
    }
    
    if (targetType.includes('timestamp') || targetType.includes('timestamptz')) {
      const date = new Date(strValue);
      if (isNaN(date.getTime())) throw new Error(`Cannot convert "${strValue}" to timestamp`);
      return date.toISOString();
    }
    
    if (targetType === 'uuid') {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(strValue)) throw new Error(`Invalid UUID format: "${strValue}"`);
      return strValue;
    }
    
    if (targetType === 'jsonb' || targetType === 'json') {
      try {
        return JSON.parse(strValue);
      } catch {
        throw new Error(`Invalid JSON: "${strValue}"`);
      }
    }
    
    if (targetType.includes('[]')) {
      // Array type - try to parse as JSON array
      try {
        const parsed = JSON.parse(strValue);
        if (Array.isArray(parsed)) return parsed;
        throw new Error('Not an array');
      } catch {
        // Fallback: split by comma
        return strValue.split(',').map(s => s.trim()).filter(Boolean);
      }
    }
    
    // Default: return as text
    return strValue;
  };

  const validateImportData = () => {
    const warnings: string[] = [];
    const errors: string[] = [];
    let validCount = 0;

    csvData.forEach((row, rowIndex) => {
      let rowValid = true;

      mappings.forEach(mapping => {
        const value = row[mapping.csvColumn];
        
        if (importMode === 'import' && existingTableSchema) {
          const schemaField = existingTableSchema.columns.find(c => c.column_name === mapping.targetField);
          
          if (schemaField) {
            // Check required fields
            if (schemaField.is_nullable === 'NO' && (value === null || value === undefined || value === '')) {
              errors.push(`Row ${rowIndex + 1}: Required field "${mapping.targetField}" is empty`);
              rowValid = false;
            }
            
            // Check type conversion safety
            if (value !== null && value !== undefined && value !== '') {
              try {
                transformValue(value, schemaField.data_type);
              } catch (error) {
                warnings.push(`Row ${rowIndex + 1}: ${mapping.csvColumn} → ${mapping.targetField}: ${error instanceof Error ? error.message : 'Type conversion may fail'}`);
              }
            }
          }
        }
      });

      if (rowValid) validCount++;
    });

    setValidationResults({
      valid: validCount,
      warnings,
      errors: errors.slice(0, 50), // Limit to first 50 errors
    });
    setShowValidation(true);
  };

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
      // Execute DDL only if creating new table (skip for import mode)
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
      const tableName = importMode === 'create' ? newTableName : selectedExistingTableName;
      
      if (!tableName) {
        throw new Error('Table name is required');
      }

      for (let i = 0; i < csvData.length; i += batchSize) {
        const batch = csvData.slice(i, i + batchSize);
        
        const transformedBatch = batch.map((row, rowIndex) => {
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

          // Handle regular mappings with enhanced type conversion
          const groupedColumns = new Set<string>(columnGroups.flatMap(g => g.sourceColumns));
          mappings.forEach(mapping => {
            if (!groupedColumns.has(mapping.csvColumn)) {
              let value = row[mapping.csvColumn];
              
              if (value !== null && value !== undefined && value !== '') {
                try {
                  // Get target type from existing schema if in import mode
                  const targetType = importMode === 'import' 
                    ? existingTableSchema?.columns.find(c => c.column_name === mapping.targetField)?.data_type || mapping.dataType
                    : mapping.dataType;

                  transformed[mapping.targetField] = transformValue(value, targetType);
                } catch (error) {
                  console.warn(`Failed to transform row ${i + rowIndex + 1}, column ${mapping.csvColumn}:`, error);
                  // Keep original value on transformation failure
                  transformed[mapping.targetField] = value;
                }
              }
            }
          });

          return transformed;
        });

        // Execute batch insert with conflict strategy
        let insertError = null;
        let retries = 0;
        const maxRetries = 3;
        
        while (retries < maxRetries) {
          let error = null;
          
          if (importMode === 'import' && conflictStrategy !== 'fail') {
            // Use upsert for existing table with skip/upsert strategy
            const primaryKeys = detectPrimaryKeys();
            
            if (conflictStrategy === 'upsert' && primaryKeys.length > 0) {
              // Upsert: update on conflict
              const { error: upsertError } = await supabase
                .from(tableName as any)
                .upsert(transformedBatch, {
                  onConflict: primaryKeys.join(','),
                  ignoreDuplicates: false
                });
              error = upsertError;
            } else if (conflictStrategy === 'skip') {
              // Skip: ignore duplicates
              const primaryKeys = detectPrimaryKeys();
              if (primaryKeys.length > 0) {
                const { error: skipError } = await supabase
                  .from(tableName as any)
                  .upsert(transformedBatch, {
                    onConflict: primaryKeys.join(','),
                    ignoreDuplicates: true
                  });
                error = skipError;
              } else {
                // No primary key, try insert and catch unique violations
                const { error: insertErr } = await supabase
                  .from(tableName as any)
                  .insert(transformedBatch);
                error = insertErr;
              }
            }
          } else {
            // Standard insert (fail on conflict)
            const { error: insertErr } = await supabase
              .from(tableName as any)
              .insert(transformedBatch);
            error = insertErr;
          }
          
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
          const batchNum = i / batchSize + 1;
          errorList.push(`Batch ${batchNum}: ${insertError.message}`);
          
          // Add detailed errors for each row in failed batch
          batch.forEach((row, idx) => {
            setDetailedErrors(prev => [...prev, {
              row: i + idx + 1,
              error: insertError.message,
              type: 'insert' as const
            }]);
          });
          
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
                    Import data into an existing table
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
                  <p className="text-xs text-muted-foreground">
                    Human-readable name shown in the admin interface
                  </p>
                </div>
              </div>
            )}

            {importMode === 'import' && (
              <div className="mt-4">
                <ExistingTableSelector
                  sectionId={sectionId}
                  selectedTableId={selectedExistingTableId}
                  selectedTableName={selectedExistingTableName}
                  onTableSelect={(tableId, tableName, schema) => {
                    setSelectedExistingTableId(tableId);
                    setSelectedExistingTableName(tableName);
                    setExistingTableSchema(schema);
                  }}
                />
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
          existingSchema={existingTableSchema?.columns}
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

        {importMode === 'import' && existingTableSchema && (
          <Card className="mb-4">
            <CardHeader>
              <CardTitle>Import Options</CardTitle>
              <CardDescription>Choose how to handle conflicts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Conflict Strategy</Label>
                <RadioGroup value={conflictStrategy} onValueChange={(v) => setConflictStrategy(v as any)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="fail" id="fail" />
                    <Label htmlFor="fail" className="cursor-pointer font-normal">
                      Fail on conflict (stop if duplicate found)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="skip" id="skip" />
                    <Label htmlFor="skip" className="cursor-pointer font-normal">
                      Skip duplicates (continue with other rows)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="upsert" id="upsert" />
                    <Label htmlFor="upsert" className="cursor-pointer font-normal">
                      Update existing records (upsert)
                    </Label>
                  </div>
                </RadioGroup>
              </div>
              
              <Button
                type="button"
                variant="outline"
                onClick={validateImportData}
                className="w-full"
              >
                <Eye className="h-4 w-4 mr-2" />
                Validate Data Before Import
              </Button>
            </CardContent>
          </Card>
        )}

        {showValidation && validationResults && (
          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <div className="font-semibold">
                  Validation Results: {validationResults.valid}/{csvData.length} rows valid
                </div>
                
                {validationResults.errors.length > 0 && (
                  <div>
                    <div className="text-destructive font-medium">❌ Errors ({validationResults.errors.length}):</div>
                    <div className="text-xs space-y-1 mt-1 max-h-32 overflow-y-auto">
                      {validationResults.errors.slice(0, 10).map((err, i) => (
                        <div key={i}>{err}</div>
                      ))}
                      {validationResults.errors.length > 10 && (
                        <div className="text-muted-foreground">...and {validationResults.errors.length - 10} more</div>
                      )}
                    </div>
                  </div>
                )}
                
                {validationResults.warnings.length > 0 && (
                  <div>
                    <div className="text-amber-600 font-medium">⚠️ Warnings ({validationResults.warnings.length}):</div>
                    <div className="text-xs space-y-1 mt-1 max-h-32 overflow-y-auto">
                      {validationResults.warnings.slice(0, 10).map((warn, i) => (
                        <div key={i}>{warn}</div>
                      ))}
                      {validationResults.warnings.length > 10 && (
                        <div className="text-muted-foreground">...and {validationResults.warnings.length - 10} more</div>
                      )}
                    </div>
                  </div>
                )}
                
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowValidation(false)}
                  className="mt-2"
                >
                  Close
                </Button>
              </div>
            </AlertDescription>
          </Alert>
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
          <Button onClick={() => setShowImportConfirm(true)} size="lg">
            {importMode === 'create' ? 'Create Table & Import Data' : 'Import Data'}
          </Button>
        </div>

        {/* Import Confirmation Dialog */}
        <Dialog open={showImportConfirm} onOpenChange={setShowImportConfirm}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Confirm Import</DialogTitle>
              <DialogDescription>
                Review the import settings before proceeding
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Import Mode</div>
                  <div className="text-lg font-semibold capitalize">{importMode}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Target Table</div>
                  <div className="text-lg font-semibold font-mono">
                    {importMode === 'create' ? newTableName : selectedExistingTableName}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Total Rows</div>
                  <div className="text-lg font-semibold">{csvData.length}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Columns Mapped</div>
                  <div className="text-lg font-semibold">{mappings.length + columnGroups.length}</div>
                </div>
                {importMode === 'import' && (
                  <div className="col-span-2">
                    <div className="text-sm font-medium text-muted-foreground">Conflict Strategy</div>
                    <div className="text-lg font-semibold capitalize">{conflictStrategy}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {conflictStrategy === 'fail' && 'Import will fail if duplicate records are found'}
                      {conflictStrategy === 'skip' && 'Duplicate records will be skipped'}
                      {conflictStrategy === 'upsert' && 'Existing records will be updated'}
                    </div>
                  </div>
                )}
              </div>

              <div className="border rounded-lg p-4">
                <div className="font-medium mb-2">Column Mappings ({mappings.length})</div>
                <ScrollArea className="h-32">
                  <div className="space-y-1 text-sm">
                    {mappings.slice(0, 20).map((mapping, i) => (
                      <div key={i} className="flex items-center justify-between py-1 border-b">
                        <span className="text-muted-foreground">{mapping.csvColumn}</span>
                        <span>→</span>
                        <span className="font-mono">{mapping.targetField}</span>
                        <span className="text-xs text-muted-foreground">({mapping.dataType})</span>
                      </div>
                    ))}
                    {mappings.length > 20 && (
                      <div className="text-muted-foreground text-center py-2">
                        ...and {mappings.length - 20} more columns
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>

              {columnGroups.length > 0 && (
                <div className="border rounded-lg p-4">
                  <div className="font-medium mb-2">Column Groups ({columnGroups.length})</div>
                  <div className="space-y-2 text-sm">
                    {columnGroups.map((group, i) => (
                      <div key={i} className="p-2 bg-muted rounded">
                        <div className="font-mono font-medium">{group.targetField}</div>
                        <div className="text-xs text-muted-foreground">
                          {group.sourceColumns.length} columns → JSONB array
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {validationResults && (
                <Alert variant={validationResults.errors.length > 0 ? 'destructive' : 'default'}>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-1">
                      <div className="font-semibold">
                        Validation: {validationResults.valid}/{csvData.length} rows valid
                      </div>
                      {validationResults.errors.length > 0 && (
                        <div className="text-xs text-destructive">
                          ❌ {validationResults.errors.length} errors found
                        </div>
                      )}
                      {validationResults.warnings.length > 0 && (
                        <div className="text-xs text-amber-600">
                          ⚠️ {validationResults.warnings.length} warnings
                        </div>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {importMode === 'create' && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    A new table will be created with RLS policies restricting access to admin users only.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <div className="flex gap-2 justify-end mt-4">
              <Button variant="outline" onClick={() => setShowImportConfirm(false)}>
                Cancel
              </Button>
              <Button onClick={() => {
                setShowImportConfirm(false);
                handleImport();
              }}>
                Confirm & Start Import
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  if (step === 'importing') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Importing Data</CardTitle>
          <CardDescription>
            {importMode === 'import' && conflictStrategy !== 'fail' 
              ? `Using ${conflictStrategy} strategy for conflict handling` 
              : 'Please wait while we import your data...'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Progress value={progress} className="h-2" />
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress:</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-green-600">✓ Successful:</span>
              <span className="font-medium">{importStats.success}</span>
            </div>
            {importStats.failed > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-red-600">✗ Failed:</span>
                <span className="font-medium">{importStats.failed}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total:</span>
              <span className="font-medium">{importStats.total}</span>
            </div>
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
                <div className="font-semibold mb-2">Batch Errors:</div>
                <ul className="list-disc list-inside space-y-1">
                  {errors.map((error, i) => (
                    <li key={i} className="text-sm">{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {detailedErrors.length > 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="font-semibold mb-2">
                  Detailed Row Errors ({detailedErrors.length})
                </div>
                
                {/* Group errors by type */}
                {(() => {
                  const validationErrors = detailedErrors.filter(e => e.type === 'validation');
                  const insertErrors = detailedErrors.filter(e => e.type === 'insert');
                  
                  return (
                    <ScrollArea className="h-48 w-full">
                      <div className="space-y-3 text-xs">
                        {validationErrors.length > 0 && (
                          <div>
                            <div className="font-medium text-amber-600 mb-1">
                              ⚠️ Validation Errors ({validationErrors.length})
                            </div>
                            <div className="space-y-1 ml-2">
                              {validationErrors.slice(0, 25).map((err, i) => (
                                <div key={i} className="border-b pb-1">
                                  <span className="font-medium">Row {err.row}:</span>
                                  {err.field && <span className="text-muted-foreground"> ({err.field})</span>}
                                  <span className="text-amber-600 ml-2">{err.error}</span>
                                </div>
                              ))}
                              {validationErrors.length > 25 && (
                                <div className="text-muted-foreground pt-1">
                                  ...and {validationErrors.length - 25} more validation errors
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {insertErrors.length > 0 && (
                          <div>
                            <div className="font-medium text-red-600 mb-1">
                              ❌ Insert Errors ({insertErrors.length})
                            </div>
                            <div className="space-y-1 ml-2">
                              {insertErrors.slice(0, 25).map((err, i) => (
                                <div key={i} className="border-b pb-1">
                                  <span className="font-medium">Row {err.row}:</span>
                                  {err.field && <span className="text-muted-foreground"> ({err.field})</span>}
                                  <span className="text-red-600 ml-2">{err.error}</span>
                                </div>
                              ))}
                              {insertErrors.length > 25 && (
                                <div className="text-muted-foreground pt-1">
                                  ...and {insertErrors.length - 25} more insert errors
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  );
                })()}
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
              setDetailedErrors([]);
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
