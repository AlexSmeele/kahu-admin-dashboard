import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Eye } from "lucide-react";
import { toast } from "sonner";

interface Module {
  id: string;
  title: string;
  category: string;
  format: string;
  ideal_stage: string;
  estimated_minutes: number;
  is_published: boolean;
  order_index: number;
  created_at: string;
}

export default function AdminModules() {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadModules();
  }, []);

  const loadModules = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("foundation_modules")
        .select("*")
        .order("order_index", { ascending: true });

      if (error) throw error;
      setModules(data || []);
    } catch (error) {
      console.error("Error loading modules:", error);
      toast.error("Failed to load modules");
    } finally {
      setLoading(false);
    }
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
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Foundation Modules</h1>
          <p className="text-muted-foreground">Manage structured training programs and courses</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Module
        </Button>
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
                <TableHead className="text-right">Actions</TableHead>
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
              ) : (
                modules.map((module) => (
                  <TableRow key={module.id}>
                    <TableCell>{module.order_index}</TableCell>
                    <TableCell className="font-medium">{module.title}</TableCell>
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
                        onClick={() => togglePublished(module.id, module.is_published)}
                      >
                        <Badge variant={module.is_published ? "default" : "secondary"}>
                          {module.is_published ? "Published" : "Draft"}
                        </Badge>
                      </Button>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Pencil className="h-4 w-4" />
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
