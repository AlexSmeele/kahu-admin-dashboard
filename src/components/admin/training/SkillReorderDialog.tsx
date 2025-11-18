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

interface Skill {
  id: string;
  name: string;
  priority_order: number | null;
  difficulty_level: number;
}

interface SkillReorderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReorderComplete: () => void;
}

export function SkillReorderDialog({ open, onOpenChange, onReorderComplete }: SkillReorderDialogProps) {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      loadSkills();
    }
  }, [open]);

  const loadSkills = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("skills")
        .select("id, name, priority_order, difficulty_level")
        .order("priority_order", { ascending: true, nullsFirst: false })
        .order("name", { ascending: true });

      if (error) throw error;

      setSkills(data || []);
    } catch (error) {
      console.error("Error loading skills:", error);
      toast.error("Failed to load skills");
    } finally {
      setLoading(false);
    }
  };

  const moveSkill = (index: number, direction: "up" | "down") => {
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === skills.length - 1)
    ) {
      return;
    }

    const newSkills = [...skills];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    [newSkills[index], newSkills[targetIndex]] = [newSkills[targetIndex], newSkills[index]];
    setSkills(newSkills);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let successCount = 0;
      let errorCount = 0;

      // Update priority_order for all skills with minimal payload
      for (let i = 0; i < skills.length; i++) {
        const { error } = await supabase
          .from("skills")
          .update({ priority_order: i + 1 })
          .eq("id", skills[i].id);

        if (error) {
          console.error(`Error updating skill ${skills[i].id}:`, error);
          errorCount++;
        } else {
          successCount++;
        }
      }

      if (errorCount > 0) {
        toast.error(`Failed to update ${errorCount} skill(s). ${successCount} updated successfully.`);
      } else {
        toast.success("Skill order updated successfully");
      }

      onReorderComplete();
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving skill order:", error);
      toast.error("Failed to save skill order");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Reorder Skills</DialogTitle>
          <DialogDescription>
            Adjust the default order of skills. The first skill should be the most basic (e.g., Name Recognition).
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2">
          {loading ? (
            <div className="text-center py-8">Loading skills...</div>
          ) : (
            <div className="space-y-2">
              {skills.map((skill, index) => (
                <div
                  key={skill.id}
                  className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                >
                  <div className="flex flex-col gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => moveSkill(index, "up")}
                      disabled={index === 0}
                    >
                      <ArrowUp className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => moveSkill(index, "down")}
                      disabled={index === skills.length - 1}
                    >
                      <ArrowDown className="h-3 w-3" />
                    </Button>
                  </div>
                  
                  <Badge variant="secondary" className="w-12 justify-center">
                    {index + 1}
                  </Badge>
                  
                  <div className="flex-1">
                    <div className="font-medium">{skill.name}</div>
                    <div className="text-xs text-muted-foreground">
                      Difficulty: Level {skill.difficulty_level}
                    </div>
                  </div>
                  
                  <Badge variant="outline">
                    Current: {skill.priority_order || "N/A"}
                  </Badge>
                </div>
              ))}
            </div>
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
