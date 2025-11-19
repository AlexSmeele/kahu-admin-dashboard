import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, Trash2, GripVertical, Edit2 } from "lucide-react";
import { SchemaField } from "./SchemaFieldEditor";
import { ColumnRenameDialog } from "./ColumnRenameDialog";

interface SchemaChange {
  type: 'add' | 'modify' | 'delete' | 'rename';
  columnName: string;
  oldValue?: SchemaField;
  newValue?: SchemaField;
  requiresMigration: boolean;
  migrationSQL?: string;
}

interface TableSchemaRowProps {
  field: SchemaField;
  index: number;
  change?: SchemaChange;
  onUpdate: (field: SchemaField) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRename?: (newName: string) => void;
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
  { value: 'select', label: 'Select' },
  { value: 'multiselect', label: 'Multi-select' },
];

export function TableSchemaRow({
  field,
  change,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
  onRename,
  canMoveUp,
  canMoveDown,
}: TableSchemaRowProps) {
  const [expanded, setExpanded] = useState(false);
  const [showRenameDialog, setShowRenameDialog] = useState(false);

  const updateField = (updates: Partial<SchemaField>) => {
    onUpdate({ ...field, ...updates });
  };

  const getChangeBadge = () => {
    if (!change) return null;
    
    const badges = {
      add: <Badge variant="default" className="bg-blue-500 text-white">New</Badge>,
      modify: <Badge variant="default" className="bg-yellow-500 text-white">Modified</Badge>,
      delete: <Badge variant="destructive">Deleted</Badge>,
      rename: <Badge variant="default" className="bg-purple-500 text-white">Renamed</Badge>,
    };
    
    return badges[change.type];
  };

  return (
    <div className={`border rounded-lg p-4 ${change?.type === 'delete' ? 'opacity-50 line-through' : ''}`}>
      <div className="flex items-center gap-3">
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 cursor-move"
            type="button"
          >
            <GripVertical className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onMoveUp}
            disabled={!canMoveUp}
            type="button"
          >
            <ChevronUp className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onMoveDown}
            disabled={!canMoveDown}
            type="button"
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Label className="text-xs text-muted-foreground">Column Name</Label>
            <div className="flex gap-2">
              <Input
                value={field.name}
                onChange={(e) => updateField({ name: e.target.value })}
                className="h-9"
                placeholder="column_name"
              />
              {onRename && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => setShowRenameDialog(true)}
                  type="button"
                  title="Rename column in database"
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Type</Label>
            <Select value={field.type} onValueChange={(value: any) => updateField({ type: value })}>
              <SelectTrigger className="h-9">
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
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch
                checked={field.nullable}
                onCheckedChange={(checked) => updateField({ nullable: checked })}
              />
              <Label className="text-xs">Nullable</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={field.unique}
                onCheckedChange={(checked) => updateField({ unique: checked })}
              />
              <Label className="text-xs">Unique</Label>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {getChangeBadge()}
            {change?.requiresMigration && (
              <Badge variant="outline" className="text-orange-500 border-orange-500">
                Migration
              </Badge>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setExpanded(!expanded)}
            type="button"
          >
            <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive"
            onClick={onDelete}
            type="button"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-xs text-muted-foreground">Display Label</Label>
            <Input
              value={field.label}
              onChange={(e) => updateField({ label: e.target.value })}
              placeholder="Field Label"
            />
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Default Value</Label>
            <Input
              value={field.default_value || ''}
              onChange={(e) => updateField({ default_value: e.target.value })}
              placeholder="Default value"
            />
          </div>

          <div className="md:col-span-2">
            <Label className="text-xs text-muted-foreground">Description</Label>
            <Input
              value={field.description || ''}
              onChange={(e) => updateField({ description: e.target.value })}
              placeholder="Field description"
            />
          </div>
        </div>
      )}

      {onRename && (
        <ColumnRenameDialog
          open={showRenameDialog}
          onOpenChange={setShowRenameDialog}
          currentName={field.name}
          onRename={onRename}
        />
      )}
    </div>
  );
}
