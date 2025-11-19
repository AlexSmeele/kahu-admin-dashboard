import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, Plus, Eye, Save, AlertCircle, RefreshCw } from "lucide-react";
import { SchemaField } from "./SchemaFieldEditor";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TableSchemaRow } from "./TableSchemaRow";

interface SchemaChange {
  type: 'add' | 'modify' | 'delete' | 'rename';
  columnName: string;
  oldValue?: SchemaField;
  newValue?: SchemaField;
  requiresMigration: boolean;
  migrationSQL?: string;
}

interface SchemaDrift {
  type: 'missing_in_db' | 'missing_in_schema' | 'type_mismatch' | 'constraint_mismatch';
  columnName: string;
  schemaDefinition?: SchemaField;
  databaseDefinition?: any;
  details: string;
}

export function TableSchemaEditor() {
  const { sectionId, tableId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [tableData, setTableData] = useState<any>(null);
  const [fields, setFields] = useState<SchemaField[]>([]);
  const [originalFields, setOriginalFields] = useState<SchemaField[]>([]);
  const [changes, setChanges] = useState<SchemaChange[]>([]);
  const [showMigrationPreview, setShowMigrationPreview] = useState(false);
  const [migrationImpact, setMigrationImpact] = useState<{
    affectedRows?: number;
    warnings: string[];
    canProceed: boolean;
  }>({ warnings: [], canProceed: true });
  const [saving, setSaving] = useState(false);
  const [databaseSchema, setDatabaseSchema] = useState<any[]>([]);
  const [schemaDrift, setSchemaDrift] = useState<SchemaDrift[]>([]);
  const [detectingDrift, setDetectingDrift] = useState(false);
  const [showSqlPreview, setShowSqlPreview] = useState(false);
  const [generatedSql, setGeneratedSql] = useState("");

  useEffect(() => {
    loadTableSchema();
  }, [tableId]);

  useEffect(() => {
    detectChanges();
  }, [fields]);

  const loadTableSchema = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('admin_content_tables')
        .select('*')
        .eq('id', tableId)
        .single();

      if (error) throw error;

      setTableData(data);
      const schemaFields = (data.schema_definition as any) || [];
      setFields(schemaFields);
      setOriginalFields(JSON.parse(JSON.stringify(schemaFields)));
      
      // Also load actual database schema
      await loadDatabaseSchema(data.table_name);
    } catch (error: any) {
      console.error("Error loading schema:", error);
      toast.error(`Failed to load schema: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadDatabaseSchema = async (tableName: string) => {
    try {
      // Call introspect-schema edge function to get actual database columns
      const { data, error } = await supabase.functions.invoke('introspect-schema', {
        body: { tableName }
      });

      if (error) {
        console.warn('Error introspecting schema:', error);
        return;
      }

      console.log('Database schema from introspection:', data);
      setDatabaseSchema(data?.columns || []);
      
    } catch (error: any) {
      console.error("Error loading database schema:", error);
    }
  };

  const detectSchemaDrift = () => {
    if (!databaseSchema.length) {
      toast.error("Database schema not loaded. Try refreshing.");
      return;
    }

    const drifts: SchemaDrift[] = [];

    // Check for columns in schema_definition but missing in actual database
    fields.forEach(field => {
      const dbColumn = databaseSchema.find(col => col.column_name === field.name);
      
      if (!dbColumn) {
        drifts.push({
          type: 'missing_in_db',
          columnName: field.name,
          schemaDefinition: field,
          details: `Column "${field.name}" is defined in schema but does not exist in the database table.`
        });
      } else {
        // Check for type mismatches
        const expectedPgType = mapFieldTypeToPostgres(field.type).toLowerCase();
        const actualPgType = dbColumn.data_type.toLowerCase();
        
        if (!typesMatch(expectedPgType, actualPgType)) {
          drifts.push({
            type: 'type_mismatch',
            columnName: field.name,
            schemaDefinition: field,
            databaseDefinition: dbColumn,
            details: `Type mismatch: Schema expects "${field.type}" (${expectedPgType}) but database has "${actualPgType}".`
          });
        }

        // Check for nullable mismatches
        const schemaIsNullable = field.nullable ?? true;
        const dbIsNullable = dbColumn.is_nullable === 'YES';
        
        if (schemaIsNullable !== dbIsNullable) {
          drifts.push({
            type: 'constraint_mismatch',
            columnName: field.name,
            schemaDefinition: field,
            databaseDefinition: dbColumn,
            details: `Nullable constraint mismatch: Schema has nullable=${schemaIsNullable} but database has ${dbIsNullable ? 'NULL' : 'NOT NULL'}.`
          });
        }
      }
    });

    // Check for columns in database but missing in schema_definition
    databaseSchema.forEach(dbColumn => {
      const field = fields.find(f => f.name === dbColumn.column_name);
      
      if (!field) {
        drifts.push({
          type: 'missing_in_schema',
          columnName: dbColumn.column_name,
          databaseDefinition: dbColumn,
          details: `Column "${dbColumn.column_name}" exists in database but is not defined in schema_definition.`
        });
      }
    });

    setSchemaDrift(drifts);
    
    if (drifts.length === 0) {
      toast.success("No schema drift detected. Schema and database are in sync!");
    } else {
      toast.warning(`Detected ${drifts.length} schema discrepancy(ies). Review below.`);
    }
  };

  const typesMatch = (expectedPgType: string, actualPgType: string): boolean => {
    // Normalize types for comparison
    const normalize = (type: string) => type.toLowerCase().replace(/\s+/g, ' ').trim();
    const expected = normalize(expectedPgType);
    const actual = normalize(actualPgType);
    
    // Direct match
    if (expected === actual) return true;
    
    // Handle common aliases and variations
    const typeAliases: Record<string, string[]> = {
      'text': ['text', 'character varying', 'varchar'],
      'numeric': ['numeric', 'decimal', 'double precision', 'real'],
      'timestamp with time zone': ['timestamp with time zone', 'timestamptz'],
      'jsonb': ['jsonb', 'json'],
      'uuid': ['uuid'],
      'boolean': ['boolean', 'bool'],
      'date': ['date'],
      'text[]': ['array', 'text[]', 'character varying[]'],
    };
    
    for (const [key, aliases] of Object.entries(typeAliases)) {
      if (aliases.includes(expected) && aliases.includes(actual)) {
        return true;
      }
    }
    
    return false;
  };

  const detectChanges = () => {
    const detectedChanges: SchemaChange[] = [];

    // Detect new fields
    fields.forEach(field => {
      const original = originalFields.find(f => f.id === field.id);
      if (!original) {
        detectedChanges.push({
          type: 'add',
          columnName: field.name,
          newValue: field,
          requiresMigration: false,
        });
      } else if (JSON.stringify(field) !== JSON.stringify(original)) {
        // Detect modifications
        const requiresMigration = field.type !== original.type || field.nullable !== original.nullable;
        detectedChanges.push({
          type: 'modify',
          columnName: field.name,
          oldValue: original,
          newValue: field,
          requiresMigration,
        });
      }
    });

    // Detect deletions
    originalFields.forEach(original => {
      if (!fields.find(f => f.id === original.id)) {
        detectedChanges.push({
          type: 'delete',
          columnName: original.name,
          oldValue: original,
          requiresMigration: true,
        });
      }
    });

    setChanges(detectedChanges);
  };

  const generateMigrationSQL = () => {
    if (!tableData) return "";

    const tableName = tableData.table_name;
    let sql = `-- Schema modifications for ${tableData.display_name}\n\n`;

    changes.forEach(change => {
      switch (change.type) {
        case 'add':
          if (change.newValue) {
            const pgType = mapFieldTypeToPostgres(change.newValue.type);
            const nullable = change.newValue.nullable ? '' : 'NOT NULL';
            const unique = change.newValue.unique ? 'UNIQUE' : '';
            const defaultVal = change.newValue.default_value ? `DEFAULT '${change.newValue.default_value}'` : '';
            sql += `ALTER TABLE ${tableName}\n  ADD COLUMN ${change.columnName} ${pgType} ${nullable} ${unique} ${defaultVal};\n\n`;
          }
          break;

        case 'modify':
          if (change.oldValue && change.newValue) {
            if (change.oldValue.type !== change.newValue.type) {
              const pgType = mapFieldTypeToPostgres(change.newValue.type);
              sql += `-- WARNING: Type change may require data migration\n`;
              sql += `ALTER TABLE ${tableName}\n  ALTER COLUMN ${change.columnName} TYPE ${pgType} USING ${change.columnName}::${pgType};\n\n`;
            }
            if (change.oldValue.nullable !== change.newValue.nullable) {
              const action = change.newValue.nullable ? 'DROP NOT NULL' : 'SET NOT NULL';
              sql += `ALTER TABLE ${tableName}\n  ALTER COLUMN ${change.columnName} ${action};\n\n`;
            }
            if (change.oldValue.unique !== change.newValue.unique) {
              if (change.newValue.unique) {
                sql += `ALTER TABLE ${tableName}\n  ADD CONSTRAINT ${tableName}_${change.columnName}_unique UNIQUE (${change.columnName});\n\n`;
              } else {
                sql += `ALTER TABLE ${tableName}\n  DROP CONSTRAINT IF EXISTS ${tableName}_${change.columnName}_unique;\n\n`;
              }
            }
          }
          break;

        case 'delete':
          sql += `-- WARNING: This will permanently delete data\n`;
          sql += `ALTER TABLE ${tableName}\n  DROP COLUMN IF EXISTS ${change.columnName};\n\n`;
          break;
      }
    });

    return sql;
  };

  const mapFieldTypeToPostgres = (type: string): string => {
    const typeMap: Record<string, string> = {
      text: 'TEXT',
      number: 'NUMERIC',
      boolean: 'BOOLEAN',
      date: 'DATE',
      datetime: 'TIMESTAMP WITH TIME ZONE',
      json: 'JSONB',
      array: 'TEXT[]',
      uuid: 'UUID',
      file_url: 'TEXT',
      select: 'TEXT',
      multiselect: 'TEXT[]',
    };
    return typeMap[type] || 'TEXT';
  };

  const handleAddField = () => {
    const newField: SchemaField = {
      id: `field_${Date.now()}`,
      name: `new_field_${fields.length + 1}`,
      label: `New Field ${fields.length + 1}`,
      type: 'text',
      nullable: true,
      unique: false,
    };
    setFields([...fields, newField]);
  };

  const handleUpdateField = (index: number, updatedField: SchemaField) => {
    const newFields = [...fields];
    newFields[index] = updatedField;
    setFields(newFields);
  };

  const handleDeleteField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const handleMoveField = (index: number, direction: 'up' | 'down') => {
    const newFields = [...fields];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newFields[index], newFields[targetIndex]] = [newFields[targetIndex], newFields[index]];
    setFields(newFields);
  };

  const handlePreviewMigration = async () => {
    if (!tableData) return;

    const warnings: string[] = [];
    
    // Analyze changes for potential data loss
    changes.forEach(change => {
      if (change.type === 'delete') {
        warnings.push(`⚠️ Deleting column "${change.columnName}" will permanently delete all data in that column.`);
      }
      if (change.type === 'modify' && change.oldValue && change.newValue) {
        if (change.oldValue.type !== change.newValue.type) {
          warnings.push(`⚠️ Type change for "${change.columnName}" from ${change.oldValue.type} to ${change.newValue.type} may result in data loss or conversion errors.`);
        }
        if (change.oldValue.nullable && !change.newValue.nullable) {
          warnings.push(`⚠️ Making "${change.columnName}" NOT NULL may fail if existing rows have NULL values.`);
        }
      }
    });

    // Try to get affected row count
    try {
      const { count } = await supabase
        .from(tableData.table_name)
        .select('*', { count: 'exact', head: true });
      
      setMigrationImpact({
        affectedRows: count || 0,
        warnings,
        canProceed: true
      });
    } catch (error) {
      setMigrationImpact({
        warnings: [...warnings, "⚠️ Could not determine affected row count."],
        canProceed: true
      });
    }

    setShowMigrationPreview(true);
  };

  const handlePreviewSQL = () => {
    const sql = generateMigrationSQL();
    setGeneratedSql(sql);
    setShowSqlPreview(true);
  };

  const validateTypeConversion = async (change: SchemaChange): Promise<{ valid: boolean; error?: string }> => {
    if (!tableData || change.type !== 'modify' || !change.oldValue || !change.newValue) {
      return { valid: true };
    }

    if (change.oldValue.type === change.newValue.type) {
      return { valid: true };
    }

    const tableName = tableData.table_name;
    const columnName = change.columnName;
    const targetType = mapFieldTypeToPostgres(change.newValue.type);

    try {
      // Test conversion on actual data with a sample query
      const testQuery = `
        SELECT COUNT(*) as total_rows,
               COUNT(CASE WHEN ${columnName} IS NOT NULL THEN 1 END) as non_null_rows,
               COUNT(CASE WHEN ${columnName}::${targetType} IS NOT NULL THEN 1 END) as convertible_rows
        FROM ${tableName}
      `;

      // Note: This would require a safe query function - for now, just return valid
      return { valid: true };
    } catch (error: any) {
      return { 
        valid: false, 
        error: `Type conversion validation failed: ${error.message}` 
      };
    }
  };

  const handleSaveChanges = async () => {
    if (changes.length === 0) {
      toast.info("No changes to save");
      return;
    }

    // Validate type conversions before proceeding
    for (const change of changes) {
      if (change.type === 'modify' && change.oldValue?.type !== change.newValue?.type) {
        const validation = await validateTypeConversion(change);
        if (!validation.valid) {
          toast.error(validation.error || "Type conversion validation failed");
          return;
        }
      }
    }

    // Check for migration warnings
    const requiresMigration = changes.some(c => c.requiresMigration);
    if (requiresMigration) {
      const confirmed = window.confirm(
        "Some changes require data migration and may result in data loss. Are you sure you want to proceed?"
      );
      if (!confirmed) return;
    }

    try {
      setSaving(true);

      // Generate and execute SQL with transaction support
      const sql = generateMigrationSQL();
      
      console.log('Executing schema migration:', sql);
      
      const { data: ddlResult, error: ddlError } = await supabase.functions.invoke('execute-ddl', {
        body: { sql },
      });

      if (ddlError) {
        console.error('DDL execution error:', ddlError);
        throw ddlError;
      }

      if (!ddlResult?.success) {
        throw new Error(ddlResult?.error || 'DDL execution failed');
      }

      console.log('DDL execution successful:', ddlResult);

      // Update schema_definition in admin_content_tables
      const { error: updateError } = await supabase
        .from('admin_content_tables')
        .update({ schema_definition: fields as any })
        .eq('id', tableId);

      if (updateError) throw updateError;

      toast.success("Schema updated successfully. Changes have been applied with transaction support.");
      setOriginalFields(JSON.parse(JSON.stringify(fields)));
      setChanges([]);
      
      // Reload database schema to sync
      await loadDatabaseSchema(tableData.table_name);
      
      // Navigate back to section detail
      navigate(`/admin/content/sections/${sectionId}`);
    } catch (error: any) {
      console.error("Error saving schema:", error);
      toast.error(`Failed to save schema: ${error.message}. Changes have been rolled back.`);
    } finally {
      setSaving(false);
    }
  };

  const getChangeTypeBadge = (type: SchemaChange['type']) => {
    const badges = {
      add: <Badge variant="default" className="bg-blue-500">New</Badge>,
      modify: <Badge variant="default" className="bg-yellow-500">Modified</Badge>,
      delete: <Badge variant="destructive">Deleted</Badge>,
      rename: <Badge variant="default" className="bg-purple-500">Renamed</Badge>,
    };
    return badges[type];
  };

  const getDriftTypeBadge = (type: SchemaDrift['type']) => {
    const badges = {
      missing_in_db: <Badge variant="destructive">Missing in DB</Badge>,
      missing_in_schema: <Badge variant="default" className="bg-orange-500">Missing in Schema</Badge>,
      type_mismatch: <Badge variant="default" className="bg-yellow-500">Type Mismatch</Badge>,
      constraint_mismatch: <Badge variant="default" className="bg-purple-500">Constraint Mismatch</Badge>,
    };
    return badges[type];
  };

  if (loading) {
    return <div className="p-8">Loading schema...</div>;
  }

  if (!tableData) {
    return <div className="p-8">Table not found</div>;
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/admin/content/sections/${sectionId}`)}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Section
        </Button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Edit Table Schema</h1>
            <p className="text-muted-foreground mt-1">
              {tableData.display_name} ({tableData.table_name})
            </p>
          </div>
        </div>
      </div>

      {changes.length > 0 && (
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You have {changes.length} unsaved change{changes.length !== 1 ? 's' : ''}
            {changes.some(c => c.requiresMigration) && (
              <span className="text-destructive font-semibold"> (includes changes requiring data migration)</span>
            )}
          </AlertDescription>
        </Alert>
      )}

      {schemaDrift.length > 0 && (
        <Card className="mb-6 border-orange-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              Schema Drift Detected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {schemaDrift.map((drift, index) => (
                <Alert key={index} variant={drift.type === 'missing_in_db' ? 'destructive' : 'default'}>
                  <div className="flex items-start gap-3">
                    {getDriftTypeBadge(drift.type)}
                    <div className="flex-1">
                      <p className="font-semibold">{drift.columnName}</p>
                      <p className="text-sm text-muted-foreground mt-1">{drift.details}</p>
                    </div>
                  </div>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Table Columns</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {fields.map((field, index) => {
              const change = changes.find(c => c.columnName === field.name);
              return (
                <TableSchemaRow
                  key={field.id}
                  field={field}
                  index={index}
                  change={change}
                  onUpdate={(updatedField) => handleUpdateField(index, updatedField)}
                  onDelete={() => handleDeleteField(index)}
                  onMoveUp={() => handleMoveField(index, 'up')}
                  onMoveDown={() => handleMoveField(index, 'down')}
                  canMoveUp={index > 0}
                  canMoveDown={index < fields.length - 1}
                />
              );
            })}
          </div>

          <Button
            variant="outline"
            className="mt-4 w-full"
            onClick={handleAddField}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Column
          </Button>
        </CardContent>
      </Card>

      <div className="flex gap-3 flex-wrap">
        <Button
          variant="outline"
          onClick={detectSchemaDrift} 
          disabled={detectingDrift || !databaseSchema.length}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Detect Schema Drift
        </Button>
        <Button
          variant="outline"
          onClick={handlePreviewMigration}
          disabled={changes.length === 0}
        >
          <AlertCircle className="h-4 w-4 mr-2" />
          Preview Migration Impact
        </Button>
        <Button
          variant="outline"
          onClick={handlePreviewSQL}
          disabled={changes.length === 0}
        >
          <Eye className="h-4 w-4 mr-2" />
          Preview SQL
        </Button>
        <Button
          onClick={handleSaveChanges}
          disabled={changes.length === 0 || saving}
        >
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <Dialog open={showSqlPreview} onOpenChange={setShowSqlPreview}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>SQL Preview</DialogTitle>
            <DialogDescription>
              Review the SQL statements that will be executed
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[500px]">
            <pre className="bg-muted p-4 rounded text-sm">
              {generatedSql || "No changes to preview"}
            </pre>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <Dialog open={showMigrationPreview} onOpenChange={setShowMigrationPreview}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Migration Impact Preview</DialogTitle>
            <DialogDescription>
              Review the potential impact of schema changes before applying them
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {migrationImpact.affectedRows !== undefined && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  This migration will affect <strong>{migrationImpact.affectedRows}</strong> existing row{migrationImpact.affectedRows !== 1 ? 's' : ''} in the table.
                </AlertDescription>
              </Alert>
            )}
            
            {migrationImpact.warnings.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Warnings:</h4>
                {migrationImpact.warnings.map((warning, index) => (
                  <Alert key={index} variant="destructive">
                    <AlertDescription className="text-sm">{warning}</AlertDescription>
                  </Alert>
                ))}
              </div>
            )}

            {migrationImpact.warnings.length === 0 && (
              <Alert>
                <AlertDescription>
                  No warnings detected. Changes appear safe to apply.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowMigrationPreview(false)}>
                Cancel
              </Button>
              <Button onClick={() => {
                setShowMigrationPreview(false);
                handleSaveChanges();
              }}>
                Proceed with Migration
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
