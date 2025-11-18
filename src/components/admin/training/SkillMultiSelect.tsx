import { useState, useEffect } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface Skill {
  id: string;
  name: string;
  difficulty_level: number;
  priority_order: number | null;
}

interface SkillMultiSelectProps {
  value: string[];
  onChange: (value: string[]) => void;
  currentSkillId?: string;
}

export function SkillMultiSelect({ value, onChange, currentSkillId }: SkillMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSkills, setSelectedSkills] = useState<Skill[]>([]);

  useEffect(() => {
    loadSkills();
  }, [currentSkillId]);

  useEffect(() => {
    // Load full skill details for selected IDs
    if (value.length > 0) {
      loadSelectedSkills();
    } else {
      setSelectedSkills([]);
    }
  }, [value]);

  const loadSkills = async () => {
    try {
      let query = supabase
        .from("skills")
        .select("id, name, difficulty_level, priority_order")
        .order("priority_order", { ascending: true, nullsFirst: false })
        .order("name", { ascending: true });

      if (currentSkillId) {
        query = query.neq("id", currentSkillId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setSkills(data || []);
    } catch (error) {
      console.error("Error loading skills:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadSelectedSkills = async () => {
    try {
      const { data, error } = await supabase
        .from("skills")
        .select("id, name, difficulty_level, priority_order")
        .in("id", value);

      if (error) throw error;
      setSelectedSkills(data || []);
    } catch (error) {
      console.error("Error loading selected skills:", error);
    }
  };

  const handleSelect = (skillId: string) => {
    const newValue = value.includes(skillId)
      ? value.filter((id) => id !== skillId)
      : [...value, skillId];
    onChange(newValue);
  };

  const handleRemove = (skillId: string) => {
    onChange(value.filter((id) => id !== skillId));
  };

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {value.length > 0
              ? `${value.length} prerequisite${value.length === 1 ? "" : "s"} selected`
              : "Add prerequisites..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder="Search skills..." />
            <CommandEmpty>No skills found.</CommandEmpty>
            <CommandGroup className="max-h-64 overflow-auto">
              {loading ? (
                <div className="py-6 text-center text-sm">Loading skills...</div>
              ) : (
                skills.map((skill) => (
                  <CommandItem
                    key={skill.id}
                    value={skill.name}
                    onSelect={() => handleSelect(skill.id)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value.includes(skill.id) ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span className="flex-1">
                      {skill.name}
                      <span className="ml-2 text-xs text-muted-foreground">
                        (Level {skill.difficulty_level})
                      </span>
                    </span>
                  </CommandItem>
                ))
              )}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>

      {selectedSkills.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedSkills.map((skill) => (
            <Badge key={skill.id} variant="secondary" className="pr-1">
              {skill.name}
              <button
                type="button"
                onClick={() => handleRemove(skill.id)}
                className="ml-2 rounded-full hover:bg-secondary-foreground/20 p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
