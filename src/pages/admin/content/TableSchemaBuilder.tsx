import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Save, Plus, Code } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SchemaFieldEditor, SchemaField } from "@/components/admin/content/SchemaFieldEditor";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TableForm {
  name: string;
  display_name: string;
  description: string;
  table_name: string;
  schema_definition: SchemaField[];
  order_index: number;
  is_active: boolean;
}

export default function TableSchemaBuilder() {
  const { sectionId, tableId } = useParams();
  const isNew = tableId === "new";
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(!isNew);
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

  useEffect(() => {
    if (!isNew && tableId) {
      fetchTable();
    }
  }, [tableId, isNew]);

  const fetchTable = async () => {
    try {
      const { data, error } = await supabase
        .from("admin_content_tables")
        .select("*")
        .eq("id", tableId)
        .single();

      if (error) throw error;
      
      setFormData({
        name: data.name,
        display_name: data.display_name,
        description: data.description || "",
        table_name: data.table_name,
        schema_definition: (data.schema_definition as any) || [],
        order_index: data.order_index,
        is_active: data.is_active,
      });
    } catch (error: any) {
      toast({
        title: "Error loading table",
        description: error.message,
        variant: "destructive",
      });
      navigate(`/admin/content/sections/${sectionId}/tables`);
    } finally {
      setLoading(false);
    }
  };

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
    const fields = formData.schema_definition.map(field => {
      let sqlType = 'TEXT';
      switch (field.type) {
        case 'integer': sqlType = 'INTEGER'; break;
        case 'number': sqlType = 'NUMERIC'; break;
        case 'bigint': sqlType = 'BIGINT'; break;
        case 'boolean': sqlType = 'BOOLEAN'; break;
        case 'date': sqlType = 'DATE'; break;
        case 'datetime': sqlType = 'TIMESTAMP WITH TIME ZONE'; break;
        case 'json': sqlType = 'JSONB'; break;
        case 'text_array': sqlType = 'TEXT[]'; break;
        case 'integer_array': sqlType = 'INTEGER[]'; break;
        case 'uuid_array': sqlType = 'UUID[]'; break;
        case 'jsonb_array': sqlType = 'JSONB[]'; break;
        case 'uuid': sqlType = 'UUID'; break;
      }
      
      let constraints = '';
      if (!field.nullable) constraints += ' NOT NULL';
      if (field.unique) constraints += ' UNIQUE';
      if (field.default_value) {
        const defaultVal = field.type === 'text' ? `'${field.default_value}'` : field.default_value;
        constraints += ` DEFAULT ${defaultVal}`;
      }
      
      return `  ${field.name} ${sqlType}${constraints}`;
    }).join(',\n');

    return `-- Create table: ${formData.table_name}
CREATE TABLE IF NOT EXISTS public.${formData.table_name} (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
${fields},
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.${formData.table_name} ENABLE ROW LEVEL SECURITY;

-- RLS Policies (customize as needed)
CREATE POLICY "Admins can view ${formData.table_name}"
  ON public.${formData.table_name}
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert ${formData.table_name}"
  ON public.${formData.table_name}
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update ${formData.table_name}"
  ON public.${formData.table_name}
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete ${formData.table_name}"
  ON public.${formData.table_name}
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

-- Create updated_at trigger
CREATE TRIGGER update_${formData.table_name}_updated_at
  BEFORE UPDATE ON public.${formData.table_name}
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.schema_definition.length === 0) {
      toast({
        title: "No fields defined",
        description: "Please add at least one field to the schema.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    try {
      const tableData = {
        section_id: sectionId,
        name: formData.name,
        display_name: formData.display_name,
        description: formData.description || null,
        table_name: formData.table_name || generateTableName(formData.name),
        schema_definition: formData.schema_definition as any,
        order_index: formData.order_index,
        is_active: formData.is_active,
      };

      if (isNew) {
        const { error } = await supabase
          .from("admin_content_tables")
          .insert(tableData);

        if (error) throw error;

        toast({
          title: "Content table created",
          description: `${formData.display_name} has been created. Remember to run the migration to create the actual database table.`,
        });
      } else {
        const { error } = await supabase
          .from("admin_content_tables")
          .update(tableData)
          .eq("id", tableId);

        if (error) throw error;

        toast({
          title: "Content table updated",
          description: `${formData.display_name} has been updated.`,
        });
      }

      navigate(`/admin/content/sections/${sectionId}/tables`);
    } catch (error: any) {
      toast({
        title: isNew ? "Error creating table" : "Error updating table",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/admin/content/sections/${sectionId}/tables`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl md:text-3xl font-bold">
            {isNew ? "New Content Table" : "Edit Content Table"}
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">
            {isNew ? "Define a new content table schema" : "Update table schema and configuration"}
          </p>
        </div>
        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Code className="mr-2 h-4 w-4" />
              Preview SQL
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>Migration SQL Preview</DialogTitle>
              <DialogDescription>
                Copy this SQL to create the database table
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="h-[500px]">
              <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">
                <code>{generateMigrationSQL()}</code>
              </pre>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Table Information</CardTitle>
            <CardDescription>
              Basic information about the content table
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">System Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setFormData({
                      ...formData,
                      name,
                      table_name: generateTableName(name)
                    });
                  }}
                  placeholder="user-profiles"
                  required
                  pattern="[a-z0-9-]+"
                  title="Use lowercase letters, numbers, and hyphens only"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="display_name">Display Name *</Label>
                <Input
                  id="display_name"
                  value={formData.display_name}
                  onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                  placeholder="User Profiles"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="table_name">Database Table Name *</Label>
              <Input
                id="table_name"
                value={formData.table_name}
                onChange={(e) => setFormData({ ...formData, table_name: e.target.value })}
                placeholder="user_profiles"
                required
                pattern="[a-z_]+"
                title="Use lowercase letters and underscores only"
              />
              <p className="text-xs text-muted-foreground">
                Auto-generated from system name. Must match actual database table name.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of this content table..."
                rows={2}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="order_index">Order Index</Label>
                <Input
                  id="order_index"
                  type="number"
                  value={formData.order_index}
                  onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) || 0 })}
                  min={0}
                />
              </div>

              <div className="flex items-center space-x-2 pt-8">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active" className="cursor-pointer">
                  Active
                </Label>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Schema Definition</CardTitle>
                <CardDescription>
                  Define the fields for this content table
                </CardDescription>
              </div>
              <Button type="button" onClick={addField} variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Add Field
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {formData.schema_definition.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No fields defined yet. Click "Add Field" to start building your schema.
              </div>
            ) : (
              formData.schema_definition.map((field, index) => (
                <SchemaFieldEditor
                  key={field.id}
                  field={field}
                  onUpdate={(updatedField) => updateField(index, updatedField)}
                  onDelete={() => deleteField(index)}
                  onMoveUp={() => moveField(index, 'up')}
                  onMoveDown={() => moveField(index, 'down')}
                  canMoveUp={index > 0}
                  canMoveDown={index < formData.schema_definition.length - 1}
                />
              ))
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(`/admin/content/sections/${sectionId}/tables`)}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Saving..." : "Save Table Schema"}
          </Button>
        </div>
      </form>
    </div>
  );
}
