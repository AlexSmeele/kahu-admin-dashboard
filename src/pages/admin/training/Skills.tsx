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
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { Search, Plus, ArrowUpDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { SkillReorderDialog } from "@/components/admin/training/SkillReorderDialog";

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
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [reorderDialogOpen, setReorderDialogOpen] = useState(false);
  const [sortField, setSortField] = useState<keyof Skill | null>("priority_order");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
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
        .order("priority_order", { ascending: true, nullsFirst: false })
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

  const handleSort = (field: keyof Skill) => {
    if (sortField === field) {
      // Toggle direction if clicking same field
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // New field, default to ascending
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const sortedSkills = [...skills].sort((a, b) => {
    if (!sortField) return 0;

    const aValue = a[sortField];
    const bValue = b[sortField];

    // Handle null/undefined values
    if (aValue == null && bValue == null) return 0;
    if (aValue == null) return sortDirection === "asc" ? 1 : -1;
    if (bValue == null) return sortDirection === "asc" ? -1 : 1;

    // Handle arrays (like category)
    if (Array.isArray(aValue) && Array.isArray(bValue)) {
      const aStr = aValue.join(", ");
      const bStr = bValue.join(", ");
      return sortDirection === "asc" 
        ? aStr.localeCompare(bStr)
        : bStr.localeCompare(aStr);
    }

    // Handle numbers
    if (typeof aValue === "number" && typeof bValue === "number") {
      return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
    }

    // Handle strings
    const aStr = String(aValue);
    const bStr = String(bValue);
    return sortDirection === "asc" 
      ? aStr.localeCompare(bStr)
      : bStr.localeCompare(aStr);
  });

  return (
    <div className="p-4 md:p-8">
      <div className="mb-4 md:mb-6">
        <div className="mb-3 md:mb-4">
          <h1 className="text-2xl md:text-3xl font-bold">Training Skills</h1>
          <p className="text-sm md:text-base text-muted-foreground">Manage training skills and exercises</p>
        </div>
        <div className="flex flex-row gap-2">
          <Button variant="outline" onClick={() => setReorderDialogOpen(true)} className="flex-1 sm:flex-none sm:w-auto">
            <ArrowUpDown className="mr-2 h-4 w-4" />
            Reorder Skills
          </Button>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="flex-1 sm:flex-none sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                Add Skill
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
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
        </div>
      </div>

      <Card>
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="text-base md:text-lg">Skills Library</CardTitle>
          <CardDescription className="text-xs md:text-sm">
            Click on a skill to view and edit details
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
          <div className="mb-3 md:mb-4 flex flex-row gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search skills..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[160px] sm:w-[200px]">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="foundation">Foundation</SelectItem>
                <SelectItem value="obedience">Obedience</SelectItem>
                <SelectItem value="tricks">Tricks</SelectItem>
                <SelectItem value="behavior">Behavior</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : (
            <ScrollArea className="w-full overflow-x-auto">
              <Table className="text-sm md:text-base">
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="w-16 cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort("priority_order")}
                  >
                    <div className="flex items-center gap-1">
                      Order
                      <ArrowUpDown className={`h-3 w-3 ${sortField === "priority_order" ? "text-primary" : "text-muted-foreground"}`} />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort("name")}
                  >
                    <div className="flex items-center gap-1">
                      Name
                      <ArrowUpDown className={`h-3 w-3 ${sortField === "name" ? "text-primary" : "text-muted-foreground"}`} />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort("skill_type")}
                  >
                    <div className="flex items-center gap-1">
                      Type
                      <ArrowUpDown className={`h-3 w-3 ${sortField === "skill_type" ? "text-primary" : "text-muted-foreground"}`} />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort("difficulty_level")}
                  >
                    <div className="flex items-center gap-1">
                      Difficulty
                      <ArrowUpDown className={`h-3 w-3 ${sortField === "difficulty_level" ? "text-primary" : "text-muted-foreground"}`} />
                    </div>
                  </TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedSkills.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No skills found
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedSkills.map((skill) => (
                    <TableRow 
                      key={skill.id} 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleRowClick(skill.id)}
                    >
                      <TableCell>
                        <Badge variant="secondary" className="w-10 justify-center">
                          {skill.priority_order || "-"}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{skill.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{skill.skill_type || "N/A"}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{skill.difficulty_level}/5</Badge>
                      </TableCell>
                      <TableCell className="max-w-md truncate">
                        {skill.short_description || "N/A"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      <SkillReorderDialog
        open={reorderDialogOpen}
        onOpenChange={setReorderDialogOpen}
        onReorderComplete={loadSkills}
      />
    </div>
  );
}
