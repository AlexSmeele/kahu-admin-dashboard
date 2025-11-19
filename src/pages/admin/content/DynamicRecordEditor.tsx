import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DynamicForm } from "@/components/admin/content/DynamicForm";
import { SchemaField } from "@/components/admin/content/SchemaFieldEditor";

interface ContentTable {
  id: string;
  display_name: string;
  table_name: string;
  schema_definition: SchemaField[];
}

export default function DynamicRecordEditor() {
  const { sectionId, tableId, recordId } = useParams();
  const isNew = recordId === "new";
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [contentTable, setContentTable] = useState<ContentTable | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchContentTable();
  }, [tableId]);

  useEffect(() => {
    if (contentTable && !isNew) {
      fetchRecord();
    } else if (contentTable) {
      // Initialize form with default values
      const defaults: Record<string, any> = {};
      contentTable.schema_definition.forEach(field => {
        if (field.default_value) {
          defaults[field.name] = field.default_value;
        } else if (field.type === 'boolean') {
          defaults[field.name] = false;
        } else if (field.type.includes('_array')) {
          defaults[field.name] = [];
        }
      });
      setFormData(defaults);
      setLoading(false);
    }
  }, [contentTable, recordId, isNew]);

  const fetchContentTable = async () => {
    try {
      const { data, error } = await supabase
        .from("admin_content_tables")
        .select("*")
        .eq("id", tableId)
        .single();

      if (error) throw error;
      setContentTable(data as any);
    } catch (error: any) {
      toast({
        title: "Error loading content table",
        description: error.message,
        variant: "destructive",
      });
      navigate(`/admin/content/sections/${sectionId}/tables`);
    }
  };

  const fetchRecord = async () => {
    if (!contentTable) return;

    try {
      const { data, error } = await supabase
        .from(contentTable.table_name as any)
        .select('*')
        .eq('id', recordId)
        .single();

      if (error) throw error;
      setFormData(data);
    } catch (error: any) {
      toast({
        title: "Error loading record",
        description: error.message,
        variant: "destructive",
      });
      navigate(`/admin/content/sections/${sectionId}/tables/${tableId}/manage`);
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    if (!contentTable) return false;

    const newErrors: Record<string, string> = {};

    contentTable.schema_definition.forEach(field => {
      const value = formData[field.name];

      // Check required fields
      if (!field.nullable && (value === null || value === undefined || value === '')) {
        newErrors[field.name] = `${field.label} is required`;
      }

      // Validate numbers
      if (field.type === 'number' && value !== null && value !== undefined) {
        if (field.validation?.min !== undefined && value < field.validation.min) {
          newErrors[field.name] = `Must be at least ${field.validation.min}`;
        }
        if (field.validation?.max !== undefined && value > field.validation.max) {
          newErrors[field.name] = `Must be at most ${field.validation.max}`;
        }
      }

      // Validate patterns
      if (field.type === 'text' && field.validation?.pattern && value) {
        const regex = new RegExp(field.validation.pattern);
        if (!regex.test(value)) {
          newErrors[field.name] = `Invalid format`;
        }
      }

      // Validate JSON
      if (field.type === 'json' && value && typeof value === 'string') {
        try {
          JSON.parse(value);
        } catch {
          newErrors[field.name] = 'Invalid JSON format';
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!contentTable || !validateForm()) {
      return;
    }

    setSaving(true);

    try {
      // Prepare data - only include schema fields
      const recordData: Record<string, any> = {};
      contentTable.schema_definition.forEach(field => {
        recordData[field.name] = formData[field.name] ?? null;
      });

      if (isNew) {
        const { error } = await supabase
          .from(contentTable.table_name as any)
          .insert(recordData);

        if (error) throw error;

        toast({
          title: "Record created",
          description: "The record has been created successfully.",
        });
      } else {
        const { error } = await supabase
          .from(contentTable.table_name as any)
          .update(recordData)
          .eq('id', recordId);

        if (error) throw error;

        toast({
          title: "Record updated",
          description: "The record has been updated successfully.",
        });
      }

      navigate(`/admin/content/sections/${sectionId}/tables/${tableId}/manage`);
    } catch (error: any) {
      toast({
        title: isNew ? "Error creating record" : "Error updating record",
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

  if (!contentTable) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/admin/content/sections/${sectionId}/tables/${tableId}/manage`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl md:text-3xl font-bold">
            {isNew ? `New ${contentTable.display_name}` : `Edit ${contentTable.display_name}`}
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">
            {isNew ? 'Create a new record' : 'Update record details'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Record Details</CardTitle>
            <CardDescription>
              Fill in the fields below to {isNew ? 'create' : 'update'} the record
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DynamicForm
              fields={contentTable.schema_definition}
              data={formData}
              onChange={handleFieldChange}
              errors={errors}
            />

            <div className="flex justify-end gap-2 mt-6 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(`/admin/content/sections/${sectionId}/tables/${tableId}/manage`)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                <Save className="mr-2 h-4 w-4" />
                {saving ? "Saving..." : "Save Record"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
