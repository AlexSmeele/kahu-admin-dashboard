import { X, Trash2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface BulkActionBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onBulkDelete?: () => void;
  onBulkExport?: () => void;
}

export function BulkActionBar({
  selectedCount,
  onClearSelection,
  onBulkDelete,
  onBulkExport,
}: BulkActionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="flex items-center justify-between gap-4 p-3 bg-muted rounded-lg border">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">
          {selectedCount} {selectedCount === 1 ? 'item' : 'items'} selected
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearSelection}
          className="h-7 px-2"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center gap-2">
        {onBulkExport && (
          <Button
            variant="outline"
            size="sm"
            onClick={onBulkExport}
            className="h-8"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        )}
        {onBulkDelete && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                size="sm"
                className="h-8"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="z-50 bg-background">
              <AlertDialogHeader>
                <AlertDialogTitle>Delete {selectedCount} items?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the selected items.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={onBulkDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </div>
  );
}
