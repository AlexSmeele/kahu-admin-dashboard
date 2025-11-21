import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { UnifiedDataViewer, Column } from "@/components/admin/UnifiedDataViewer";
import { toast } from "sonner";

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
  linked_skill_ids: string[] | null;
  linked_module_ids: string[] | null;
  media_urls: string[] | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export default function AdminTroubleshooting() {
  const [issues, setIssues] = useState<TroubleshootingIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchIssues = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("troubleshooting_issues" as any)
        .select("*")
        .order("category", { ascending: true })
        .order("issue_name", { ascending: true });

      if (error) throw error;
      setIssues((data as any) || []);
    } catch (error) {
      console.error("Error fetching troubleshooting issues:", error);
      toast.error("Failed to load troubleshooting issues");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, []);

  const columns: Column<TroubleshootingIssue>[] = [
    {
      key: "issue_name",
      label: "Issue Name",
      sortable: true,
      filterable: true,
    },
    {
      key: "category",
      label: "Category",
      sortable: true,
      filterable: true,
      render: (value) => (
        <span className="capitalize">{value}</span>
      ),
    },
    {
      key: "severity",
      label: "Severity",
      sortable: true,
      filterable: true,
      render: (value) => {
        const colors = {
          low: "text-green-600",
          medium: "text-yellow-600",
          high: "text-red-600",
        };
        return (
          <span className={`capitalize font-medium ${colors[value as keyof typeof colors] || ""}`}>
            {value}
          </span>
        );
      },
    },
    {
      key: "problem_description",
      label: "Description",
      render: (value) => (
        <div className="max-w-md truncate">{value}</div>
      ),
    },
    {
      key: "is_published",
      label: "Published",
      sortable: true,
      render: (value) => value ? "✓" : "—",
    },
  ];

  const handleAdd = () => {
    toast.info("Add troubleshooting issue functionality coming soon");
  };

  const handleBulkDelete = async (records: TroubleshootingIssue[]) => {
    const ids = records.map(r => r.id);
    try {
      const { error } = await supabase
        .from("troubleshooting_issues" as any)
        .delete()
        .in("id", ids);

      if (error) throw error;
      toast.success(`Deleted ${ids.length} issue(s)`);
      fetchIssues();
    } catch (error) {
      console.error("Error deleting issues:", error);
      toast.error("Failed to delete issues");
    }
  };

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Troubleshooting Library</h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Manage behavior issues and evidence-based solutions
        </p>
      </div>

      <UnifiedDataViewer
        data={issues}
        columns={columns}
        loading={loading}
        onAdd={handleAdd}
        onRefresh={fetchIssues}
        onBulkDelete={handleBulkDelete}
        title="Behavior Issues"
        description="Common problems and evidence-based solutions"
      />
    </div>
  );
}

