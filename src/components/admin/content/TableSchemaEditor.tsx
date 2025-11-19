import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, Plus, Trash2, ChevronUp, ChevronDown, Code, AlertTriangle, Info } from "lucide-react";
import { toast } from "sonner";
import { SchemaField } from "./SchemaFieldEditor";

interface TableSchemaEditorProps {
  sectionId: string;
  tableId: string;
}

interface SchemaChange {
  type: 'add' | 'modify' | 'delete' | 'rename';
  columnName: string;
  oldValue?: SchemaField;
  newValue?: SchemaField;
  requiresMigration: boolean;
  sql: string;
}

const fieldTypes = [
  { value: 'text', label: 'Text', sqlType: 'TEXT' },
  { value: 'number', label: 'Number', sqlType: 'NUMERIC' },
  { value: 'boolean', label: 'Boolean', sqlType: 'BOOLEAN' },
  { value: 'date', label: 'Date', sqlType: 'DATE' },
  { value: 'datetime', label: 'Date & Time', sqlType: 'TIMESTAMP WITH TIME ZONE' },
  { value: 'json', label: 'JSON', sqlType: 'JSONB' },
  { value: 'array', label: 'Array', sqlType: 'TEXT[]' },
  { value: 'uuid', label: 'UUID', sqlType: 'UUID' },
  { value: 'file_url', label: 'File URL', sqlType: 'TEXT' },
  { value: 'select', label: 'Select', sqlType: 'TEXT' },
  { value: 'multiselect', label: 'Multi-select', sqlType: 'TEXT[]' },
];

