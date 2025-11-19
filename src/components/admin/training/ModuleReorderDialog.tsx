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

interface Module {
  id: string;
  name: string;
  order_index: number;
  category: string;
}

interface ModuleReorderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReorderComplete: () => void;
}

export function ModuleReorderDialog({ open, onOpenChange, onReorderComplete }: ModuleReorderDialogProps) {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      loadModules();
    }
  }, [open]);

  const loadModules = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("foundation_modules")
        .select("id, name, order_index, category")
        .order("order_index", { ascending: true })
        .order("name", { ascending: true });

      if (error) throw error;
      setModules(data || []);
    } catch (error) {
      console.error("Error loading modules:", error);
      toast.error("Failed to load modules");
    } finally {
      setLoading(false);
    }
  };

  const moveModule = (index: number, direction: "up" | "down") => {
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === modules.length - 1)
    ) {
      return;
    }

    const newModules = [...modules];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    [newModules[index], newModules[targetIndex]] = [newModules[targetIndex], newModules[index]];
    setModules(newModules);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let successCount = 0;
      let errorCount = 0;

      // Update order_index for all modules
      for (let i = 0; i < modules.length; i++) {
        const { error } = await supabase
          .from("foundation_modules")
          .update({ order_index: i + 1 })
          .eq("id", modules[i].id);

        if (error) {
          console.error(`Error updating module ${modules[i].id}:`, error);
          errorCount++;
        } else {
          successCount++;
        }
      }

      if (errorCount > 0) {
        toast.error(`Failed to update ${errorCount} module(s). ${successCount} updated successfully.`);
      } else {
        toast.success(`Module order updated! ${successCount} modules reordered.`);
      }

      onReorderComplete();
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving module order:", error);
      toast.error("Failed to save module order");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Reorder Modules</DialogTitle>
          <DialogDescription>
            Drag or use arrows to reorder modules. Lower positions appear first in the list.
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[50vh] space-y-2 py-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-sm text-muted-foreground">Loading modules...</p>
            </div>
          ) : modules.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No modules found</p>
            </div>
          ) : (
            modules.map((module, index) => (
              <div
                key={module.id}
                className="flex items-center gap-3 p-3 border rounded-lg bg-card"
              >
                <div className="flex flex-col gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => moveModule(index, "up")}
                    disabled={index === 0}
                  >
                    <ArrowUp className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => moveModule(index, "down")}
                    disabled={index === modules.length - 1}
                  >
                    <ArrowDown className="h-3 w-3" />
                  </Button>
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{index + 1}.</span>
                    <span className="font-medium">{module.name}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {module.category}
                    </Badge>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || loading}>
            {saving ? "Saving..." : "Save Order"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
