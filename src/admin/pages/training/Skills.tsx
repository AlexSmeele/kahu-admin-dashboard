import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Search, Plus, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface Skill {
  id: string;
  name: string;
  category: string[];
  difficulty_level: number;
  skill_type: string | null;
  short_description: string | null;
  long_description: string | null;
  created_at: string;
}

export default function AdminSkills() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
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
  }, [searchTerm, categoryFilter]);

  const loadSkills = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("skills")
        .select("*")
        .order("name", { ascending: true });

      if (searchTerm) {
        query = query.ilike("name", `%${searchTerm}%`);
      }

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
      if (editingSkill) {
        const { error } = await supabase
          .from("skills")
          .update(formData)
          .eq("id", editingSkill.id);

        if (error) throw error;
        toast.success("Skill updated successfully");
      } else {
        const { error } = await supabase
          .from("skills")
          .insert([formData]);

        if (error) throw error;
        toast.success("Skill created successfully");
      }

      setDialogOpen(false);
      resetForm();
      loadSkills();
    } catch (error) {
      console.error("Error saving skill:", error);
      toast.error("Failed to save skill");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this skill?")) return;

    try {
      const { error } = await supabase
        .from("skills")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Skill deleted successfully");
      loadSkills();
    } catch (error) {
      console.error("Error deleting skill:", error);
      toast.error("Failed to delete skill");
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
    setEditingSkill(null);
  };

  const openEditDialog = (skill: Skill) => {
    setEditingSkill(skill);
    setFormData({
      name: skill.name,
      category: skill.category || ["foundation"],
      difficulty_level: skill.difficulty_level,
      skill_type: skill.skill_type || "foundation",
      short_description: skill.short_description || "",
      long_description: skill.long_description || "",
    });
    setDialogOpen(true);
  };

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Training Skills</h1>
          <p className="text-muted-foreground">Manage training skills and exercises</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Skill
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingSkill ? "Edit Skill" : "Create New Skill"}</DialogTitle>
              <DialogDescription>
                {editingSkill
                  ? "Update the skill details below."
                  : "Add a new training skill to the database."}
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
                    <SelectContent>
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
                  placeholder="Brief overview of the skill"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="long-desc">Detailed Instructions</Label>
                <Textarea
                  id="long-desc"
                  value={formData.long_description}
                  onChange={(e) => setFormData({ ...formData, long_description: e.target.value })}
                  placeholder="Step-by-step training instructions..."
                  rows={6}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>Save Skill</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Skills Library</CardTitle>
          <CardDescription>Browse and manage all training skills</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="mb-4 flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search skills..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="foundation">Foundation</SelectItem>
                <SelectItem value="obedience">Obedience</SelectItem>
                <SelectItem value="trick">Tricks</SelectItem>
                <SelectItem value="behavior">Behavior</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Difficulty</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    Loading skills...
                  </TableCell>
                </TableRow>
              ) : skills.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    No skills found
                  </TableCell>
                </TableRow>
              ) : (
                skills.map((skill) => (
                  <TableRow key={skill.id}>
                    <TableCell className="font-medium">{skill.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{skill.skill_type || "foundation"}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {[...Array(5)].map((_, i) => (
                          <div
                            key={i}
                            className={`h-2 w-2 rounded-full ${
                              i < skill.difficulty_level ? "bg-primary" : "bg-muted"
                            }`}
                          />
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-md truncate text-muted-foreground">
                      {skill.short_description || "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(skill)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(skill.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
