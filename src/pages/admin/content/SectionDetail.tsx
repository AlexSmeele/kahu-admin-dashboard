import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Table as TableIcon, Upload, Plus, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function SectionDetail() {
  const { sectionId } = useParams();
  const navigate = useNavigate();
  const [section, setSection] = useState<any>(null);
  const [tables, setTables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedSection, setEditedSection] = useState<any>(null);
  const [firstDeleteDialogOpen, setFirstDeleteDialogOpen] = useState(false);
  const [secondDeleteDialogOpen, setSecondDeleteDialogOpen] = useState(false);

  useEffect(() => {
    fetchSectionAndTables();
  }, [sectionId]);

  const fetchSectionAndTables = async () => {
    try {
      setLoading(true);

      const { data: sectionData, error: sectionError } = await supabase
        .from('admin_sections')
        .select('*')
        .eq('id', sectionId)
        .single();

      if (sectionError) throw sectionError;
      setSection(sectionData);

      const { data: tablesData, error: tablesError } = await supabase
        .from('admin_content_tables')
        .select('*')
        .eq('section_id', sectionId)
        .order('order_index');

      if (tablesError) throw tablesError;
      setTables(tablesData || []);
    } catch (error: any) {
      console.error("Error:", error);
      toast.error(`Failed to load section: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = () => {
    setEditedSection({ ...section });
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedSection(null);
  };

  const handleSaveEdit = async () => {
    try {
      const { error } = await supabase
        .from('admin_sections')
        .update({
          display_name: editedSection.display_name,
          name: editedSection.name,
          description: editedSection.description,
          icon: editedSection.icon,
          is_active: editedSection.is_active,
        })
        .eq('id', sectionId);

      if (error) throw error;

      toast.success("Section updated successfully");
      setSection(editedSection);
      setIsEditing(false);
      setEditedSection(null);
    } catch (error: any) {
      console.error("Error:", error);
      toast.error(`Failed to update section: ${error.message}`);
    }
  };

  const handleFirstDeleteConfirm = () => {
    setFirstDeleteDialogOpen(false);
    setSecondDeleteDialogOpen(true);
  };

  const handleFinalDelete = async () => {
    try {
      const { error } = await supabase
        .from('admin_sections')
        .delete()
        .eq('id', sectionId);

      if (error) throw error;

      toast.success("Section deleted successfully");
      navigate('/admin/content/sections');
    } catch (error: any) {
      console.error("Error:", error);
      toast.error(`Failed to delete section: ${error.message}`);
    } finally {
      setSecondDeleteDialogOpen(false);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;
  if (!section) return <div className="p-8">Section not found</div>;

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container max-w-7xl mx-auto px-4 md:px-8 py-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/admin/content/sections')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Sections
          </Button>
        </div>
      </div>

      <div className="container max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-8">
        {/* Header Section */}
        <div className="space-y-4">
          {!isEditing ? (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{section.display_name}</h1>
                    <Badge variant={section.is_active ? "default" : "secondary"}>
                      {section.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  {section.description && (
                    <p className="text-muted-foreground text-base md:text-lg">{section.description}</p>
                  )}
                  <div className="mt-2 text-sm text-muted-foreground">
                    <span className="font-mono bg-muted px-2 py-1 rounded">System name: {section.name}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleEditClick} variant="outline" size="lg">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Section
                  </Button>
                  <Button onClick={() => navigate(`/admin/content/sections/${sectionId}/tables/new`)} size="lg">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Table
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Edit Section</CardTitle>
                <CardDescription>Update section information and settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="display_name">Display Name</Label>
                    <Input
                      id="display_name"
                      value={editedSection.display_name}
                      onChange={(e) => setEditedSection({ ...editedSection, display_name: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="name">System Name</Label>
                    <Input
                      id="name"
                      value={editedSection.name}
                      onChange={(e) => setEditedSection({ ...editedSection, name: e.target.value })}
                      placeholder="lowercase-with-dashes"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={editedSection.description || ""}
                      onChange={(e) => setEditedSection({ ...editedSection, description: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="icon">Icon</Label>
                    <Input
                      id="icon"
                      value={editedSection.icon || ""}
                      onChange={(e) => setEditedSection({ ...editedSection, icon: e.target.value })}
                      placeholder="Lucide icon name (e.g., GraduationCap)"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_active"
                      checked={editedSection.is_active}
                      onCheckedChange={(checked) => setEditedSection({ ...editedSection, is_active: checked })}
                    />
                    <Label htmlFor="is_active">Active</Label>
                  </div>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button onClick={handleSaveEdit} className="flex-1">
                    Save Changes
                  </Button>
                  <Button onClick={handleCancelEdit} variant="outline" className="flex-1">
                    Cancel
                  </Button>
                  <Button
                    onClick={() => setFirstDeleteDialogOpen(true)}
                    variant="destructive"
                    size="icon"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Content Tables Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold tracking-tight">
              Content Tables
              <span className="ml-2 text-muted-foreground font-normal">({tables.length})</span>
            </h2>
          </div>

          {tables.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                  <TableIcon className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No tables yet</h3>
                <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                  Get started by creating your first content table
                </p>
                <Button onClick={() => navigate(`/admin/content/sections/${sectionId}/tables/new`)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Table
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {tables.map((table) => (
                <Card key={table.id} className="group hover:shadow-lg hover:border-primary/20 transition-all duration-200">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                          <TableIcon className="h-4 w-4" />
                        </div>
                        <span className="line-clamp-1">{table.display_name}</span>
                      </CardTitle>
                      <Badge variant={table.is_active ? "default" : "secondary"} className="shrink-0">
                        {table.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    {table.description && (
                      <CardDescription className="line-clamp-2 mt-2">
                        {table.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-muted/50 text-sm">
                      <div>
                        <div className="text-muted-foreground mb-1">Table</div>
                        <code className="text-xs font-mono bg-background px-2 py-1 rounded border">
                          {table.table_name}
                        </code>
                      </div>
                      <div>
                        <div className="text-muted-foreground mb-1">Fields</div>
                        <div className="font-semibold">{(table.schema_definition as any[]).length}</div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 pt-2">
                      <Button 
                        size="sm" 
                        className="w-full"
                        onClick={() => navigate(`/admin/content/sections/${sectionId}/tables/${table.id}/records`)}
                      >
                        Manage Data
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="w-full"
                        onClick={() => navigate(`/admin/content/sections/${sectionId}/tables/new?tableId=${table.id}`)}
                      >
                        Edit Schema
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* First Delete Confirmation */}
      <AlertDialog open={firstDeleteDialogOpen} onOpenChange={setFirstDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Section?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{section.display_name}"? This will also delete all content
              tables within this section.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleFirstDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Yes, Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Second Delete Confirmation */}
      <AlertDialog open={secondDeleteDialogOpen} onOpenChange={setSecondDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the section and all its content tables
              from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleFinalDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Permanently Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
