import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface TroubleshootingIssue {
  id: string;
  issue_name: string;
  category: string;
  severity: string;
  problem_description: string;
  signs: string | null;
  root_causes: string | null;
  recommended_steps: string | null;
  dos: string | null;
  donts: string | null;
  is_published: boolean;
  created_at: string;
}

export default function AdminTroubleshooting() {
  const [issues, setIssues] = useState<TroubleshootingIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    issue_name: "",
    category: "behavior",
    severity: "medium",
    problem_description: "",
    signs: "",
    root_causes: "",
    recommended_steps: "",
    dos: "",
    donts: "",
    is_published: true,
  });
  
  const { toast } = useToast();

  useEffect(() => {
    loadIssues();
  }, []);

  const loadIssues = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from("troubleshooting_issues")
        .select("*")
        .order("created_at", { ascending: false });

      if (filterCategory !== "all") {
        query = query.eq("category", filterCategory);
      }

      if (searchTerm) {
        query = query.or(`issue_name.ilike.%${searchTerm}%,problem_description.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setIssues(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading issues",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.issue_name.trim() || !formData.problem_description.trim()) {
      toast({
        title: "Validation Error",
        description: "Issue name and problem description are required",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingId) {
        const { error } = await supabase
          .from("troubleshooting_issues")
          .update({
            issue_name: formData.issue_name,
            category: formData.category,
            severity: formData.severity,
            problem_description: formData.problem_description,
            signs: formData.signs || null,
            root_causes: formData.root_causes || null,
            recommended_steps: formData.recommended_steps || null,
            dos: formData.dos || null,
            donts: formData.donts || null,
            is_published: formData.is_published,
          })
          .eq("id", editingId);

        if (error) throw error;
        toast({ title: "Issue updated successfully" });
      } else {
        const { error } = await supabase
          .from("troubleshooting_issues")
          .insert({
            issue_name: formData.issue_name,
            category: formData.category,
            severity: formData.severity,
            problem_description: formData.problem_description,
            signs: formData.signs || null,
            root_causes: formData.root_causes || null,
            recommended_steps: formData.recommended_steps || null,
            dos: formData.dos || null,
            donts: formData.donts || null,
            is_published: formData.is_published,
          });

        if (error) throw error;
        toast({ title: "Issue created successfully" });
      }

      setDialogOpen(false);
      resetForm();
      loadIssues();
    } catch (error: any) {
      toast({
        title: "Error saving issue",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this troubleshooting issue?")) return;

    try {
      const { error } = await supabase
        .from("troubleshooting_issues")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({ title: "Issue deleted successfully" });
      loadIssues();
    } catch (error: any) {
      toast({
        title: "Error deleting issue",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (issue: TroubleshootingIssue) => {
    setEditingId(issue.id);
    setFormData({
      issue_name: issue.issue_name,
      category: issue.category,
      severity: issue.severity,
      problem_description: issue.problem_description,
      signs: issue.signs || "",
      root_causes: issue.root_causes || "",
      recommended_steps: issue.recommended_steps || "",
      dos: issue.dos || "",
      donts: issue.donts || "",
      is_published: issue.is_published,
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      issue_name: "",
      category: "behavior",
      severity: "medium",
      problem_description: "",
      signs: "",
      root_causes: "",
      recommended_steps: "",
      dos: "",
      donts: "",
      is_published: true,
    });
    setEditingId(null);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "low": return "default";
      case "medium": return "secondary";
      case "high": return "destructive";
      default: return "default";
    }
  };

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Troubleshooting Library</h1>
          <p className="text-muted-foreground">Manage behavior issues and training solutions</p>
        </div>
        <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          Add Issue
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Behavior Issues</CardTitle>
          <CardDescription>
            <div className="flex gap-4 mt-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search issues..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyUp={loadIssues}
                  className="pl-10"
                />
              </div>
              <Select value={filterCategory} onValueChange={(value) => { setFilterCategory(value); loadIssues(); }}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="behavior">Behavior</SelectItem>
                  <SelectItem value="training">Training</SelectItem>
                  <SelectItem value="socialization">Socialization</SelectItem>
                  <SelectItem value="anxiety">Anxiety</SelectItem>
                  <SelectItem value="aggression">Aggression</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading issues...</div>
          ) : issues.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No troubleshooting issues found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Issue</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {issues.map((issue) => (
                  <TableRow key={issue.id}>
                    <TableCell className="font-medium">{issue.issue_name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {issue.category}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getSeverityColor(issue.severity)} className="capitalize">
                        {issue.severity}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={issue.is_published ? "default" : "secondary"}>
                        {issue.is_published ? "Published" : "Draft"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(issue)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(issue.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Issue" : "Add Issue"}</DialogTitle>
            <DialogDescription>
              {editingId ? "Update troubleshooting issue details" : "Create a new troubleshooting issue"}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Issue Name *</Label>
                <Input
                  value={formData.issue_name}
                  onChange={(e) => setFormData({ ...formData, issue_name: e.target.value })}
                  placeholder="e.g., Excessive Barking"
                />
              </div>
              <div>
                <Label>Category *</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="behavior">Behavior</SelectItem>
                    <SelectItem value="training">Training</SelectItem>
                    <SelectItem value="socialization">Socialization</SelectItem>
                    <SelectItem value="anxiety">Anxiety</SelectItem>
                    <SelectItem value="aggression">Aggression</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Severity *</Label>
              <Select value={formData.severity} onValueChange={(value) => setFormData({ ...formData, severity: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Problem Description *</Label>
              <Textarea
                value={formData.problem_description}
                onChange={(e) => setFormData({ ...formData, problem_description: e.target.value })}
                placeholder="Describe the problem in detail"
                rows={3}
              />
            </div>

            <div>
              <Label>Signs & Symptoms</Label>
              <Textarea
                value={formData.signs}
                onChange={(e) => setFormData({ ...formData, signs: e.target.value })}
                placeholder="What signs indicate this issue?"
                rows={2}
              />
            </div>

            <div>
              <Label>Root Causes</Label>
              <Textarea
                value={formData.root_causes}
                onChange={(e) => setFormData({ ...formData, root_causes: e.target.value })}
                placeholder="Common causes of this issue"
                rows={2}
              />
            </div>

            <div>
              <Label>Recommended Steps</Label>
              <Textarea
                value={formData.recommended_steps}
                onChange={(e) => setFormData({ ...formData, recommended_steps: e.target.value })}
                placeholder="Step-by-step training approach"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Do's</Label>
                <Textarea
                  value={formData.dos}
                  onChange={(e) => setFormData({ ...formData, dos: e.target.value })}
                  placeholder="Recommended actions"
                  rows={2}
                />
              </div>
              <div>
                <Label>Don'ts</Label>
                <Textarea
                  value={formData.donts}
                  onChange={(e) => setFormData({ ...formData, donts: e.target.value })}
                  placeholder="Actions to avoid"
                  rows={2}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_published"
                checked={formData.is_published}
                onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                className="h-4 w-4"
              />
              <Label htmlFor="is_published">Published</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingId ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
