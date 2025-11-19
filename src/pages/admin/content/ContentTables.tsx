import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Pencil, Trash2, Table2, ArrowLeft, GripVertical } from "lucide-react";
import { TableReorderDialog } from "@/components/admin/content/TableReorderDialog";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";

interface Section {
  id: string;
  display_name: string;
}

interface ContentTable {
  id: string;
  section_id: string;
  name: string;
  display_name: string;
  description: string | null;
  table_name: string;
  schema_definition: any;
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function ContentTables() {
  const { sectionId } = useParams();
  const [section, setSection] = useState<Section | null>(null);
  const [tables, setTables] = useState<ContentTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [tableToDelete, setTableToDelete] = useState<ContentTable | null>(null);
  const [reorderDialogOpen, setReorderDialogOpen] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (sectionId) {
      fetchSection();
      fetchTables();
    }
  }, [sectionId]);

  const fetchSection = async () => {
    try {
      const { data, error } = await supabase
        .from("admin_sections")
        .select("id, display_name")
        .eq("id", sectionId)
        .single();

      if (error) throw error;
      setSection(data);
    } catch (error: any) {
      toast({
        title: "Error loading section",
        description: error.message,
        variant: "destructive",
      });
      navigate("/admin/content/sections");
    }
  };

  const fetchTables = async () => {
    try {
      const { data, error } = await supabase
        .from("admin_content_tables")
        .select("*")
        .eq("section_id", sectionId)
        .order("order_index", { ascending: true });

      if (error) throw error;
      setTables(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading content tables",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!tableToDelete) return;

    try {
      const { error } = await supabase
        .from("admin_content_tables")
        .delete()
        .eq("id", tableToDelete.id);

      if (error) throw error;

      toast({
        title: "Content table deleted",
        description: `${tableToDelete.display_name} has been deleted.`,
      });

      fetchTables();
    } catch (error: any) {
      toast({
        title: "Error deleting content table",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setTableToDelete(null);
    }
  };

  const confirmDelete = (table: ContentTable) => {
    setTableToDelete(table);
    setDeleteDialogOpen(true);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin/content/sections")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold">{section?.display_name} - Content Tables</h1>
            <p className="text-sm md:text-base text-muted-foreground">
              Manage content tables and their schemas
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate(`/admin/content/sections/${sectionId}/import`)}>
              <Plus className="mr-2 h-4 w-4" />
              Import CSV
            </Button>
            <Button onClick={() => navigate(`/admin/content/sections/${sectionId}/tables/new`)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Table
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tables.map((table) => (
            <Card key={table.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      <Table2 className="h-4 w-4" />
                      {table.display_name}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {table.description || "No description"}
                    </CardDescription>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/admin/content/sections/${sectionId}/tables/${table.id}/manage`)}
                    >
                      Manage Data
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => navigate(`/admin/content/sections/${sectionId}/tables/${table.id}`)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => confirmDelete(table)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Table Name:</span>
                    <span className="font-mono text-xs">{table.table_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fields:</span>
                    <Badge variant="secondary">
                      {Array.isArray(table.schema_definition) ? table.schema_definition.length : 0}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <span className={table.is_active ? "text-green-600" : "text-red-600"}>
                      {table.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {tables.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Table2 className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">No content tables yet</p>
              <Button onClick={() => navigate(`/admin/content/sections/${sectionId}/tables/new`)}>
                <Plus className="mr-2 h-4 w-4" />
                Create your first table
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <TableReorderDialog
        open={reorderDialogOpen}
        onOpenChange={setReorderDialogOpen}
        onReorderComplete={fetchTables}
        sectionId={sectionId!}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Content Table</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{tableToDelete?.display_name}"? This will remove the table
              configuration but NOT the actual database table. This action cannot be undone.
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
