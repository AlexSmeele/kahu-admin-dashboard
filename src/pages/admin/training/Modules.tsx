import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, ArrowUpDown } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { ModuleReorderDialog } from "@/components/admin/training/ModuleReorderDialog";

interface Module {
  id: string;
  name: string;
  category: string;
  format: string;
  ideal_stage: string;
  estimated_minutes: number;
  is_published: boolean;
  order_index: number;
  created_at: string;
}

export default function AdminModules() {
  const navigate = useNavigate();
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [reorderDialogOpen, setReorderDialogOpen] = useState(false);

  useEffect(() => {
    loadModules();
  }, [searchTerm]);

  const loadModules = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("foundation_modules")
        .select("*")
        .order("order_index", { ascending: true });

      if (searchTerm) {
        query = query.ilike("name", `%${searchTerm}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setModules(data || []);
    } catch (error) {
      console.error("Error loading modules:", error);
      toast.error("Failed to load modules");
    } finally {
      setLoading(false);
    }
  };

  const handleRowClick = (moduleId: string) => {
    navigate(`/admin/training/modules/${moduleId}`);
  };

  const togglePublished = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("foundation_modules")
        .update({ is_published: !currentStatus })
        .eq("id", id);

      if (error) throw error;

      toast.success(`Module ${!currentStatus ? "published" : "unpublished"} successfully`);
      loadModules();
    } catch (error) {
      console.error("Error toggling published status:", error);
      toast.error("Failed to update module");
    }
  };

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Foundation Modules</h1>
            <p className="text-muted-foreground">Manage structured training programs and courses</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setReorderDialogOpen(true)}>
              <ArrowUpDown className="mr-2 h-4 w-4" />
              Reorder
            </Button>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Module
            </Button>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search modules by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Modules Library</CardTitle>
          <CardDescription>Browse and manage all training modules</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Format</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center">
                    Loading modules...
                  </TableCell>
                </TableRow>
              ) : modules.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center">
                    No modules found
                  </TableCell>
                </TableRow>
              ) : modules.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">
                    No modules found
                  </TableCell>
                </TableRow>
              ) : (
                modules.map((module) => (
                  <TableRow 
                    key={module.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleRowClick(module.id)}
                  >
                    <TableCell>{module.order_index}</TableCell>
                    <TableCell className="font-medium">{module.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{module.category}</Badge>
                    </TableCell>
                    <TableCell className="capitalize">{module.format}</TableCell>
                    <TableCell className="capitalize">{module.ideal_stage}</TableCell>
                    <TableCell>{module.estimated_minutes} min</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          togglePublished(module.id, module.is_published);
                        }}
                      >
                        <Badge variant={module.is_published ? "default" : "secondary"}>
                          {module.is_published ? "Published" : "Draft"}
                        </Badge>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ModuleReorderDialog
        open={reorderDialogOpen}
        onOpenChange={setReorderDialogOpen}
        onReorderComplete={loadModules}
      />
    </div>
  );
}