export function TableSchemaEditor({ sectionId, tableId }: TableSchemaEditorProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tableName, setTableName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [description, setDescription] = useState("");
  const [originalFields, setOriginalFields] = useState<SchemaField[]>([]);
  const [currentFields, setCurrentFields] = useState<SchemaField[]>([]);
  const [showSqlPreview, setShowSqlPreview] = useState(false);
  const [showMigrationWarning, setShowMigrationWarning] = useState(false);
  const [changes, setChanges] = useState<SchemaChange[]>([]);
  const [editingField, setEditingField] = useState<string | null>(null);

  useEffect(() => {
    fetchTableSchema();
  }, [tableId]);

  const fetchTableSchema = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("admin_content_tables")
        .select("*")
        .eq("id", tableId)
        .single();

      if (error) throw error;

      setTableName(data.table_name);
      setDisplayName(data.display_name);
      setDescription(data.description || "");
      
      const schema = data.schema_definition as SchemaField[];
      setOriginalFields(schema);
      setCurrentFields(JSON.parse(JSON.stringify(schema))); // Deep copy
    } catch (error) {
      console.error("Error fetching table schema:", error);
      toast.error("Failed to load table schema");
    } finally {
      setLoading(false);
    }
  };

  const calculateChanges = (): SchemaChange[] => {
    const changes: SchemaChange[] = [];
    
    // Find added fields
    currentFields.forEach(field => {
      const existsInOriginal = originalFields.find(f => f.id === field.id);
      if (!existsInOriginal) {
        const fieldType = fieldTypes.find(t => t.value === field.type);
        const sqlType = fieldType?.sqlType || 'TEXT';
        const nullable = field.nullable ? '' : ' NOT NULL';
        const unique = field.unique ? ' UNIQUE' : '';
        const defaultVal = field.default_value ? ` DEFAULT '${field.default_value}'` : '';
        
        changes.push({
          type: 'add',
          columnName: field.name,
          newValue: field,
          requiresMigration: false,
          sql: `ALTER TABLE ${tableName} ADD COLUMN ${field.name} ${sqlType}${nullable}${unique}${defaultVal};`
        });
      }
    });

    // Find modified fields
    currentFields.forEach(field => {
      const original = originalFields.find(f => f.id === field.id);
      if (original) {
        const hasChanges = 
          original.name !== field.name ||
          original.type !== field.type ||
          original.nullable !== field.nullable ||
          original.unique !== field.unique ||
          original.default_value !== field.default_value;

        if (hasChanges) {
          const requiresMigration = original.type !== field.type;
          const fieldType = fieldTypes.find(t => t.value === field.type);
          const sqlType = fieldType?.sqlType || 'TEXT';
          
          let sql = '';
          if (original.name !== field.name) {
            sql += `ALTER TABLE ${tableName} RENAME COLUMN ${original.name} TO ${field.name};\n`;
          }
          if (original.type !== field.type) {
            sql += `ALTER TABLE ${tableName} ALTER COLUMN ${field.name} TYPE ${sqlType} USING ${field.name}::${sqlType};\n`;
          }
          if (original.nullable !== field.nullable) {
            sql += `ALTER TABLE ${tableName} ALTER COLUMN ${field.name} ${field.nullable ? 'DROP' : 'SET'} NOT NULL;\n`;
          }

          changes.push({
            type: 'modify',
            columnName: field.name,
            oldValue: original,
            newValue: field,
            requiresMigration,
            sql
          });
        }
      }
    });

    // Find deleted fields
    originalFields.forEach(field => {
      const stillExists = currentFields.find(f => f.id === field.id);
      if (!stillExists) {
        changes.push({
          type: 'delete',
          columnName: field.name,
          oldValue: field,
          requiresMigration: true,
          sql: `ALTER TABLE ${tableName} DROP COLUMN ${field.name};`
        });
      }
    });

    return changes;
  };

  const addField = () => {
    const newField: SchemaField = {
      id: `new_${Date.now()}`,
      name: `field_${currentFields.length + 1}`,
      label: `Field ${currentFields.length + 1}`,
      type: 'text',
      nullable: true,
      unique: false,
    };
    setCurrentFields([...currentFields, newField]);
    setEditingField(newField.id);
  };

  const updateField = (id: string, updates: Partial<SchemaField>) => {
    setCurrentFields(fields =>
      fields.map(f => (f.id === id ? { ...f, ...updates } : f))
    );
  };

  const deleteField = (id: string) => {
    setCurrentFields(fields => fields.filter(f => f.id !== id));
  };

  const moveField = (index: number, direction: 'up' | 'down') => {
    const newFields = [...currentFields];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    [newFields[index], newFields[newIndex]] = [newFields[newIndex], newFields[index]];
    setCurrentFields(newFields);
  };

  const handlePreviewChanges = () => {
    const calculatedChanges = calculateChanges();
    setChanges(calculatedChanges);
    setShowSqlPreview(true);
  };

  const handleApplyChanges = async () => {
    const calculatedChanges = calculateChanges();
    const requiresMigration = calculatedChanges.some(c => c.requiresMigration);

    if (requiresMigration) {
      setChanges(calculatedChanges);
      setShowMigrationWarning(true);
      return;
    }

    await applyChanges(calculatedChanges);
  };

  const applyChanges = async (changesToApply: SchemaChange[]) => {
    try {
      setSaving(true);

      // Generate full SQL
      const sql = changesToApply.map(c => c.sql).join('\n');

      // Execute SQL via edge function
      if (sql.trim()) {
        const { data: { session } } = await supabase.auth.getSession();
        const response = await fetch(
          `${supabase.supabaseUrl}/functions/v1/execute-ddl`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session?.access_token}`,
            },
            body: JSON.stringify({ sql }),
          }
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to execute schema changes');
        }
      }

      // Update schema_definition in admin_content_tables
      const { error: updateError } = await supabase
        .from("admin_content_tables")
        .update({
          display_name: displayName,
          description: description,
          schema_definition: currentFields,
        })
        .eq("id", tableId);

      if (updateError) throw updateError;

      toast.success("Schema updated successfully!");
      navigate(`/admin/content/sections/${sectionId}`);
    } catch (error) {
      console.error("Error applying schema changes:", error);
      toast.error(error instanceof Error ? error.message : "Failed to apply schema changes");
    } finally {
      setSaving(false);
      setShowMigrationWarning(false);
      setShowSqlPreview(false);
    }
  };

  const getFieldStatus = (field: SchemaField): 'new' | 'modified' | 'deleted' | 'existing' => {
    const original = originalFields.find(f => f.id === field.id);
    if (!original) return 'new';
    
    const hasChanges = 
      original.name !== field.name ||
      original.type !== field.type ||
      original.nullable !== field.nullable ||
      original.unique !== field.unique ||
      original.default_value !== field.default_value;
    
    return hasChanges ? 'modified' : 'existing';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading schema...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Edit Table Schema</h2>
          <p className="text-muted-foreground">Modify the structure of {displayName}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(`/admin/content/sections/${sectionId}`)}>
            Cancel
          </Button>
          <Button variant="outline" onClick={handlePreviewChanges}>
            <Code className="w-4 h-4 mr-2" />
            Preview Changes
          </Button>
          <Button onClick={handleApplyChanges} disabled={saving}>
            {saving ? "Applying..." : "Apply Changes"}
          </Button>
        </div>
      </div>

      {/* Table Metadata */}
      <Card>
        <CardHeader>
          <CardTitle>Table Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Table Name (Database)</Label>
            <Input value={tableName} disabled className="bg-muted" />
            <p className="text-sm text-muted-foreground mt-1">Database table name cannot be changed</p>
          </div>
          <div>
            <Label>Display Name</Label>
            <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </div>
        </CardContent>
      </Card>

      {/* Schema Editor */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Schema Definition</CardTitle>
            <Button onClick={addField} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Column
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="w-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Order</TableHead>
                  <TableHead className="w-48">Column Name</TableHead>
                  <TableHead className="w-48">Label</TableHead>
                  <TableHead className="w-32">Type</TableHead>
                  <TableHead className="w-24">Nullable</TableHead>
                  <TableHead className="w-24">Unique</TableHead>
                  <TableHead className="w-32">Default</TableHead>
                  <TableHead className="w-20">Status</TableHead>
                  <TableHead className="w-32">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentFields.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                      No columns defined. Click "Add Column" to create one.
                    </TableCell>
                  </TableRow>
                ) : (
                  currentFields.map((field, index) => {
                    const status = getFieldStatus(field);
                    const isEditing = editingField === field.id;

                    return (
                      <TableRow key={field.id} className={status === 'deleted' ? 'opacity-50 line-through' : ''}>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => moveField(index, 'up')}
                              disabled={index === 0}
                            >
                              <ChevronUp className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => moveField(index, 'down')}
                              disabled={index === currentFields.length - 1}
                            >
                              <ChevronDown className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          {isEditing ? (
                            <Input
                              value={field.name}
                              onChange={(e) => updateField(field.id, { name: e.target.value })}
                              className="h-8"
                            />
                          ) : (
                            <code className="text-sm">{field.name}</code>
                          )}
                        </TableCell>
                        <TableCell>
                          {isEditing ? (
                            <Input
                              value={field.label}
                              onChange={(e) => updateField(field.id, { label: e.target.value })}
                              className="h-8"
                            />
                          ) : (
                            field.label
                          )}
                        </TableCell>
                        <TableCell>
                          {isEditing ? (
                            <Select
                              value={field.type}
                              onValueChange={(value: any) => updateField(field.id, { type: value })}
                            >
                              <SelectTrigger className="h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {fieldTypes.map(type => (
                                  <SelectItem key={type.value} value={type.value}>
                                    {type.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <Badge variant="outline">
                              {fieldTypes.find(t => t.value === field.type)?.label || field.type}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={field.nullable}
                            onCheckedChange={(checked) => updateField(field.id, { nullable: checked })}
                            disabled={!isEditing}
                          />
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={field.unique}
                            onCheckedChange={(checked) => updateField(field.id, { unique: checked })}
                            disabled={!isEditing}
                          />
                        </TableCell>
                        <TableCell>
                          {isEditing ? (
                            <Input
                              value={field.default_value || ''}
                              onChange={(e) => updateField(field.id, { default_value: e.target.value })}
                              placeholder="None"
                              className="h-8"
                            />
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              {field.default_value || '-'}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {status === 'new' && <Badge variant="default">New</Badge>}
                          {status === 'modified' && <Badge variant="secondary">Modified</Badge>}
                          {status === 'existing' && <Badge variant="outline">Existing</Badge>}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {isEditing ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditingField(null)}
                              >
                                Done
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditingField(field.id)}
                              >
                                Edit
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              onClick={() => deleteField(field.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* SQL Preview Dialog */}
      <Dialog open={showSqlPreview} onOpenChange={setShowSqlPreview}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Schema Changes Preview</DialogTitle>
            <DialogDescription>
              Review the SQL statements that will be executed
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {changes.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No changes detected
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  {changes.map((change, index) => (
                    <div key={index} className="border rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={
                          change.type === 'add' ? 'default' :
                          change.type === 'modify' ? 'secondary' :
                          'destructive'
                        }>
                          {change.type.toUpperCase()}
                        </Badge>
                        <code className="text-sm">{change.columnName}</code>
                        {change.requiresMigration && (
                          <Badge variant="outline" className="gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            Requires Migration
                          </Badge>
                        )}
                      </div>
                      <pre className="bg-muted p-2 rounded text-xs overflow-x-auto">
                        {change.sql}
                      </pre>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSqlPreview(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Migration Warning Dialog */}
      <Dialog open={showMigrationWarning} onOpenChange={setShowMigrationWarning}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Data Migration Required
            </DialogTitle>
            <DialogDescription>
              Some of your changes require data migration and may result in data loss.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="border rounded-lg p-4 space-y-2">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-destructive mt-0.5" />
                <div className="space-y-1 flex-1">
                  <p className="font-medium">Destructive Changes Detected:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    {changes.filter(c => c.requiresMigration).map((change, index) => (
                      <li key={index}>
                        {change.type === 'delete' && `Deleting column "${change.columnName}"`}
                        {change.type === 'modify' && `Changing type of "${change.columnName}"`}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm">
                <Info className="w-4 h-4 inline mr-2" />
                It's recommended to backup your data before proceeding with these changes.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMigrationWarning(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => applyChanges(changes)}>
              I Understand, Proceed
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
