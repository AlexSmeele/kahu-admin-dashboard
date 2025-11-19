import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Save, Plus, Code } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SchemaFieldEditor, SchemaField } from "./SchemaFieldEditor";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ManualSchemaBuilderProps {
  sectionId: string;
}

interface TableForm {
  name: string;
  display_name: string;
  description: string;
  table_name: string;
  schema_definition: SchemaField[];
  order_index: number;
  is_active: boolean;
}

export function ManualSchemaBuilder({ sectionId }: ManualSchemaBuilderProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  
  const [formData, setFormData] = useState<TableForm>({
    name: "",
    display_name: "",
    description: "",
    table_name: "",
    schema_definition: [],
    order_index: 0,
    is_active: true,
  });

  const generateTableName = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]/g, '_');
  };

  const addField = () => {
    const newField: SchemaField = {
      id: `field_${Date.now()}`,
      name: "",
      label: "",
      type: "text",
      nullable: true,
      unique: false,
    };
    setFormData({
      ...formData,
      schema_definition: [...formData.schema_definition, newField],
    });
  };

  const updateField = (index: number, updatedField: SchemaField) => {
    const newFields = [...formData.schema_definition];
    newFields[index] = updatedField;
    setFormData({ ...formData, schema_definition: newFields });
  };

  const deleteField = (index: number) => {
    setFormData({
      ...formData,
      schema_definition: formData.schema_definition.filter((_, i) => i !== index),
    });
  };

  const moveField = (index: number, direction: 'up' | 'down') => {
    const newFields = [...formData.schema_definition];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newFields[index], newFields[targetIndex]] = [newFields[targetIndex], newFields[index]];
    setFormData({ ...formData, schema_definition: newFields });
  };

  const generateMigrationSQL = () => {
    const { table_name, schema_definition } = formData;

    let sql = `-- Create table for ${formData.display_name}\n`;
    sql += `CREATE TABLE IF NOT EXISTS public.${table_name} (\n`;
    sql += `  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n`;
    
    schema_definition.forEach((field, index) => {
      let fieldDef = `  ${field.name} `;
      
      switch (field.type) {
        case 'text':
          fieldDef += 'TEXT';
          break;
        case 'number':
          fieldDef += 'INTEGER';
          break;
        case 'boolean':
          fieldDef += 'BOOLEAN';
          break;
        case 'date':
          fieldDef += 'DATE';
          break;
        case 'datetime':
          fieldDef += 'TIMESTAMP WITH TIME ZONE';
          break;
        case 'json':
        case 'array':
          fieldDef += 'JSONB';
          break;
        case 'uuid':
          fieldDef += 'UUID';
          break;
        case 'file_url':
          fieldDef += 'TEXT';
          break;
        default:
          fieldDef += 'TEXT';
      }
      
      if (!field.nullable) {
        fieldDef += ' NOT NULL';
      }
      
      if (field.unique) {
        fieldDef += ' UNIQUE';
      }
      
      if (field.default_value !== undefined && field.default_value !== '') {
        if (field.type === 'text' || field.type === 'json') {
          fieldDef += ` DEFAULT '${field.default_value}'`;
        } else if (field.type === 'boolean') {
          fieldDef += ` DEFAULT ${field.default_value}`;
        } else if (field.type === 'datetime') {
          fieldDef += ` DEFAULT ${field.default_value}`;
        } else {
          fieldDef += ` DEFAULT ${field.default_value}`;
        }
      }
      
      sql += fieldDef + ',\n';
    });
    
    sql += `  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),\n`;
    sql += `  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()\n`;
    sql += `);\n\n`;

    // Add RLS policies
    sql += `-- Enable Row Level Security\n`;
    sql += `ALTER TABLE public.${table_name} ENABLE ROW LEVEL SECURITY;\n\n`;
    
    sql += `-- Create policy for admins to manage all records\n`;
    sql += `CREATE POLICY "Admins can manage all records"\n`;
    sql += `  ON public.${table_name}\n`;
    sql += `  FOR ALL\n`;
    sql += `  TO authenticated\n`;
    sql += `  USING (public.has_role(auth.uid(), 'admin'));\n\n`;

    // Add updated_at trigger
    sql += `-- Create trigger for updated_at\n`;
    sql += `CREATE TRIGGER update_${table_name}_updated_at\n`;
    sql += `  BEFORE UPDATE ON public.${table_name}\n`;
    sql += `  FOR EACH ROW\n`;
    sql += `  EXECUTE FUNCTION public.update_updated_at_column();\n`;

    return sql;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.schema_definition.length === 0) {
      toast({
        title: "No fields defined",
        description: "Please add at least one field to the table schema",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    try {
      const sql = generateMigrationSQL();
      
      // Call edge function to execute DDL and register table
      const { data, error } = await supabase.functions.invoke('execute-ddl', {
        body: {
          sql,
          tableMetadata: {
            section_id: sectionId,
            name: formData.name,
            display_name: formData.display_name,
            description: formData.description,
            table_name: formData.table_name,
            schema_definition: formData.schema_definition,
            order_index: formData.order_index,
            is_active: formData.is_active,
            creation_method: 'manual',
          },
        },
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || 'Failed to create table');
      }

      toast({
        title: "Table created successfully",
        description: `Table "${formData.display_name}" has been created and is ready to use`,
      });

      navigate(`/admin/content/sections/${sectionId}/tables/${data.table.id}`);
    } catch (error: any) {
      toast({
        title: "Error creating table",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Table Information</CardTitle>
          <CardDescription>Basic information about your table</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Internal Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setFormData({
                    ...formData,
                    name,
                    table_name: generateTableName(name),
                  });
                }}
                placeholder="e.g., training_skills"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="table_name">Database Table Name *</Label>
              <Input
                id="table_name"
                value={formData.table_name}
                onChange={(e) => setFormData({ ...formData, table_name: e.target.value })}
                placeholder="e.g., training_skills"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="display_name">Display Name *</Label>
            <Input
              id="display_name"
              value={formData.display_name}
              onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
              placeholder="e.g., Training Skills"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe what this table is used for..."
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
            <Label htmlFor="is_active">Active</Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Schema Definition</CardTitle>
              <CardDescription>Define the fields for your table</CardDescription>
            </div>
            <Button type="button" onClick={addField} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Field
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {formData.schema_definition.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No fields defined yet. Click "Add Field" to get started.
            </div>
          ) : (
            formData.schema_definition.map((field, index) => (
              <SchemaFieldEditor
                key={field.id}
                field={field}
                onUpdate={(updatedField) => updateField(index, updatedField)}
                onDelete={() => deleteField(index)}
                onMoveUp={index > 0 ? () => moveField(index, 'up') : undefined}
                onMoveDown={index < formData.schema_definition.length - 1 ? () => moveField(index, 'down') : undefined}
                canMoveUp={index > 0}
                canMoveDown={index < formData.schema_definition.length - 1}
              />
            ))
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between gap-4">
        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogTrigger asChild>
            <Button type="button" variant="outline">
              <Code className="h-4 w-4 mr-2" />
              Preview SQL
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>Generated SQL Migration</DialogTitle>
              <DialogDescription>
                This SQL will be automatically executed when you create the table
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="h-[500px] w-full rounded-md border p-4">
              <pre className="text-sm">{generateMigrationSQL()}</pre>
            </ScrollArea>
          </DialogContent>
        </Dialog>

        <Button type="submit" disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Creating..." : "Create Table"}
        </Button>
      </div>
    </form>
  );
}
