import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ChevronUp, ChevronDown, X, Plus, Layers, AlertCircle, CheckCircle2 } from "lucide-react";
import { CSVColumn } from "./CSVColumnMapper";

export interface ColumnGroup {
  id: string;
  targetField: string;
  sourceColumns: string[];
  dataType: 'json';
}

interface ColumnGroupManagerProps {
  columns: CSVColumn[];
  groups: ColumnGroup[];
  onGroupsChange: (groups: ColumnGroup[]) => void;
  groupedColumns: Set<string>;
}

export function ColumnGroupManager({
  columns,
  groups,
  onGroupsChange,
  groupedColumns,
}: ColumnGroupManagerProps) {
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);

  const availableColumns = columns.filter(col => !groupedColumns.has(col.name));

  const validateGroupName = (name: string): string | null => {
    if (!name.trim()) return "Group name is required";
    
    const fieldName = name.toLowerCase().replace(/\s+/g, '_');
    
    // Check if field name conflicts with existing groups
    if (groups.some(g => g.targetField === fieldName)) {
      return "A group with this name already exists";
    }
    
    // Check for valid field name pattern
    if (!/^[a-z][a-z0-9_]*$/.test(fieldName)) {
      return "Name must start with a letter and contain only lowercase letters, numbers, and underscores";
    }
    
    return null;
  };

  const createGroup = () => {
    const validationError = validateGroupName(newGroupName);
    if (validationError || selectedColumns.length < 2) {
      return;
    }

    const newGroup: ColumnGroup = {
      id: `group_${Date.now()}`,
      targetField: newGroupName.toLowerCase().replace(/\s+/g, '_'),
      sourceColumns: selectedColumns,
      dataType: 'json',
    };

    onGroupsChange([...groups, newGroup]);
    setIsCreatingGroup(false);
    setNewGroupName('');
    setSelectedColumns([]);
  };

  const deleteGroup = (groupId: string) => {
    onGroupsChange(groups.filter(g => g.id !== groupId));
  };

  const updateGroupField = (groupId: string, targetField: string) => {
    onGroupsChange(
      groups.map(g => g.id === groupId ? { ...g, targetField } : g)
    );
  };

  const moveColumn = (groupId: string, columnIndex: number, direction: 'up' | 'down') => {
    const group = groups.find(g => g.id === groupId);
    if (!group) return;

    const newColumns = [...group.sourceColumns];
    const newIndex = direction === 'up' ? columnIndex - 1 : columnIndex + 1;

    if (newIndex < 0 || newIndex >= newColumns.length) return;

    [newColumns[columnIndex], newColumns[newIndex]] = [newColumns[newIndex], newColumns[columnIndex]];

    onGroupsChange(
      groups.map(g => g.id === groupId ? { ...g, sourceColumns: newColumns } : g)
    );
  };

  const removeColumnFromGroup = (groupId: string, columnName: string) => {
    const group = groups.find(g => g.id === groupId);
    if (!group) return;

    const newColumns = group.sourceColumns.filter(c => c !== columnName);
    
    // If less than 2 columns remain, delete the group
    if (newColumns.length < 2) {
      deleteGroup(groupId);
    } else {
      onGroupsChange(
        groups.map(g => g.id === groupId ? { ...g, sourceColumns: newColumns } : g)
      );
    }
  };

  const toggleColumnSelection = (columnName: string) => {
    setSelectedColumns(prev =>
      prev.includes(columnName)
        ? prev.filter(c => c !== columnName)
        : [...prev, columnName]
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5" />
              Column Groups
            </CardTitle>
            <CardDescription>
              Combine multiple CSV columns into JSONB array fields
            </CardDescription>
          </div>
          {!isCreatingGroup && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCreatingGroup(true)}
              disabled={availableColumns.length < 2}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Group
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {groups.length > 0 && (
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              {groups.length} column {groups.length === 1 ? 'group' : 'groups'} configured. 
              These columns will be combined into JSONB arrays during import.
            </AlertDescription>
          </Alert>
        )}
        
        {groups.length === 0 && !isCreatingGroup && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No column groups created yet. Groups combine multiple columns (like "Step 1", "Step 2", "Step 3") into single JSONB array fields.
            </AlertDescription>
          </Alert>
        )}

        {/* Existing Groups */}
        {groups.map((group, groupIndex) => (
          <Card key={group.id} className="border-primary/20">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <Label className="text-xs text-muted-foreground">Target Field</Label>
                  <Input
                    value={group.targetField}
                    onChange={(e) => updateGroupField(group.id, e.target.value)}
                    placeholder="field_name"
                    className="h-8"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteGroup(group.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <Label className="text-xs text-muted-foreground">
                Source Columns ({group.sourceColumns.length})
              </Label>
              {group.sourceColumns.map((colName, colIndex) => (
                <div
                  key={colName}
                  className="flex items-center gap-2 p-2 rounded bg-muted/50"
                >
                  <div className="flex flex-col gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => moveColumn(group.id, colIndex, 'up')}
                      disabled={colIndex === 0}
                    >
                      <ChevronUp className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => moveColumn(group.id, colIndex, 'down')}
                      disabled={colIndex === group.sourceColumns.length - 1}
                    >
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </div>
                  <Badge variant="secondary" className="flex-1">
                    {colIndex + 1}. {colName}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => removeColumnFromGroup(group.id, colName)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              <div className="mt-2 p-3 rounded bg-primary/5 border border-primary/20">
                <p className="text-xs font-medium mb-1">Example output:</p>
                <div className="text-xs font-mono bg-background p-2 rounded">
                  {`"${group.targetField}": [`}
                  {group.sourceColumns.map((col, i) => `"${col} value"`).join(', ')}
                  {']'}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Create New Group */}
        {isCreatingGroup && (
          <Card className="border-primary">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Create New Column Group</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Group Name</Label>
                <Input
                  value={newGroupName}
                  onChange={(e) => {
                    setNewGroupName(e.target.value);
                    setValidationError(validateGroupName(e.target.value));
                  }}
                  placeholder="e.g., steps, brief_instructions"
                  className="mt-1"
                />
                {validationError && (
                  <p className="text-sm text-destructive mt-1">{validationError}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Will be saved as: {newGroupName.toLowerCase().replace(/\s+/g, '_') || 'field_name'}
                </p>
              </div>
              
              <div>
                <Label>Select Columns (minimum 2)</Label>
                <div className="mt-2 space-y-1 max-h-[200px] overflow-y-auto">
                  {availableColumns.map(col => (
                    <div
                      key={col.name}
                      className="flex items-center gap-2 p-2 hover:bg-muted/50 rounded cursor-pointer"
                      onClick={() => toggleColumnSelection(col.name)}
                    >
                      <input
                        type="checkbox"
                        checked={selectedColumns.includes(col.name)}
                        onChange={() => {}}
                        className="h-4 w-4"
                      />
                      <span className="text-sm">{col.name}</span>
                      <Badge variant="outline" className="ml-auto text-xs">
                        {col.detectedType}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              {selectedColumns.length > 0 && (
                <div className="p-3 rounded bg-primary/5 border border-primary/20">
                  <p className="text-sm font-medium mb-2">Preview of combined data:</p>
                  <div className="text-xs font-mono bg-background p-2 rounded">
                    [{selectedColumns.map((col, i) => `"${col} value"`).join(', ')}]
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {selectedColumns.length} columns selected • Will combine into array
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={createGroup}
                  disabled={!!validationError || !newGroupName.trim() || selectedColumns.length < 2}
                  className="flex-1"
                >
                  Create Group ({selectedColumns.length} columns)
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsCreatingGroup(false);
                    setNewGroupName('');
                    setSelectedColumns([]);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}
