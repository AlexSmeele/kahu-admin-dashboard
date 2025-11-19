import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { UnifiedDataViewer, Column } from "@/components/admin/UnifiedDataViewer";
import { toast } from "sonner";

interface Treatment {
  id: string;
  dog_id: string;
  treatment_name: string;
  frequency_weeks: number;
  last_administered_date: string;
  next_due_date: string | null;
  notes: string | null;
  vet_clinic_id: string | null;
  created_at: string;
  updated_at: string;
}

export default function AdminTreatments() {
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchTreatments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("medical_treatments")
        .select("*")
        .order("treatment_name", { ascending: true });

      if (error) throw error;
      setTreatments(data || []);
    } catch (error) {
      console.error("Error fetching treatments:", error);
      toast.error("Failed to load treatments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTreatments();
  }, []);

  const columns: Column<Treatment>[] = [
    {
      key: "treatment_name",
      label: "Treatment Name",
      sortable: true,
      filterable: true,
    },
    {
      key: "frequency_weeks",
      label: "Frequency",
      sortable: true,
      render: (value) => `Every ${value} weeks`,
    },
    {
      key: "last_administered_date",
      label: "Last Administered",
      sortable: true,
      render: (value) => new Date(value).toLocaleDateString(),
    },
    {
      key: "next_due_date",
      label: "Next Due",
      sortable: true,
      render: (value) => value ? new Date(value).toLocaleDateString() : "N/A",
    },
    {
      key: "notes",
      label: "Notes",
      render: (value) => value || "—",
    },
  ];

  const handleAdd = () => {
    toast.info("Add treatment functionality coming soon");
  };

  const handleBulkDelete = async (records: Treatment[]) => {
    const ids = records.map(r => r.id);
    try {
      const { error } = await supabase
        .from("medical_treatments")
        .delete()
        .in("id", ids);

      if (error) throw error;
      toast.success(`Deleted ${ids.length} treatment record(s)`);
      fetchTreatments();
    } catch (error) {
      console.error("Error deleting treatments:", error);
      toast.error("Failed to delete treatments");
    }
  };

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Treatments & Medical</h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Manage preventive treatments and medical records
        </p>
      </div>

      <UnifiedDataViewer
        data={treatments}
        columns={columns}
        loading={loading}
        onAdd={handleAdd}
        onRefresh={fetchTreatments}
        onBulkDelete={handleBulkDelete}
        title="Treatment Records"
        description="Flea/tick, worming, and other preventive treatments"
      />
    </div>
  );
}
