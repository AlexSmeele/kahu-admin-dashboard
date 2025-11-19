import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { SkillReorderDialog } from "@/components/admin/training/SkillReorderDialog";
import { UnifiedDataViewer } from "@/components/admin/UnifiedDataViewer";

interface Skill {
  id: string;
  name: string;
  category: string[];
  difficulty_level: number;
  skill_type: string | null;
  short_description: string | null;
  long_description: string | null;
  priority_order: number | null;
  created_at: string;
}

export default function AdminSkills() {
  const navigate = useNavigate();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [reorderDialogOpen, setReorderDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    category: ["foundation"],
    difficulty_level: 1,
    skill_type: "foundation",
    short_description: "",
    long_description: "",
  });

  useEffect(() => {
    loadSkills();
  }, [categoryFilter]);

  const loadSkills = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("skills")
        .select("*")
        .order("priority_order", { ascending: true, nullsFirst: false })
        .order("name", { ascending: true });

      const { data, error } = await query;

      if (error) throw error;

      let filteredData = data || [];
      if (categoryFilter !== "all") {
        filteredData = filteredData.filter((skill) =>
          skill.category?.includes(categoryFilter)
        );
      }

      setSkills(filteredData);
    } catch (error) {
      console.error("Error loading skills:", error);
      toast.error("Failed to load skills");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from("skills")
        .insert([formData]);

      if (error) throw error;
      toast.success("Skill created successfully");

      setDialogOpen(false);
      resetForm();
      loadSkills();
    } catch (error) {
      console.error("Error saving skill:", error);
      toast.error("Failed to save skill");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      category: ["foundation"],
      difficulty_level: 1,
      skill_type: "foundation",
      short_description: "",
      long_description: "",
    });
  };

  const handleRowClick = (skillId: string) => {
    navigate(`/admin/training/skills/${skillId}`);
  };

  // Get unique categories for filter
  const categories = Array.from(
    new Set(
      skills.flatMap((skill) => skill.category || [])
    )
  ).sort();

  return (
    <div className="p-4 md:p-8">
      <UnifiedDataViewer
        title="Training Skills"
        description="Manage training skills and exercises"
        data={skills}
        loading={loading}
        columns={[
          {
            key: 'priority_order',
            label: 'Order',
            sortable: true,
            width: 80,
            render: (val) => val || '-'
          },
          {
            key: 'name',
            label: 'Skill Name',
            sortable: true,
            minWidth: 200,
          },
          {
            key: 'category',
            label: 'Category',
            sortable: true,
            filterable: true,
            render: (val: string[]) => (
              <div className="flex flex-wrap gap-1">
                {val?.map((cat) => (
                  <Badge key={cat} variant="secondary" className="text-xs">
                    {cat}
                  </Badge>
                ))}
              </div>
            ),
          },
          {
            key: 'difficulty_level',
            label: 'Difficulty',
            sortable: true,
            width: 100,
            render: (val) => `Level ${val}`,
          },
          {
            key: 'skill_type',
            label: 'Type',
            sortable: true,
            filterable: true,
            width: 120,
            render: (val) => (
              <Badge variant="outline" className="capitalize">
                {val || 'N/A'}
              </Badge>
            ),
          },
          {
            key: 'short_description',
            label: 'Description',
            render: (val) => (
              <span className="text-sm text-muted-foreground line-clamp-2">
                {val || '-'}
              </span>
            ),
          },
        ]}
        onRowClick={(skill) => navigate(`/admin/training/skills/${skill.id}`)}
        onAdd={() => setDialogOpen(true)}
        onReorder={() => setReorderDialogOpen(true)}
        onRefresh={loadSkills}
        onExport={() => {}}
        enableSearch
        enableViews
        enablePagination
        enableColumnResize={false}
        searchPlaceholder="Search skills..."
        defaultView="table"
        pageSize={20}
        customFilters={
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent className="z-50 bg-popover">
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      {/* Add Skill Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => {
        setDialogOpen(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto z-50 bg-background">
              <DialogHeader>
                <DialogTitle>Create New Skill</DialogTitle>
                <DialogDescription>
                  Add a new training skill to the database.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Skill Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Sit, Stay, Come"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="type">Skill Type</Label>
                    <Select
                      value={formData.skill_type || "foundation"}
                      onValueChange={(value) => setFormData({ ...formData, skill_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="z-50 bg-popover">
                        <SelectItem value="foundation">Foundation</SelectItem>
                        <SelectItem value="obedience">Obedience</SelectItem>
                        <SelectItem value="trick">Trick</SelectItem>
                        <SelectItem value="behavior">Behavior</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="difficulty">Difficulty (1-5)</Label>
                    <Input
                      id="difficulty"
                      type="number"
                      min="1"
                      max="5"
                      value={formData.difficulty_level}
                      onChange={(e) =>
                        setFormData({ ...formData, difficulty_level: parseInt(e.target.value) || 1 })
                      }
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="short-desc">Short Description</Label>
                  <Input
                    id="short-desc"
                    value={formData.short_description}
                    onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
                    placeholder="Brief one-line description"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="long-desc">Long Description</Label>
                  <Textarea
                    id="long-desc"
                    rows={6}
                    value={formData.long_description}
                    onChange={(e) => setFormData({ ...formData, long_description: e.target.value })}
                    placeholder="Detailed description of the skill..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleSave}>Create Skill</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

      {/* Reorder Dialog */}
      <SkillReorderDialog
        open={reorderDialogOpen}
        onOpenChange={setReorderDialogOpen}
        onReorderComplete={loadSkills}
      />
    </div>
  );
}
