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

interface Section {
  id: string;
  display_name: string;
  order_index: number;
  name: string;
}

interface SectionReorderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReorderComplete: () => void;
}

export function SectionReorderDialog({ open, onOpenChange, onReorderComplete }: SectionReorderDialogProps) {
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      loadSections();
    }
  }, [open]);

  const loadSections = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("admin_sections")
        .select("id, display_name, order_index, name")
        .order("order_index", { ascending: true });

      if (error) throw error;
      setSections(data || []);
    } catch (error) {
      console.error("Error loading sections:", error);
      toast.error("Failed to load sections");
    } finally {
      setLoading(false);
    }
  };

  const moveSection = (index: number, direction: "up" | "down") => {
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === sections.length - 1)
    ) {
      return;
    }

    const newSections = [...sections];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    [newSections[index], newSections[targetIndex]] = [newSections[targetIndex], newSections[index]];
    setSections(newSections);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let successCount = 0;
      let errorCount = 0;

      // Update order_index for all sections
      for (let i = 0; i < sections.length; i++) {
        const { error } = await supabase
          .from("admin_sections")
          .update({ order_index: i + 1 })
          .eq("id", sections[i].id);

        if (error) {
          console.error(`Error updating section ${sections[i].id}:`, error);
          errorCount++;
        } else {
          successCount++;
        }
      }

      if (errorCount > 0) {
        toast.error(`Failed to update ${errorCount} section(s). ${successCount} updated successfully.`);
      } else {
        toast.success(`Section order updated! ${successCount} sections reordered.`);
      }

      onReorderComplete();
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving section order:", error);
      toast.error("Failed to save section order");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Reorder Sections</DialogTitle>
          <DialogDescription>
            Use arrows to reorder sections. Lower positions appear first in navigation.
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[50vh] space-y-2 py-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-sm text-muted-foreground">Loading sections...</p>
            </div>
          ) : sections.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No sections found
            </div>
          ) : (
            sections.map((section, index) => (
              <div
                key={section.id}
                className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono text-xs">
                      {index + 1}
                    </Badge>
                    <span className="font-medium">{section.display_name}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{section.name}</p>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => moveSection(index, "up")}
                    disabled={index === 0}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => moveSection(index, "down")}
                    disabled={index === sections.length - 1}
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
          <Button onClick={handleSave} disabled={saving || loading || sections.length === 0}>
            {saving ? "Saving..." : "Save Order"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
