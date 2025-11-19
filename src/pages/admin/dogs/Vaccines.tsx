import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { UnifiedDataViewer, Column } from "@/components/admin/UnifiedDataViewer";
import { toast } from "sonner";

interface Vaccine {
  id: string;
  name: string;
  vaccine_type: string;
  protects_against: string;
  schedule_info: string;
  puppy_start_weeks: number | null;
  frequency_months: number | null;
  booster_required: boolean;
  lifestyle_factors: string[] | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export default function AdminVaccines() {
  const [vaccines, setVaccines] = useState<Vaccine[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchVaccines = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("vaccines")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;
      setVaccines(data || []);
    } catch (error) {
      console.error("Error fetching vaccines:", error);
      toast.error("Failed to load vaccines");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVaccines();
  }, []);

  const columns: Column<Vaccine>[] = [
    {
      key: "name",
      label: "Vaccine Name",
      sortable: true,
      filterable: true,
    },
    {
      key: "vaccine_type",
      label: "Type",
      sortable: true,
      filterable: true,
      render: (value) => (
        <span className="capitalize">{value}</span>
      ),
    },
    {
      key: "protects_against",
      label: "Protects Against",
      sortable: true,
    },
    {
      key: "puppy_start_weeks",
      label: "Start Age (weeks)",
      sortable: true,
      render: (value) => value ? `${value} weeks` : "N/A",
    },
    {
      key: "frequency_months",
      label: "Frequency",
      sortable: true,
      render: (value) => value ? `Every ${value} months` : "N/A",
    },
    {
      key: "booster_required",
      label: "Booster Required",
      sortable: true,
      render: (value) => value ? "Yes" : "No",
    },
  ];

  const handleAdd = () => {
    toast.info("Add vaccine functionality coming soon");
  };

  const handleBulkDelete = async (records: Vaccine[]) => {
    const ids = records.map(r => r.id);
    try {
      const { error } = await supabase
        .from("vaccines")
        .delete()
        .in("id", ids);

      if (error) throw error;
      toast.success(`Deleted ${ids.length} vaccine(s)`);
      fetchVaccines();
    } catch (error) {
      console.error("Error deleting vaccines:", error);
      toast.error("Failed to delete vaccines");
    }
  };

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Vaccines</h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Manage vaccine information and schedules
        </p>
      </div>

      <UnifiedDataViewer
        data={vaccines}
        columns={columns}
        loading={loading}
        onAdd={handleAdd}
        onRefresh={fetchVaccines}
        onBulkDelete={handleBulkDelete}
        title="Vaccine Database"
        description="Core and lifestyle vaccines for dogs"
      />
    </div>
  );
}
