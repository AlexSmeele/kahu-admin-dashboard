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
import { ScrollArea } from "@/components/ui/scroll-area";
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
  const [sortField, setSortField] = useState<keyof Module | null>("order_index");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

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

  const handleSort = (field: keyof Module) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const sortedModules = [...modules].sort((a, b) => {
    if (!sortField) return 0;

    const aValue = a[sortField];
    const bValue = b[sortField];

    if (aValue == null && bValue == null) return 0;
    if (aValue == null) return sortDirection === "asc" ? 1 : -1;
    if (bValue == null) return sortDirection === "asc" ? -1 : 1;

    if (typeof aValue === "number" && typeof bValue === "number") {
      return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
    }

    if (typeof aValue === "boolean" && typeof bValue === "boolean") {
      return sortDirection === "asc" ? (aValue ? 1 : -1) : (bValue ? 1 : -1);
    }

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
          <h1 className="text-2xl md:text-3xl font-bold">Foundation Modules</h1>
          <p className="text-sm md:text-base text-muted-foreground">Manage structured training programs and courses</p>
        </div>
        <div className="flex flex-row gap-2">
          <Button variant="outline" onClick={() => setReorderDialogOpen(true)} className="flex-1 sm:flex-none sm:w-auto">
            <ArrowUpDown className="mr-2 h-4 w-4" />
            Reorder Modules
          </Button>
          <Button className="flex-1 sm:flex-none sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Add Module
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="text-base md:text-lg">Modules Library</CardTitle>
          <CardDescription className="text-xs md:text-sm">
            Click on a module to view and edit details
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
          <div className="mb-3 md:mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search modules by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
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
                      onClick={() => handleSort("order_index")}
                    >
                      <div className="flex items-center gap-1">
                        Order
                        <ArrowUpDown className={`h-3 w-3 ${sortField === "order_index" ? "text-primary" : "text-muted-foreground"}`} />
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort("name")}
                    >
                      <div className="flex items-center gap-1">
                        Title
                        <ArrowUpDown className={`h-3 w-3 ${sortField === "name" ? "text-primary" : "text-muted-foreground"}`} />
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort("category")}
                    >
                      <div className="flex items-center gap-1">
                        Category
                        <ArrowUpDown className={`h-3 w-3 ${sortField === "category" ? "text-primary" : "text-muted-foreground"}`} />
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort("format")}
                    >
                      <div className="flex items-center gap-1">
                        Format
                        <ArrowUpDown className={`h-3 w-3 ${sortField === "format" ? "text-primary" : "text-muted-foreground"}`} />
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort("ideal_stage")}
                    >
                      <div className="flex items-center gap-1">
                        Stage
                        <ArrowUpDown className={`h-3 w-3 ${sortField === "ideal_stage" ? "text-primary" : "text-muted-foreground"}`} />
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort("estimated_minutes")}
                    >
                      <div className="flex items-center gap-1">
                        Duration
                        <ArrowUpDown className={`h-3 w-3 ${sortField === "estimated_minutes" ? "text-primary" : "text-muted-foreground"}`} />
                      </div>
                    </TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedModules.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground">
                        No modules found
                      </TableCell>
                    </TableRow>
                  ) : (
                    sortedModules.map((module) => (
                      <TableRow 
                        key={module.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleRowClick(module.id)}
                      >
                        <TableCell>
                          <Badge variant="secondary" className="w-10 justify-center">
                            {module.order_index}
                          </Badge>
                        </TableCell>
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
            </ScrollArea>
          )}
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
