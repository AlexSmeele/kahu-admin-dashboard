import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, GripVertical, FolderOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface Section {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  icon: string | null;
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function Sections() {
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sectionToDelete, setSectionToDelete] = useState<Section | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchSections();
  }, []);

  const fetchSections = async () => {
    try {
      const { data, error } = await supabase
        .from("admin_sections")
        .select("*")
        .order("order_index", { ascending: true });

      if (error) throw error;
      setSections(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading sections",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!sectionToDelete) return;

    try {
      const { error } = await supabase
        .from("admin_sections")
        .delete()
        .eq("id", sectionToDelete.id);

      if (error) throw error;

      toast({
        title: "Section deleted",
        description: `${sectionToDelete.display_name} has been deleted.`,
      });

      fetchSections();
    } catch (error: any) {
      toast({
        title: "Error deleting section",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setSectionToDelete(null);
    }
  };

  const confirmDelete = (section: Section) => {
    setSectionToDelete(section);
    setDeleteDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-background">
        <div className="container max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-8">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Content Sections</h1>
              <p className="text-base md:text-lg text-muted-foreground mt-2">
                Organize and manage your content library
              </p>
            </div>
            <Button onClick={() => navigate("/admin/content/sections/new")} size="lg">
              <Plus className="mr-2 h-4 w-4" />
              Add Section
            </Button>
          </div>

          {/* Sections Grid */}
          {sections.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                  <FolderOpen className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No sections yet</h3>
                <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                  Create your first content section to get started
                </p>
                <Button onClick={() => navigate("/admin/content/sections/new")}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create First Section
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {sections.map((section) => (
                <Card 
                  key={section.id} 
                  className="group hover:shadow-lg hover:border-primary/20 transition-all duration-200 cursor-pointer"
                  onClick={() => navigate(`/admin/content/sections/${section.id}`)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="flex items-center gap-2 text-lg mb-2">
                          <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                            <GripVertical className="h-4 w-4" />
                          </div>
                          <span className="line-clamp-1">{section.display_name}</span>
                        </CardTitle>
                        <CardDescription className="line-clamp-2">
                          {section.description || "No description provided"}
                        </CardDescription>
                      </div>
                      <Badge variant={section.is_active ? "default" : "secondary"} className="shrink-0">
                        {section.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-muted/50 text-sm">
                      <div>
                        <div className="text-muted-foreground mb-1">System Name</div>
                        <code className="text-xs font-mono bg-background px-2 py-1 rounded border block truncate">
                          {section.name}
                        </code>
                      </div>
                      <div>
                        <div className="text-muted-foreground mb-1">Order</div>
                        <div className="font-semibold">{section.order_index}</div>
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2" onClick={(e) => e.stopPropagation()}>
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => navigate(`/admin/content/sections/${section.id}`)}
                      >
                        View Details
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/admin/content/sections/${section.id}/tables`);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          confirmDelete(section);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Section</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{sectionToDelete?.display_name}"? This will also delete all content
              tables within this section. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
