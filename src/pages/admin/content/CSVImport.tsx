import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Upload, CheckCircle, AlertCircle, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CSVUploader } from "@/components/admin/content/CSVUploader";
import { CSVColumnMapper, CSVColumn, ColumnMapping } from "@/components/admin/content/CSVColumnMapper";
import { ColumnGroupManager, ColumnGroup } from "@/components/admin/content/ColumnGroupManager";
import { CSVPreview } from "@/components/admin/content/CSVPreview";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

type ImportStep = 'upload' | 'mapping' | 'preview' | 'importing' | 'complete';

export default function CSVImport() {
  const { sectionId } = useParams();
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
  const [progress, setProgress] = useState(0);
  const [importStats, setImportStats] = useState({ success: 0, failed: 0, total: 0 });
  const [errors, setErrors] = useState<string[]>([]);

  const detectDataType = (values: string[]): CSVColumn['detectedType'] => {
    const nonEmpty = values.filter(v => v && v.trim());
    if (nonEmpty.length === 0) return 'text';

    // Check for numbers
    if (nonEmpty.every(v => !isNaN(Number(v)))) return 'number';

    // Check for booleans
    const boolValues = ['true', 'false', '1', '0', 'yes', 'no'];
    if (nonEmpty.every(v => boolValues.includes(v.toLowerCase()))) return 'boolean';

    // Check for dates
    const datePattern = /^\d{4}-\d{2}-\d{2}/;
    if (nonEmpty.every(v => datePattern.test(v))) {
      // Check if it includes time
      const timePattern = /T\d{2}:\d{2}/;
      return nonEmpty.some(v => timePattern.test(v)) ? 'datetime' : 'date';
    }

    // Check for JSON
    if (nonEmpty.every(v => {
      try { JSON.parse(v); return true; } catch { return false; }
    })) return 'json';

    return 'text';
  };

  const detectColumnGroups = (cols: CSVColumn[]): ColumnGroup[] => {
    const groups: Map<string, string[]> = new Map();
    
    cols.forEach(col => {
      // Pattern 1: "Prefix Step N" (e.g., "Brief Step 1")
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
      
      // Pattern 2: "Prefix N" (e.g., "Brief 1")
      const match2 = col.name.match(/^(.+)\s+(\d+)$/i);
      if (match2 && !match1) {  // Only if Pattern 1 didn't match
        const [_, prefix, num] = match2;
        const key = prefix.trim();
        if (!groups.has(key)) groups.set(key, []);
        const index = parseInt(num) - 1;
        if (!groups.get(key)![index]) {
          groups.get(key)![index] = col.name;
        }
      }
    });
    
    // Convert to ColumnGroup objects
    return Array.from(groups.entries())
      .filter(([_, colNames]) => colNames.filter(Boolean).length >= 2)
      .map(([prefix, colNames], idx) => ({
        id: `group_${idx}`,
        targetField: prefix.toLowerCase().replace(/\s+/g, '_'),
        sourceColumns: colNames.filter(Boolean),
        dataType: 'json' as const,
      }));
  };

  const parseCSV = (text: string): any[] => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length === 0) return [];

    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const rows = lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      const row: any = {};
      headers.forEach((header, i) => {
        row[header] = values[i] || '';
      });
      return row;
    });

    return [{ headers }, ...rows];
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
      
      if (parsed.length < 2) {
        toast({
          title: "Invalid CSV",
          description: "CSV file must contain headers and at least one row of data",
          variant: "destructive",
        });
        return;
      }

      const headers = parsed[0].headers;
      const dataRows = parsed.slice(1);
      
      // Analyze columns
      const analyzedColumns: CSVColumn[] = headers.map((header: string, index: number) => {
        const sampleValues = dataRows.slice(0, 5).map((row: any) => row[header] || '');
        const allValues = dataRows.map((row: any) => row[header] || '');
        
        return {
          name: header,
          index,
          sampleValues,
          detectedType: detectDataType(allValues),
        };
      });

      setColumns(analyzedColumns);
      setCsvData(dataRows);
      
      // Auto-detect column groups
      const detectedGroups = detectColumnGroups(analyzedColumns);
      setColumnGroups(detectedGroups);
      
      // Show toast if groups were detected
      if (detectedGroups.length > 0) {
        toast({
          title: "Column groups detected",
          description: `Found ${detectedGroups.length} potential column ${detectedGroups.length === 1 ? 'group' : 'groups'}. Review and adjust in the Column Groups section.`,
        });
      }
      
      // Initialize mappings (mark grouped columns)
      const groupedColumnNames = new Set(
        detectedGroups.flatMap(g => g.sourceColumns)
      );
      
      const initialMappings: ColumnMapping[] = analyzedColumns.map(col => ({
        csvColumn: col.name,
        targetField: col.name.toLowerCase().replace(/\s+/g, '_'),
        dataType: col.detectedType,
        isGrouped: groupedColumnNames.has(col.name),
      }));
      setMappings(initialMappings);

      // Generate table name from filename
      const tableName = selectedFile.name
        .replace('.csv', '')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '_');
      setNewTableName(tableName);

      setStep('mapping');
      toast({
        title: "CSV parsed successfully",
        description: `Found ${headers.length} columns and ${dataRows.length} rows`,
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
    // Add column group fields
    const groupFields = columnGroups.map(g => 
      `  ${g.targetField} JSONB DEFAULT '[]'::jsonb`
    );
    
    const fields = [
      ...groupFields,
      ...mappings
        .filter(m => m.targetField && !m.isGrouped)
        .map(m => {
        let sqlType = 'TEXT';
        switch (m.dataType) {
          case 'number': sqlType = 'NUMERIC'; break;
          case 'boolean': sqlType = 'BOOLEAN'; break;
          case 'date': sqlType = 'DATE'; break;
          case 'datetime': sqlType = 'TIMESTAMP WITH TIME ZONE'; break;
          case 'json': sqlType = 'JSONB'; break;
          case 'uuid': sqlType = 'UUID'; break;
        }
        return `  ${m.targetField} ${sqlType}`;
      })
    ].join(',\n');

    return `-- Auto-generated from CSV import
CREATE TABLE IF NOT EXISTS public.${newTableName} (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
${fields},
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.${newTableName} ENABLE ROW LEVEL SECURITY;

-- Create admin policies
CREATE POLICY "Admins can manage ${newTableName}"
  ON public.${newTableName}
  FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Create updated_at trigger
CREATE TRIGGER update_${newTableName}_updated_at
  BEFORE UPDATE ON public.${newTableName}
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();`;
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

    setStep('importing');
    setProgress(0);
    setImportStats({ success: 0, failed: 0, total: csvData.length });
    const newErrors: string[] = [];

    const batchSize = 100;
    let successCount = 0;
    let failedCount = 0;

    for (let i = 0; i < csvData.length; i += batchSize) {
      const batch = csvData.slice(i, i + batchSize);
      
      const records = batch.map(row => {
        const record: any = {};
        
        // First, process column groups
        columnGroups.forEach(group => {
          const arrayValues = group.sourceColumns
            .map(colName => {
              const val = row[colName];
              // Handle empty, null, or undefined values
              if (val === null || val === undefined || val === '') return null;
              return typeof val === 'string' ? val.trim() : String(val);
            })
            .filter((val): val is string => val !== null && val !== '');
          
          // Always set as array, even if empty
          record[group.targetField] = arrayValues;
        });
        
        // Then, process regular mappings (skip grouped columns)
        mappings.forEach(mapping => {
          if (!mapping.targetField || mapping.isGrouped) return;
          
          let value = row[mapping.csvColumn];
          
          // Type conversion
          if (mapping.dataType === 'number') {
            value = value ? Number(value) : null;
          } else if (mapping.dataType === 'boolean') {
            value = ['true', '1', 'yes'].includes(value?.toLowerCase());
            } else if (mapping.dataType === 'json') {
              try {
                // If it's already parsed or it's an array/object, keep as is
                if (typeof value === 'object') {
                  // Already an object or array
                } else if (typeof value === 'string' && value.trim()) {
                  value = JSON.parse(value);
                } else {
                  value = null;
                }
              } catch {
                // If JSON parsing fails, wrap in array if it looks like comma-separated values
                if (typeof value === 'string' && value.includes(',')) {
                  value = value.split(',').map(v => v.trim()).filter(Boolean);
                } else {
                  value = null;
                }
              }
            }
          
          record[mapping.targetField] = value;
        });
        return record;
      });

      try {
        const { error } = await supabase
          .from(newTableName as any)
          .insert(records);

        if (error) throw error;
        successCount += records.length;
      } catch (error: any) {
        failedCount += records.length;
        newErrors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${error.message}`);
      }

      setProgress(Math.round(((i + batch.length) / csvData.length) * 100));
      setImportStats({ success: successCount, failed: failedCount, total: csvData.length });
    }

    setErrors(newErrors);
    setStep('complete');

    if (failedCount === 0) {
      toast({
        title: "Import complete",
        description: `Successfully imported ${successCount} records`,
      });
    } else {
      toast({
        title: "Import completed with errors",
        description: `${successCount} succeeded, ${failedCount} failed`,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/admin/content/sections/${sectionId}/tables`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl md:text-3xl font-bold">CSV Import</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Import data from CSV files
          </p>
        </div>
      </div>

      {step === 'upload' && (
        <Card>
          <CardHeader>
            <CardTitle>Upload CSV File</CardTitle>
            <CardDescription>
              Select a CSV file to import. The first row should contain column headers.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CSVUploader onFileSelect={handleFileSelect} />
          </CardContent>
        </Card>
      )}

      {step === 'mapping' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Import Mode</CardTitle>
              <CardDescription>
                Choose whether to create a new table or import into an existing one
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup value={importMode} onValueChange={(v) => setImportMode(v as 'create' | 'import')} className="space-y-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="create" id="create" />
                  <Label htmlFor="create" className="cursor-pointer">
                    <div className="font-medium">Create new table</div>
                    <div className="text-sm text-muted-foreground">Generate SQL to create a new database table</div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="import" id="import" />
                  <Label htmlFor="import" className="cursor-pointer">
                    <div className="font-medium">Import to existing table</div>
                    <div className="text-sm text-muted-foreground">Import data into an already created table</div>
                  </Label>
                </div>
              </RadioGroup>

              {importMode === 'create' && (
                <div className="mt-4 space-y-2">
                  <Label htmlFor="table-name">New Table Name *</Label>
                  <Input
                    id="table-name"
                    value={newTableName}
                    onChange={(e) => setNewTableName(e.target.value)}
                    placeholder="my_table"
                    pattern="[a-z_]+"
                  />
                  <p className="text-xs text-muted-foreground">Lowercase letters and underscores only</p>
                </div>
              )}
            </CardContent>
          </Card>

          <ColumnGroupManager
            columns={columns}
            groups={columnGroups}
            onGroupsChange={(newGroups) => {
              setColumnGroups(newGroups);
              // Update mappings to mark grouped columns
              const groupedColumnNames = new Set(
                newGroups.flatMap(g => g.sourceColumns)
              );
              setMappings(prev =>
                prev.map(m => ({
                  ...m,
                  isGrouped: groupedColumnNames.has(m.csvColumn),
                }))
              );
            }}
            groupedColumns={new Set(columnGroups.flatMap(g => g.sourceColumns))}
          />

          <CSVColumnMapper
            columns={columns}
            mappings={mappings}
            onMappingChange={setMappings}
            mode={importMode}
            groupedColumns={new Set(columnGroups.flatMap(g => g.sourceColumns))}
          />

          {/* Preview Section */}
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
                  Run this SQL migration before importing data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto max-h-[300px]">
                  <code>{generateTableSQL()}</code>
                </pre>
                <Alert className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Copy the SQL above and run it as a migration before proceeding with the import.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          )}

          <div className="flex flex-col sm:flex-row justify-end gap-2">
            <Button variant="outline" onClick={() => setStep('upload')} className="sm:w-auto">
              Back
            </Button>
            <Button 
              onClick={handleImport}
              disabled={importMode === 'create' && !newTableName}
              className="sm:w-auto"
            >
              <Upload className="mr-2 h-4 w-4" />
              Start Import ({csvData.length} rows)
            </Button>
          </div>
        </div>
      )}

      {step === 'importing' && (
        <Card>
          <CardHeader>
            <CardTitle>Importing Data</CardTitle>
            <CardDescription>
              Processing {csvData.length} records...
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={progress} />
            <div className="text-sm text-muted-foreground">
              {importStats.success} succeeded, {importStats.failed} failed of {importStats.total} total
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'complete' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {importStats.failed === 0 ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Import Complete
                </>
              ) : (
                <>
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                  Import Completed with Errors
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{importStats.success}</div>
                <div className="text-sm text-muted-foreground">Successful</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-red-600">{importStats.failed}</div>
                <div className="text-sm text-muted-foreground">Failed</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">{importStats.total}</div>
                <div className="text-sm text-muted-foreground">Total</div>
              </div>
            </div>

            {errors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-medium mb-2">Errors encountered:</div>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {errors.slice(0, 5).map((error, i) => (
                      <li key={i}>{error}</li>
                    ))}
                    {errors.length > 5 && <li>...and {errors.length - 5} more</li>}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => navigate(`/admin/content/sections/${sectionId}/tables`)}>
                Back to Tables
              </Button>
              <Button onClick={() => {
                setStep('upload');
                setFile(null);
                setCsvData([]);
                setColumns([]);
                setMappings([]);
              }}>
                Import Another File
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
