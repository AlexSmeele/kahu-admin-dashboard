import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, Plus, Eye, Save, AlertCircle } from "lucide-react";
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

export function TableSchemaEditor() {
  const { sectionId, tableId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [tableData, setTableData] = useState<any>(null);
  const [fields, setFields] = useState<SchemaField[]>([]);
  const [originalFields, setOriginalFields] = useState<SchemaField[]>([]);
  const [changes, setChanges] = useState<SchemaChange[]>([]);
  const [showSqlPreview, setShowSqlPreview] = useState(false);
  const [generatedSql, setGeneratedSql] = useState("");
  const [saving, setSaving] = useState(false);

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
    } catch (error: any) {
      console.error("Error loading schema:", error);
      toast.error(`Failed to load schema: ${error.message}`);
    } finally {
      setLoading(false);
    }
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

  const handlePreviewSQL = () => {
    const sql = generateMigrationSQL();
    setGeneratedSql(sql);
    setShowSqlPreview(true);
  };

  const handleSaveChanges = async () => {
    if (changes.length === 0) {
      toast.info("No changes to save");
      return;
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

      // Generate and execute SQL
      const sql = generateMigrationSQL();
      
      const { data: ddlResult, error: ddlError } = await supabase.functions.invoke('execute-ddl', {
        body: { sql },
      });

      if (ddlError) throw ddlError;

      // Update schema_definition in admin_content_tables
      const { error: updateError } = await supabase
        .from('admin_content_tables')
        .update({ schema_definition: fields as any })
        .eq('id', tableId);

      if (updateError) throw updateError;

      toast.success("Schema updated successfully");
      setOriginalFields(JSON.parse(JSON.stringify(fields)));
      setChanges([]);
      
      // Navigate back to section detail
      navigate(`/admin/content/sections/${sectionId}`);
    } catch (error: any) {
      console.error("Error saving schema:", error);
      toast.error(`Failed to save schema: ${error.message}`);
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

      <div className="flex gap-3">
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
    </div>
  );
}
