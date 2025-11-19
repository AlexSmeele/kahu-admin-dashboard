import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowUp, ArrowDown } from "lucide-react";
import { toast } from "sonner";

interface ContentTable {
  id: string;
  display_name: string;
  order_index: number;
  table_name: string;
}

interface TableReorderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReorderComplete: () => void;
  sectionId: string;
}

export function TableReorderDialog({ open, onOpenChange, onReorderComplete, sectionId }: TableReorderDialogProps) {
  const [tables, setTables] = useState<ContentTable[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      loadTables();
    }
  }, [open, sectionId]);

  const loadTables = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("admin_content_tables")
        .select("id, display_name, order_index, table_name")
        .eq("section_id", sectionId)
        .order("order_index", { ascending: true });

      if (error) throw error;
      setTables(data || []);
    } catch (error) {
      console.error("Error loading tables:", error);
      toast.error("Failed to load tables");
    } finally {
      setLoading(false);
    }
  };

  const moveTable = (index: number, direction: "up" | "down") => {
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === tables.length - 1)
    ) {
      return;
    }

    const newTables = [...tables];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    [newTables[index], newTables[targetIndex]] = [newTables[targetIndex], newTables[index]];
    setTables(newTables);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let successCount = 0;
      let errorCount = 0;

      // Update order_index for all tables
      for (let i = 0; i < tables.length; i++) {
        const { error } = await supabase
          .from("admin_content_tables")
          .update({ order_index: i + 1 })
          .eq("id", tables[i].id);

        if (error) {
          console.error(`Error updating table ${tables[i].id}:`, error);
          errorCount++;
        } else {
          successCount++;
        }
      }

      if (errorCount > 0) {
        toast.error(`Failed to update ${errorCount} table(s). ${successCount} updated successfully.`);
      } else {
        toast.success(`Table order updated! ${successCount} tables reordered.`);
      }

      onReorderComplete();
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving table order:", error);
      toast.error("Failed to save table order");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Reorder Tables</DialogTitle>
          <DialogDescription>
            Use arrows to reorder tables. Lower positions appear first in navigation.
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[50vh] space-y-2 py-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-sm text-muted-foreground">Loading tables...</p>
            </div>
          ) : tables.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No tables found in this section
            </div>
          ) : (
            tables.map((table, index) => (
              <div
                key={table.id}
                className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono text-xs">
                      {index + 1}
                    </Badge>
                    <span className="font-medium">{table.display_name}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{table.table_name}</p>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => moveTable(index, "up")}
                    disabled={index === 0}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => moveTable(index, "down")}
                    disabled={index === tables.length - 1}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || loading || tables.length === 0}>
            {saving ? "Saving..." : "Save Order"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
