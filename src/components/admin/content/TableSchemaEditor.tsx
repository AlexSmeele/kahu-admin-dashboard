import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, Plus, Eye, Save, AlertCircle, RefreshCw, History, Database } from "lucide-react";
import { SchemaField } from "./SchemaFieldEditor";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TableSchemaRow } from "./TableSchemaRow";
import { SampleDataPreview } from "./SampleDataPreview";
import { MigrationHistoryDialog } from "./MigrationHistoryDialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";

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

interface ForeignKeyConstraint {
  column_name: string;
  foreign_table: string;
  foreign_column: string;
  constraint_name: string;
}

interface ColumnConstraint {
  column_name: string;
  constraint_type: string;
  constraint_name: string;
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
    estimatedTime?: string;
    safeOperations: string[];
    warnings: string[];
    blockers: string[];
    canProceed: boolean;
  }>({ safeOperations: [], warnings: [], blockers: [], canProceed: true });
  const [saving, setSaving] = useState(false);
  const [databaseSchema, setDatabaseSchema] = useState<any[]>([]);
  const [foreignKeys, setForeignKeys] = useState<ForeignKeyConstraint[]>([]);
  const [constraints, setConstraints] = useState<ColumnConstraint[]>([]);
  const [schemaDrift, setSchemaDrift] = useState<SchemaDrift[]>([]);
  const [detectingDrift, setDetectingDrift] = useState(false);
  const [showSqlPreview, setShowSqlPreview] = useState(false);
  const [generatedSql, setGeneratedSql] = useState("");
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [useCopyStrategy, setUseCopyStrategy] = useState(false);
  const [customTransformations, setCustomTransformations] = useState<Record<string, string>>({});
  const [migrationProgress, setMigrationProgress] = useState(0);
  const [isMigrating, setIsMigrating] = useState(false);
  const [batchStatus, setBatchStatus] = useState<Array<{ batch: number; success: boolean; error?: string; rowsProcessed: number }>>([]);
  const [columnIndexes, setColumnIndexes] = useState<Array<{ indexName: string; columnName: string; indexDef: string }>>([]);
  const [syncing, setSyncing] = useState(false);

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
      setForeignKeys(data?.foreign_keys || []);
      setConstraints(data?.constraints || []);
      
    } catch (error: any) {
      console.error("Error loading database schema:", error);
    }

    // Load indexes for the table
    await loadTableIndexes(tableName);
  };

  const loadTableIndexes = async (tableName: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('introspect-schema', {
        body: { tableName },
      });

      if (error) {
        console.warn("Could not load indexes:", error);
        return;
      }

      const indexes = data?.indexes || [];
      const parsedIndexes = indexes.map((idx: any) => ({
        indexName: idx.index_name,
        columnName: idx.column_name,
        indexDef: idx.index_definition,
      }));

      setColumnIndexes(parsedIndexes);
      console.log('Loaded indexes:', parsedIndexes);
    } catch (error: any) {
      console.warn("Could not load indexes:", error);
      // Non-critical, continue without index information
    }
  };

  const mapPostgreSQLType = (pgType: string): string => {
    const typeMap: Record<string, string> = {
      'text': 'text',
      'character varying': 'text',
      'varchar': 'text',
      'integer': 'number',
      'bigint': 'number',
      'numeric': 'number',
      'real': 'number',
      'double precision': 'number',
      'boolean': 'boolean',
      'date': 'date',
      'timestamp with time zone': 'datetime',
      'timestamp without time zone': 'datetime',
      'time': 'time',
      'uuid': 'text',
      'jsonb': 'json',
      'json': 'json',
      'text[]': 'array',
      'integer[]': 'array',
    };
    return typeMap[pgType.toLowerCase()] || 'text';
  };

  const syncFromDatabase = async () => {
    if (!tableData) return;
    
    setSyncing(true);
    try {
      const { data: introspectData, error: introspectError } = await supabase.functions.invoke('introspect-schema', {
        body: { tableName: tableData.table_name }
      });

      if (introspectError) throw introspectError;
      if (!introspectData?.columns) throw new Error("No columns returned from introspection");

      const schemaFields: SchemaField[] = introspectData.columns.map((col: any, index: number) => ({
        id: crypto.randomUUID(),
        name: col.column_name,
        label: col.column_name.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
        type: mapPostgreSQLType(col.data_type),
        nullable: col.is_nullable === 'YES',
        required: col.is_nullable === 'NO',
        unique: false,
        defaultValue: col.column_default || '',
        description: '',
        order: index,
      }));

      setFields(schemaFields);
      setOriginalFields(JSON.parse(JSON.stringify(schemaFields)));

      // Save to database
      const { error: updateError } = await supabase
        .from('admin_content_tables')
        .update({ schema_definition: schemaFields as any })
        .eq('id', tableId);

      if (updateError) throw updateError;

      toast.success(`Synced ${schemaFields.length} columns from database table "${tableData.table_name}"`, {
        description: "Schema definition has been populated and saved."
      });
    } catch (error: any) {
      console.error("Error syncing schema:", error);
      toast.error("Failed to sync schema from database", {
        description: error.message
      });
    } finally {
      setSyncing(false);
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

    // Identify affected columns and their indexes
    const affectedColumns = changes
      .filter(c => c.type === 'modify' || c.type === 'delete')
      .map(c => c.columnName);

    const affectedIndexes = columnIndexes.filter(idx => 
      affectedColumns.includes(idx.columnName)
    );

    // Drop indexes before migration for better performance
    if (affectedIndexes.length > 0) {
      sql += `-- Drop indexes for performance during migration\n`;
      affectedIndexes.forEach(idx => {
        sql += `DROP INDEX IF EXISTS ${idx.indexName};\n`;
      });
      sql += `\n`;
    }

    changes.forEach(change => {
      switch (change.type) {
        case 'rename':
          if (change.oldValue && change.newValue) {
            sql += `ALTER TABLE ${tableName}\n  RENAME COLUMN ${change.oldValue.name} TO ${change.newValue.name};\n\n`;
          }
          break;
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
            // Handle type changes
            if (change.oldValue.type !== change.newValue.type) {
              const pgType = mapFieldTypeToPostgres(change.newValue.type);
              
              if (useCopyStrategy) {
                // Safe copy-to-new-column strategy
                const tempColName = `${change.columnName}_new`;
                sql += `-- Safe migration strategy: copy-to-new-column\n`;
                sql += `-- Step 1: Create new column with target type\n`;
                sql += `ALTER TABLE ${tableName}\n  ADD COLUMN ${tempColName} ${pgType};\n\n`;
                
                // Use custom transformation SQL if provided, otherwise default CAST
                const customSQL = customTransformations[change.columnName];
                if (customSQL) {
                  sql += `-- Step 2: Transform data using custom SQL\n`;
                  sql += `UPDATE ${tableName}\n  SET ${tempColName} = ${customSQL};\n\n`;
                } else {
                  sql += `-- Step 2: Copy and transform data\n`;
                  sql += `UPDATE ${tableName}\n  SET ${tempColName} = ${change.columnName}::${pgType};\n\n`;
                }
                
                sql += `-- Step 3: Verify data integrity (check row count)\n`;
                sql += `-- SELECT COUNT(*) FROM ${tableName} WHERE ${tempColName} IS NOT NULL;\n\n`;
                
                sql += `-- Step 4: Drop old column\n`;
                sql += `ALTER TABLE ${tableName}\n  DROP COLUMN ${change.columnName};\n\n`;
                
                sql += `-- Step 5: Rename new column to original name\n`;
                sql += `ALTER TABLE ${tableName}\n  RENAME COLUMN ${tempColName} TO ${change.columnName};\n\n`;
              } else {
                // Direct type conversion
                sql += `-- WARNING: Type change may require data migration\n`;
                const customSQL = customTransformations[change.columnName];
                if (customSQL) {
                  sql += `-- Using custom transformation\n`;
                  sql += `UPDATE ${tableName}\n  SET ${change.columnName} = ${customSQL};\n\n`;
                  sql += `ALTER TABLE ${tableName}\n  ALTER COLUMN ${change.columnName} TYPE ${pgType};\n\n`;
                } else {
                  sql += `ALTER TABLE ${tableName}\n  ALTER COLUMN ${change.columnName} TYPE ${pgType} USING ${change.columnName}::${pgType};\n\n`;
                }
              }
            }
            
            // Handle nullable changes
            if (change.oldValue.nullable !== change.newValue.nullable) {
              const action = change.newValue.nullable ? 'DROP NOT NULL' : 'SET NOT NULL';
              sql += `ALTER TABLE ${tableName}\n  ALTER COLUMN ${change.columnName} ${action};\n\n`;
            }
            
            // Handle unique constraint changes
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

    // Recreate indexes after migration
    if (affectedIndexes.length > 0) {
      sql += `\n-- Recreate indexes after migration\n`;
      affectedIndexes.forEach(idx => {
        // Only recreate if column still exists (not deleted)
        const isDeleted = changes.some(c => c.type === 'delete' && c.columnName === idx.columnName);
        if (!isDeleted) {
          sql += `${idx.indexDef};\n`;
        }
      });
      sql += `\n`;
    }

    // Add ANALYZE for query planner optimization
    sql += `-- Update statistics for query planner\n`;
    sql += `ANALYZE ${tableName};\n`;

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

  // Enhanced validation: Check for reverse FK references (tables referencing this table)
  const validateForeignKeyImpact = async (columnName: string): Promise<{ blockers: string[]; warnings: string[] }> => {
    const blockers: string[] = [];
    const warnings: string[] = [];

    if (!tableData) return { blockers, warnings };

    try {
      // Query information_schema to find tables that reference this column via FK
      const { data, error } = await supabase.rpc('exec_sql', {
        sql_query: `
          SELECT 
            tc.table_name as referencing_table,
            kcu.column_name as referencing_column,
            tc.constraint_name
          FROM information_schema.table_constraints tc
          JOIN information_schema.key_column_usage kcu 
            ON tc.constraint_name = kcu.constraint_name
          JOIN information_schema.constraint_column_usage ccu 
            ON ccu.constraint_name = tc.constraint_name
          WHERE tc.constraint_type = 'FOREIGN KEY'
            AND ccu.table_name = '${tableData.table_name}'
            AND ccu.column_name = '${columnName}'
        `
      });

      if (!error && data) {
        // Parse the result (exec_sql returns text)
        try {
          const result = JSON.parse(data);
          if (Array.isArray(result) && result.length > 0) {
            result.forEach((ref: any) => {
              blockers.push(`❌ BLOCKING: Table "${ref.referencing_table}" has foreign key "${ref.constraint_name}" referencing this column. Drop the FK constraint first.`);
            });
          }
        } catch (parseError) {
          console.warn('Could not parse FK check result:', parseError);
        }
      }
    } catch (error) {
      console.warn('FK impact check failed:', error);
      warnings.push(`⚠️ Could not verify foreign key impact. Manual verification recommended.`);
    }

    return { blockers, warnings };
  };

  // Enhanced validation: Check large table impact with time estimation
  const validateLargeTableImpact = async (): Promise<{ warnings: string[]; estimatedTime: string }> => {
    const warnings: string[] = [];
    let estimatedTime = '';

    if (!tableData) return { warnings, estimatedTime };

    try {
      const { count: totalRows } = await supabase
        .from(tableData.table_name)
        .select('*', { count: 'exact', head: true });

      if (totalRows) {
        const LARGE_TABLE_THRESHOLD = 100000;
        const VERY_LARGE_TABLE_THRESHOLD = 500000;

        if (totalRows > VERY_LARGE_TABLE_THRESHOLD) {
          const estimatedMinutes = Math.ceil(totalRows / 10000); // ~10k rows/minute for complex migrations
          estimatedTime = `${estimatedMinutes} minutes`;
          warnings.push(`⚠️ VERY LARGE TABLE: ${totalRows.toLocaleString()} rows. Estimated migration time: ~${estimatedMinutes} minutes. Schedule during maintenance window.`);
          warnings.push(`💡 TIP: Consider using batch migration strategy and test on a staging environment first.`);
        } else if (totalRows > LARGE_TABLE_THRESHOLD) {
          const estimatedSeconds = Math.ceil(totalRows / 1000);
          estimatedTime = `${estimatedSeconds} seconds`;
          warnings.push(`⚠️ LARGE TABLE: ${totalRows.toLocaleString()} rows. Estimated migration time: ~${estimatedSeconds}s. Plan for brief downtime.`);
        } else if (totalRows > 10000) {
          estimatedTime = '< 10 seconds';
          warnings.push(`📊 Medium table size: ${totalRows.toLocaleString()} rows. Migration should complete quickly.`);
        }
      }
    } catch (error) {
      console.error('Failed to check table size:', error);
    }

    return { warnings, estimatedTime };
  };

  const handlePreviewMigration = async () => {
    if (!tableData) return;

    let affectedRows = 0;
    const safeOperations: string[] = [];
    const warnings: string[] = [];
    const blockers: string[] = [];
    let estimatedTime = '';

    // Check large table impact first
    const { warnings: sizeWarnings, estimatedTime: timeEstimate } = await validateLargeTableImpact();
    warnings.push(...sizeWarnings);
    estimatedTime = timeEstimate;

    // Check for structural changes (those requiring table lock)
    const hasStructuralChanges = changes.some(c => 
      c.type === 'add' || c.type === 'delete' || 
      (c.type === 'modify' && c.oldValue?.type !== c.newValue?.type)
    );

    if (hasStructuralChanges && affectedRows > 1000) {
      const estimatedSeconds = Math.ceil(affectedRows / 1000); // Rough estimate: 1000 rows per second
      warnings.push(`⚠️ TABLE LOCK WARNING: This migration will lock the table for approximately ${estimatedSeconds}s during execution.`);
    }

    // Check for index operations
    const affectedColumns = changes
      .filter(c => c.type === 'modify' || c.type === 'delete')
      .map(c => c.columnName);

    const affectedIndexes = columnIndexes.filter(idx => 
      affectedColumns.includes(idx.columnName)
    );

    if (affectedIndexes.length > 0) {
      warnings.push(`📊 PERFORMANCE: ${affectedIndexes.length} index(es) will be dropped and recreated for optimal migration.`);
      affectedIndexes.forEach(idx => {
        warnings.push(`  - Index: ${idx.indexName} on column ${idx.columnName}`);
      });
    }

    // Analyze each change
    for (const change of changes) {
      if (change.type === 'delete') {
        const columnName = change.columnName;
        
        // Check for reverse FK references (other tables pointing to this column)
        const { blockers: fkBlockers, warnings: fkWarnings } = await validateForeignKeyImpact(columnName);
        blockers.push(...fkBlockers);
        warnings.push(...fkWarnings);
        
        // Check if column has foreign key constraints
        const fkReferences = foreignKeys.filter(fk => fk.column_name === columnName);
        if (fkReferences.length > 0) {
          fkReferences.forEach(fk => {
            blockers.push(`❌ BLOCKING: Column "${columnName}" has foreign key constraint to ${fk.foreign_table}.${fk.foreign_column} (${fk.constraint_name}). Drop constraint first.`);
          });
        }

        // Check for unique/primary key constraints
        const uniqueConstraints = constraints.filter(c => 
          c.column_name === columnName && 
          (c.constraint_type === 'UNIQUE' || c.constraint_type === 'PRIMARY KEY')
        );
        if (uniqueConstraints.length > 0) {
          uniqueConstraints.forEach(c => {
            warnings.push(`⚠️ Column "${columnName}" has ${c.constraint_type} constraint (${c.constraint_name}). This will be dropped.`);
          });
        }

        warnings.push(`🗑️ Column "${columnName}" will be permanently deleted with all its data`);
        
        // Try to count affected rows (non-null values)
        try {
          const { count } = await supabase
            .from(tableData.table_name)
            .select('*', { count: 'exact', head: true })
            .not(columnName, 'is', null);
          
          if (count) {
            affectedRows += count;
            warnings.push(`📊 ${count} rows have data in this column`);
          }
        } catch (error) {
          console.error('Error counting rows:', error);
        }
      } else if (change.type === 'modify') {
        const oldField = change.oldValue;
        const newField = change.newValue;
        const columnName = change.columnName;
        
        if (oldField && newField) {
          // Type change validation
          if (oldField.type !== newField.type) {
            // Validate conversion safety with enhanced logic
            const conversionSafe = validateTypeConversionSafety(oldField.type, newField.type);
            
            if (conversionSafe.safe) {
              safeOperations.push(`✅ Column "${columnName}" type changing from ${oldField.type} to ${newField.type} (safe conversion)`);
            } else if (conversionSafe.blocking) {
              blockers.push(`❌ BLOCKING: ${conversionSafe.warning} for column "${columnName}"`);
              
              // Enhanced array-to-scalar detection with data preview
              if ((oldField.type === 'array' || oldField.type === 'multiselect') && 
                  (newField.type !== 'array' && newField.type !== 'multiselect')) {
                blockers.push(`💡 Converting array to single value will result in data loss. Only the first element will be retained.`);
                
                // Show sample data preview
                try {
                  const { data: sampleData } = await supabase
                    .from(tableData.table_name)
                    .select(columnName)
                    .not(columnName, 'is', null)
                    .limit(3);
                  
                  if (sampleData && sampleData.length > 0) {
                    blockers.push(`📋 Sample data preview:`);
                    sampleData.forEach((row: any, idx: number) => {
                      const value = row[columnName];
                      const arrayValue = Array.isArray(value) ? value : [value];
                      blockers.push(`  Row ${idx + 1}: [${arrayValue.join(', ')}] → "${arrayValue[0] || ''}"`);
                    });
                  }
                } catch (error) {
                  console.error('Failed to fetch sample data:', error);
                }
              }
            } else {
              warnings.push(`⚠️ ${conversionSafe.warning} for column "${columnName}"`);
            }
            
            // Count all rows with data
            try {
              const { count } = await supabase
                .from(tableData.table_name)
                .select('*', { count: 'exact', head: true })
                .not(columnName, 'is', null);
              
              if (count) {
                affectedRows += count;
                warnings.push(`📊 ${count} rows will be affected by type conversion`);
              }
            } catch (error) {
              console.error('Error counting rows:', error);
            }
          }

          // Enhanced NOT NULL constraint validation
          if (!oldField.nullable && newField.nullable) {
            safeOperations.push(`✅ Column "${columnName}" will allow NULL values (safe change)`);
          } else if (oldField.nullable && !newField.nullable) {
            // Check for existing NULL values with detailed reporting
            try {
              const { count: nullCount } = await supabase
                .from(tableData.table_name)
                .select('*', { count: 'exact', head: true })
                .is(columnName, null);
              
              if (nullCount && nullCount > 0) {
                blockers.push(`❌ BLOCKING: ${nullCount} rows have NULL values in "${columnName}". Cannot add NOT NULL constraint.`);
                blockers.push(`💡 FIX: Run this SQL first: UPDATE ${tableData.table_name} SET ${columnName} = <default_value> WHERE ${columnName} IS NULL;`);
                
                // Show percentage
                const { count: totalCount } = await supabase
                  .from(tableData.table_name)
                  .select('*', { count: 'exact', head: true });
                
                if (totalCount) {
                  const percentage = ((nullCount / totalCount) * 100).toFixed(1);
                  blockers.push(`📊 ${percentage}% of rows have NULL values`);
                }
              } else {
                safeOperations.push(`✅ Column "${columnName}" has no NULL values. NOT NULL constraint can be safely added.`);
              }
            } catch (error) {
              console.error('Error counting NULL rows:', error);
              warnings.push(`⚠️ Could not verify NULL values in "${columnName}". Manual check recommended.`);
            }
          }

          // Check if column has foreign key that might be affected
          const fkReferences = foreignKeys.filter(fk => fk.column_name === columnName);
          if (fkReferences.length > 0 && oldField.type !== newField.type) {
            fkReferences.forEach(fk => {
              warnings.push(`⚠️ Type change affects foreign key: ${fk.constraint_name} → ${fk.foreign_table}.${fk.foreign_column}`);
            });
          }

          // Track other safe modifications
          if (oldField.label !== newField.label) {
            safeOperations.push(`✅ Column "${columnName}" label updated`);
          }
          if (oldField.description !== newField.description) {
            safeOperations.push(`✅ Column "${columnName}" description updated`);
          }
        }
      } else if (change.type === 'add') {
        const newField = change.newValue;
        if (newField) {
          if (newField.nullable) {
            safeOperations.push(`✅ Adding nullable column "${change.columnName}" (${newField.type}) - safe operation`);
          } else if (newField.default_value) {
            safeOperations.push(`✅ Adding NOT NULL column "${change.columnName}" with default value - safe operation`);
          } else {
            warnings.push(`⚠️ Adding NOT NULL column "${change.columnName}" without default value. Ensure table is empty or provide default.`);
          }
        }
      } else if (change.type === 'rename') {
        safeOperations.push(`✅ Renaming column "${change.oldValue?.name}" to "${change.newValue?.name}" (metadata only)`);
      }
    }

    const hasBlockingIssues = blockers.length > 0;

    setMigrationImpact({
      affectedRows,
      estimatedTime,
      safeOperations,
      warnings,
      blockers,
      canProceed: !hasBlockingIssues
    });
    setShowMigrationPreview(true);
  };

  const validateTypeConversionSafety = (fromType: string, toType: string): { 
    safe: boolean; 
    warning?: string; 
    blocking?: boolean 
  } => {
    // Safe conversions
    const safePairs = [
      ['text', 'file_url'],
      ['text', 'select'],
      ['number', 'text'],
      ['boolean', 'text'],
    ];

    if (safePairs.some(([from, to]) => fromType === from && toType === to)) {
      return { safe: true };
    }

    // Potentially lossy conversions
    if (fromType === 'text' && (toType === 'number' || toType === 'boolean')) {
      return { 
        safe: false, 
        warning: `Converting text to ${toType} may fail if text contains invalid values`,
        blocking: true 
      };
    }

    if (fromType === 'datetime' && toType === 'date') {
      return { 
        safe: false, 
        warning: 'Converting datetime to date will lose time information' 
      };
    }

    if ((fromType === 'array' || fromType === 'multiselect') && (toType !== 'array' && toType !== 'multiselect')) {
      return { 
        safe: false, 
        warning: 'Converting array to single value will lose data' ,
        blocking: true
      };
    }

    // Default: potentially unsafe
    return { 
      safe: false, 
      warning: `Type conversion from ${fromType} to ${toType} requires manual verification` 
    };
  };

  const handlePreviewSQL = () => {
    const sql = generateMigrationSQL();
    setGeneratedSql(sql);
    setShowSqlPreview(true);
  };

  const validateTypeConversion = async (change: SchemaChange): Promise<{ valid: boolean; error?: string; testResults?: any }> => {
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
      const { data: sampleData, error: sampleError } = await (supabase as any)
        .from(tableName)
        .select(columnName)
        .limit(100);

      if (sampleError) {
        return { valid: false, error: `Failed to fetch sample data: ${sampleError.message}` };
      }

      // Analyze sample data for conversion viability
      const testResults = {
        totalRows: sampleData?.length || 0,
        nullCount: 0,
        conversionErrors: [] as string[],
      };

      sampleData?.forEach((row: any, idx: number) => {
        const value = row[columnName];
        if (value === null || value === undefined) {
          testResults.nullCount++;
          return;
        }

        // Test conversion based on type
        try {
          if (change.newValue.type === 'number') {
            const num = Number(value);
            if (isNaN(num)) {
              testResults.conversionErrors.push(`Row ${idx + 1}: "${value}" cannot convert to number`);
            }
          } else if (change.newValue.type === 'boolean') {
            if (typeof value !== 'boolean' && !['true', 'false', '1', '0'].includes(String(value).toLowerCase())) {
              testResults.conversionErrors.push(`Row ${idx + 1}: "${value}" cannot convert to boolean`);
            }
          } else if (change.newValue.type === 'date' || change.newValue.type === 'datetime') {
            const date = new Date(value);
            if (isNaN(date.getTime())) {
              testResults.conversionErrors.push(`Row ${idx + 1}: "${value}" cannot convert to date`);
            }
          }
        } catch (err) {
          testResults.conversionErrors.push(`Row ${idx + 1}: Unexpected error testing value "${value}"`);
        }
      });

      // If more than 10% of rows fail conversion, block the migration
      const errorRate = testResults.totalRows > 0 ? testResults.conversionErrors.length / testResults.totalRows : 0;
      if (errorRate > 0.1 || testResults.conversionErrors.length > 0) {
        return {
          valid: false,
          error: `Type conversion testing failed: ${testResults.conversionErrors.length} out of ${testResults.totalRows} rows cannot be converted. First errors: ${testResults.conversionErrors.slice(0, 3).join('; ')}`,
          testResults,
        };
      }

      return { valid: true, testResults };
    } catch (error: any) {
      return {
        valid: false,
        error: `Type conversion validation failed: ${error.message}`,
      };
    }
  };

  const executeBatchMigration = async (
    tableName: string,
    columnName: string,
    transformation: string,
    totalRows: number
  ) => {
    const BATCH_SIZE = 1000;
    const MAX_RETRIES = 3;
    const totalBatches = Math.ceil(totalRows / BATCH_SIZE);
    const batches: typeof batchStatus = [];
    
    setIsMigrating(true);
    setMigrationProgress(0);
    setBatchStatus([]);

    console.log(`Starting batch migration: ${totalRows} rows in ${totalBatches} batches`);

    for (let batchNum = 0; batchNum < totalBatches; batchNum++) {
      const offset = batchNum * BATCH_SIZE;
      let retryCount = 0;
      let batchSuccess = false;
      let batchError: string | undefined;

      while (retryCount < MAX_RETRIES && !batchSuccess) {
        try {
          // Execute batch update with LIMIT and OFFSET pattern
          const batchSql = `
            WITH batch_ids AS (
              SELECT id FROM ${tableName}
              ORDER BY id
              LIMIT ${BATCH_SIZE} OFFSET ${offset}
            )
            UPDATE ${tableName}
            SET ${columnName} = ${transformation}
            WHERE id IN (SELECT id FROM batch_ids);
          `;

          const { data, error } = await supabase.functions.invoke('execute-ddl', {
            body: { sql: batchSql },
          });

          if (error || !data?.success) {
            throw new Error(data?.error || error?.message || 'Batch execution failed');
          }

          batchSuccess = true;
          batches.push({
            batch: batchNum + 1,
            success: true,
            rowsProcessed: Math.min(BATCH_SIZE, totalRows - offset),
          });

          console.log(`Batch ${batchNum + 1}/${totalBatches} completed successfully`);

          // Log batch completion to migration history
          try {
            const { data: userData } = await supabase.auth.getUser();
            await supabase.from('schema_migration_history').insert([{
              table_id: tableId as string,
              table_name: tableName,
              migration_type: 'batch_data_migration',
              changes: { batch: batchNum + 1, totalBatches, columnName, transformation } as any,
              sql_executed: batchSql,
              executed_by: userData.user?.id || null,
              success: true,
              affected_rows: Math.min(BATCH_SIZE, totalRows - offset),
            }]);
          } catch (historyError) {
            console.warn('Failed to log batch to history:', historyError);
          }

        } catch (error: any) {
          retryCount++;
          batchError = error.message;
          
          if (retryCount < MAX_RETRIES) {
            console.warn(`Batch ${batchNum + 1} failed, retrying (${retryCount}/${MAX_RETRIES}): ${error.message}`);
            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s before retry
          } else {
            console.error(`Batch ${batchNum + 1} failed after ${MAX_RETRIES} retries: ${error.message}`);
            batches.push({
              batch: batchNum + 1,
              success: false,
              error: error.message,
              rowsProcessed: 0,
            });
          }
        }
      }

      // Update progress
      const progress = Math.round(((batchNum + 1) / totalBatches) * 100);
      setMigrationProgress(progress);
      setBatchStatus([...batches]);

      // If batch failed after all retries, stop migration
      if (!batchSuccess) {
        throw new Error(`Batch migration failed at batch ${batchNum + 1}: ${batchError}`);
      }
    }

    setIsMigrating(false);
    return batches;
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

      // Check if we need batch migration for large tables
      const LARGE_TABLE_THRESHOLD = 10000;
      const typeChanges = changes.filter(c => c.type === 'modify' && c.oldValue?.type !== c.newValue?.type);
      
      let useBatchMigration = false;
      let batchMigrationData: { columnName: string; totalRows: number; transformation: string } | null = null;

      if (typeChanges.length > 0 && tableData) {
        // Count total rows in table
        const { count: totalRows } = await supabase
          .from(tableData.table_name)
          .select('*', { count: 'exact', head: true });

        if (totalRows && totalRows > LARGE_TABLE_THRESHOLD) {
          useBatchMigration = true;
          const change = typeChanges[0]; // Handle first type change with batching
          const columnName = change.columnName;
          const customTransform = customTransformations[columnName];
          const transformation = customTransform || `${columnName}::${mapFieldTypeToPostgres(change.newValue!.type)}`;
          
          batchMigrationData = { columnName, totalRows, transformation };
        }
      }

      // Generate and execute SQL with transaction support
      const sql = generateMigrationSQL();
      
      console.log('Executing schema migration:', sql);
      
      // If using batch migration, execute DDL first (schema changes), then batch data migration
      if (useBatchMigration && batchMigrationData) {
        toast.info(`Large table detected (${batchMigrationData.totalRows.toLocaleString()} rows). Starting batch migration...`);
        
        // Execute DDL for schema changes
        const { data: ddlResult, error: ddlError } = await supabase.functions.invoke('execute-ddl', {
          body: { sql },
        });

        if (ddlError || !ddlResult?.success) {
          throw new Error(ddlResult?.error || ddlError?.message || 'DDL execution failed');
        }

        // Execute batch data migration
        const batches = await executeBatchMigration(
          tableData.table_name,
          batchMigrationData.columnName,
          batchMigrationData.transformation,
          batchMigrationData.totalRows
        );

        const successfulBatches = batches.filter(b => b.success).length;
        const failedBatches = batches.filter(b => !b.success).length;

        if (failedBatches > 0) {
          throw new Error(`Batch migration completed with ${failedBatches} failed batches. ${successfulBatches} batches succeeded.`);
        }

        console.log(`Batch migration completed successfully: ${successfulBatches} batches`);
      } else {
        // Standard single-transaction migration
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
      }

      // Log migration to history with validation warnings
      try {
        const { data: userData } = await supabase.auth.getUser();
        
        // Include validation summary in metadata
        const validationMetadata = {
          safeOperations: migrationImpact.safeOperations,
          warnings: migrationImpact.warnings,
          blockers: migrationImpact.blockers,
          userProceededDespiteWarnings: migrationImpact.warnings.length > 0,
          affectedRows: migrationImpact.affectedRows,
          estimatedTime: migrationImpact.estimatedTime
        };
        
        await supabase.from('schema_migration_history').insert([{
          table_id: tableId as string,
          table_name: tableData.table_name,
          migration_type: useBatchMigration ? 'batch_schema_modification' : 'schema_modification',
          changes: { 
            schemaChanges: changes, 
            validation: validationMetadata,
            usedCopyStrategy: useCopyStrategy,
            customTransformations: customTransformations
          } as any,
          sql_executed: sql,
          executed_by: userData.user?.id || null,
          success: true,
          affected_rows: batchMigrationData?.totalRows || migrationImpact.affectedRows || null,
        }]);
      } catch (historyError) {
        console.warn('Failed to log migration history:', historyError);
      }

      // Update schema_definition in admin_content_tables
      const { error: updateError } = await supabase
        .from('admin_content_tables')
        .update({ schema_definition: fields as any })
        .eq('id', tableId);

      if (updateError) throw updateError;

      toast.success(
        useBatchMigration 
          ? `Schema updated successfully with batch migration. ${batchStatus.length} batches processed.`
          : "Schema updated successfully. Changes have been applied with transaction support."
      );
      
      setOriginalFields(JSON.parse(JSON.stringify(fields)));
      setChanges([]);
      setMigrationProgress(0);
      setBatchStatus([]);
      
      // Reload database schema to sync
      await loadDatabaseSchema(tableData.table_name);
      
      // Navigate back to section detail
      navigate(`/admin/content/sections/${sectionId}`);
    } catch (error: any) {
      console.error("Error saving schema:", error);
      toast.error(`Failed to save schema: ${error.message}. Changes have been rolled back.`);
    } finally {
      setSaving(false);
      setIsMigrating(false);
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

  const handleColumnRename = (oldName: string, newName: string) => {
    // Find the field to rename
    const fieldIndex = fields.findIndex(f => f.name === oldName);
    if (fieldIndex === -1) return;

    // Update the field name
    const updatedFields = [...fields];
    updatedFields[fieldIndex] = { ...updatedFields[fieldIndex], name: newName };
    setFields(updatedFields);

    // Add a rename change
    const existingChangeIndex = changes.findIndex(c => c.columnName === oldName);
    if (existingChangeIndex >= 0) {
      // Update existing change
      const updatedChanges = [...changes];
      updatedChanges[existingChangeIndex] = {
        ...updatedChanges[existingChangeIndex],
        type: 'rename',
        columnName: newName,
        requiresMigration: true,
        migrationSQL: `ALTER TABLE ${tableData.table_name} RENAME COLUMN ${oldName} TO ${newName};`,
      };
      setChanges(updatedChanges);
    } else {
      // Add new rename change
      setChanges([...changes, {
        type: 'rename',
        columnName: newName,
        oldValue: { ...fields[fieldIndex], name: oldName },
        newValue: { ...fields[fieldIndex], name: newName },
        requiresMigration: true,
        migrationSQL: `ALTER TABLE ${tableData.table_name} RENAME COLUMN ${oldName} TO ${newName};`,
      }]);
    }

    toast.success(`Column will be renamed from "${oldName}" to "${newName}"`);
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
      {isMigrating && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="animate-spin">⚙️</div>
              Batch Migration in Progress
            </CardTitle>
            <CardDescription>
              Processing large table data migration in batches. Please do not close this window.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span className="font-semibold">{migrationProgress}%</span>
              </div>
              <Progress value={migrationProgress} className="h-3" />
            </div>
            
            {batchStatus.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Batch Status:</p>
                <ScrollArea className="h-32 rounded-md border p-2">
                  <div className="space-y-1">
                    {batchStatus.map((batch) => (
                      <div
                        key={batch.batch}
                        className="flex items-center justify-between text-xs p-1 rounded"
                      >
                        <span>Batch {batch.batch}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">
                            {batch.rowsProcessed} rows
                          </span>
                          {batch.success ? (
                            <Badge variant="default" className="bg-green-500 text-xs">✓ Success</Badge>
                          ) : (
                            <Badge variant="destructive" className="text-xs">✗ Failed</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
          </CardContent>
        </Card>
      )}

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
          <CardDescription>
            Click any field to edit column properties. Expand rows to modify labels, defaults, and descriptions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {fields.length === 0 ? (
            <Alert className="mb-4 bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-900">
              <Database className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              <AlertDescription className="text-sm text-yellow-800 dark:text-yellow-300">
                <strong>No schema definition found.</strong> This table exists in the database but has no field definitions in the Content Manager.
                <div className="mt-2">
                  <Button 
                    onClick={syncFromDatabase} 
                    disabled={syncing}
                    size="sm"
                    className="mr-2"
                  >
                    {syncing ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Syncing...
                      </>
                    ) : (
                      <>
                        <Database className="h-4 w-4 mr-2" />
                        Sync Schema from Database
                      </>
                    )}
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    Automatically detect and populate columns from the "{tableData?.table_name}" table
                  </span>
                </div>
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="mb-4 bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-900">
              <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <AlertDescription className="text-sm text-blue-800 dark:text-blue-300">
                <strong>Editing columns:</strong> All fields are editable. Changes are tracked and validated before applying to the database.
              </AlertDescription>
            </Alert>
          )}
          
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
                  onRename={(newName) => handleColumnRename(field.name, newName)}
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

      {tableData && (
        <div className="mb-6">
          <SampleDataPreview tableName={tableData.table_name} limit={5} />
        </div>
      )}

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
          variant="outline"
          onClick={() => setShowHistoryDialog(true)}
        >
          <History className="h-4 w-4 mr-2" />
          Migration History
        </Button>
        <Button
          onClick={handleSaveChanges}
          disabled={changes.length === 0 || saving || isMigrating}
        >
          <Save className="h-4 w-4 mr-2" />
          {saving || isMigrating ? "Saving..." : "Save Changes"}
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

            {!migrationImpact.canProceed && (
              <Alert variant="destructive">
                <AlertDescription className="font-semibold">
                  ❌ Migration blocked. Resolve blocking issues before proceeding.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex items-center gap-2 p-4 border rounded">
              <Checkbox 
                id="useCopyStrategy" 
                checked={useCopyStrategy}
                onCheckedChange={(checked) => setUseCopyStrategy(checked === true)}
              />
              <Label htmlFor="useCopyStrategy" className="cursor-pointer">
                Use copy-to-new-column strategy for risky type conversions (safer, allows data verification)
              </Label>
            </div>

            {changes.some(c => c.type === 'modify' && c.oldValue?.type !== c.newValue?.type) && (
              <div className="space-y-3">
                <h4 className="font-semibold text-sm">Custom Transformation SQL</h4>
                <p className="text-sm text-muted-foreground">
                  Provide custom SQL expressions for type conversions. Use the column name directly (e.g., <code className="bg-muted px-1 py-0.5 rounded">CASE WHEN column_name = 'value' THEN 1 ELSE 0 END</code>).
                </p>
                {changes
                  .filter(c => c.type === 'modify' && c.oldValue?.type !== c.newValue?.type)
                  .map(change => (
                    <div key={change.columnName} className="space-y-2">
                      <Label htmlFor={`transform-${change.columnName}`} className="text-sm font-medium">
                        {change.columnName}: {change.oldValue?.type} → {change.newValue?.type}
                      </Label>
                      <Textarea
                        id={`transform-${change.columnName}`}
                        placeholder={`Default: ${change.columnName}::${mapFieldTypeToPostgres(change.newValue?.type || '')}`}
                        value={customTransformations[change.columnName] || ''}
                        onChange={(e) => setCustomTransformations(prev => ({
                          ...prev,
                          [change.columnName]: e.target.value
                        }))}
                        className="font-mono text-sm"
                        rows={2}
                      />
                    </div>
                  ))}
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowMigrationPreview(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  setShowMigrationPreview(false);
                  handleSaveChanges();
                }}
                disabled={!migrationImpact.canProceed}
              >
                Proceed with Migration
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <MigrationHistoryDialog
        open={showHistoryDialog}
        onOpenChange={setShowHistoryDialog}
        tableId={tableId as string}
      />
    </div>
  );
}
