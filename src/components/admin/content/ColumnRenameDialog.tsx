import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface ColumnRenameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentName: string;
  onRename: (newName: string) => void;
}

export function ColumnRenameDialog({
  open,
  onOpenChange,
  currentName,
  onRename,
}: ColumnRenameDialogProps) {
  const [newName, setNewName] = useState(currentName);
  const [error, setError] = useState("");

  const validateColumnName = (name: string): string | null => {
    if (!name || name.trim() === "") {
      return "Column name cannot be empty";
    }
    if (!/^[a-z][a-z0-9_]*$/.test(name)) {
      return "Column name must start with a letter and contain only lowercase letters, numbers, and underscores";
    }
    if (name.length > 63) {
      return "Column name must be 63 characters or less";
    }
    return null;
  };

  const handleRename = () => {
    const validationError = validateColumnName(newName);
    if (validationError) {
      setError(validationError);
      return;
    }

    if (newName === currentName) {
      setError("New name must be different from current name");
      return;
    }

    onRename(newName);
    onOpenChange(false);
    setNewName("");
    setError("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rename Column</DialogTitle>
          <DialogDescription>
            Rename column "{currentName}" to a new name. This will update the database column.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="currentName">Current Name</Label>
            <Input id="currentName" value={currentName} disabled className="bg-muted" />
          </div>

          <div>
            <Label htmlFor="newName">New Name</Label>
            <Input
              id="newName"
              value={newName}
              onChange={(e) => {
                setNewName(e.target.value);
                setError("");
              }}
              placeholder="new_column_name"
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Renaming a column will execute an ALTER TABLE statement on the database. Make sure
              to update any queries or code that reference this column name.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleRename}>Rename Column</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
