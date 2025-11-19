import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { ModuleReorderDialog } from "@/components/admin/training/ModuleReorderDialog";
import { UnifiedDataViewer } from "@/components/admin/UnifiedDataViewer";
import { Switch } from "@/components/ui/switch";

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
  const [reorderDialogOpen, setReorderDialogOpen] = useState(false);

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

  const togglePublished = async (id: string, currentStatus: boolean, event: React.MouseEvent) => {
    event.stopPropagation();
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
      <UnifiedDataViewer
        title="Foundation Modules"
        description="Manage training modules and learning content"
        data={modules}
        loading={loading}
        columns={[
          {
            key: 'order_index',
            label: 'Order',
            sortable: true,
            width: 80,
          },
          {
            key: 'name',
            label: 'Module Name',
            sortable: true,
            minWidth: 200,
          },
          {
            key: 'category',
            label: 'Category',
            sortable: true,
            filterable: true,
            width: 150,
            render: (val) => (
              <Badge variant="secondary" className="capitalize">
                {val}
              </Badge>
            ),
          },
          {
            key: 'format',
            label: 'Format',
            sortable: true,
            width: 120,
            render: (val) => (
              <Badge variant="outline" className="capitalize">
                {val}
              </Badge>
            ),
          },
          {
            key: 'ideal_stage',
            label: 'Stage',
            sortable: true,
            width: 130,
            render: (val) => (
              <span className="text-sm capitalize">{val?.replace('_', ' ')}</span>
            ),
          },
          {
            key: 'estimated_minutes',
            label: 'Duration',
            sortable: true,
            width: 100,
            render: (val) => `${val} min`,
          },
          {
            key: 'is_published',
            label: 'Published',
            sortable: true,
            width: 100,
            render: (val, record) => (
              <Switch
                checked={val}
                onCheckedChange={(checked) => togglePublished(record.id, val, {} as any)}
                onClick={(e) => e.stopPropagation()}
              />
            ),
          },
        ]}
        onRowClick={(module) => navigate(`/admin/training/modules/${module.id}`)}
        onAdd={() => navigate('/admin/training/modules/new')}
        onReorder={() => setReorderDialogOpen(true)}
        onRefresh={loadModules}
        onExport={() => {}}
        enableSearch
        enableViews
        enablePagination
        searchPlaceholder="Search modules..."
        defaultView="table"
        pageSize={20}
      />

      <ModuleReorderDialog
        open={reorderDialogOpen}
        onOpenChange={setReorderDialogOpen}
        onReorderComplete={loadModules}
      />
    </div>
  );
}
