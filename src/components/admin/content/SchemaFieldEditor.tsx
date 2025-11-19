import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, GripVertical, ChevronDown, ChevronUp } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

export interface SchemaField {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'number' | 'boolean' | 'date' | 'datetime' | 'json' | 'array' | 'uuid' | 'file_url' | 'select' | 'multiselect';
  nullable: boolean;
  unique: boolean;
  default_value?: string;
  foreign_key?: {
    table: string;
    column: string;
  };
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    options?: string[];
  };
  description?: string;
}

interface SchemaFieldEditorProps {
  field: SchemaField;
  onUpdate: (field: SchemaField) => void;
  onDelete: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}

const fieldTypes = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'boolean', label: 'Boolean' },
  { value: 'date', label: 'Date' },
  { value: 'datetime', label: 'Date & Time' },
  { value: 'json', label: 'JSON' },
  { value: 'array', label: 'Array' },
  { value: 'uuid', label: 'UUID' },
  { value: 'file_url', label: 'File URL' },
  { value: 'select', label: 'Select (dropdown)' },
  { value: 'multiselect', label: 'Multi-select' },
];

export function SchemaFieldEditor({
  field,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
}: SchemaFieldEditorProps) {
  const [expanded, setExpanded] = useState(false);

  const updateField = (updates: Partial<SchemaField>) => {
    onUpdate({ ...field, ...updates });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 cursor-move"
              type="button"
            >
              <GripVertical className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={onMoveUp}
              disabled={!canMoveUp}
              type="button"
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={onMoveDown}
              disabled={!canMoveDown}
              type="button"
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
          <CardTitle className="text-base flex-1">
            {field.label || field.name || "New Field"}
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setExpanded(!expanded)}
            type="button"
          >
            <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-destructive"
            onClick={onDelete}
            type="button"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      {expanded && (
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={`${field.id}-name`}>Field Name *</Label>
              <Input
                id={`${field.id}-name`}
                value={field.name}
                onChange={(e) => updateField({ name: e.target.value })}
                placeholder="user_name"
                pattern="[a-z_]+"
                title="Lowercase letters and underscores only"
              />
              <p className="text-xs text-muted-foreground">Database column name</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor={`${field.id}-label`}>Display Label *</Label>
              <Input
                id={`${field.id}-label`}
                value={field.label}
                onChange={(e) => updateField({ label: e.target.value })}
                placeholder="User Name"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${field.id}-type`}>Field Type *</Label>
            <Select value={field.type} onValueChange={(value: any) => updateField({ type: value })}>
              <SelectTrigger id={`${field.id}-type`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {fieldTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${field.id}-description`}>Description</Label>
            <Textarea
              id={`${field.id}-description`}
              value={field.description || ''}
              onChange={(e) => updateField({ description: e.target.value })}
              placeholder="Field description for help text..."
              rows={2}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center space-x-2">
              <Switch
                id={`${field.id}-nullable`}
                checked={field.nullable}
                onCheckedChange={(checked) => updateField({ nullable: checked })}
              />
              <Label htmlFor={`${field.id}-nullable`} className="cursor-pointer">
                Nullable
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id={`${field.id}-unique`}
                checked={field.unique}
                onCheckedChange={(checked) => updateField({ unique: checked })}
              />
              <Label htmlFor={`${field.id}-unique`} className="cursor-pointer">
                Unique
              </Label>
            </div>
          </div>

          {(field.type === 'select' || field.type === 'multiselect') && (
            <div className="space-y-2">
              <Label htmlFor={`${field.id}-options`}>Options (one per line)</Label>
              <Textarea
                id={`${field.id}-options`}
                value={field.validation?.options?.join('\n') || ''}
                onChange={(e) => updateField({
                  validation: {
                    ...field.validation,
                    options: e.target.value.split('\n').filter(o => o.trim())
                  }
                })}
                placeholder="Option 1&#10;Option 2&#10;Option 3"
                rows={4}
              />
            </div>
          )}

          {field.type === 'number' && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor={`${field.id}-min`}>Minimum Value</Label>
                <Input
                  id={`${field.id}-min`}
                  type="number"
                  value={field.validation?.min || ''}
                  onChange={(e) => updateField({
                    validation: {
                      ...field.validation,
                      min: e.target.value ? Number(e.target.value) : undefined
                    }
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`${field.id}-max`}>Maximum Value</Label>
                <Input
                  id={`${field.id}-max`}
                  type="number"
                  value={field.validation?.max || ''}
                  onChange={(e) => updateField({
                    validation: {
                      ...field.validation,
                      max: e.target.value ? Number(e.target.value) : undefined
                    }
                  })}
                />
              </div>
            </div>
          )}

          {field.type === 'text' && (
            <div className="space-y-2">
              <Label htmlFor={`${field.id}-pattern`}>Validation Pattern (regex)</Label>
              <Input
                id={`${field.id}-pattern`}
                value={field.validation?.pattern || ''}
                onChange={(e) => updateField({
                  validation: {
                    ...field.validation,
                    pattern: e.target.value
                  }
                })}
                placeholder="^[a-zA-Z0-9]+$"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor={`${field.id}-default`}>Default Value</Label>
            <Input
              id={`${field.id}-default`}
              value={field.default_value || ''}
              onChange={(e) => updateField({ default_value: e.target.value })}
              placeholder="Default value..."
            />
          </div>
        </CardContent>
      )}
    </Card>
  );
}
