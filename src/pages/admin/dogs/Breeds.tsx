import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { UnifiedDataViewer } from "@/components/admin/UnifiedDataViewer";

interface Breed {
  id: string;
  breed: string;
  origin: string | null;
  temperament: string | null;
  exercise_needs: string | null;
  grooming_needs: string | null;
  life_span_years: string | null;
  fci_group: number | null;
}

export default function AdminBreeds() {
  const [breeds, setBreeds] = useState<Breed[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBreeds();
  }, []);

  const loadBreeds = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("dog_breeds")
        .select("id, breed, origin, temperament, exercise_needs, grooming_needs, life_span_years, fci_group")
        .order("breed", { ascending: true });

      if (error) throw error;
      setBreeds(data || []);
    } catch (error) {
      console.error("Error loading breeds:", error);
      toast.error("Failed to load breeds");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8">
      <UnifiedDataViewer
        title="Dog Breeds"
        description="Manage breed information and characteristics"
        data={breeds}
        loading={loading}
        columns={[
          {
            key: 'breed',
            label: 'Breed Name',
            sortable: true,
            minWidth: 200,
          },
          {
            key: 'origin',
            label: 'Origin',
            sortable: true,
            width: 150,
            render: (val) => val || '-',
          },
          {
            key: 'fci_group',
            label: 'FCI Group',
            sortable: true,
            width: 100,
            render: (val) => val ? `Group ${val}` : '-',
          },
          {
            key: 'exercise_needs',
            label: 'Exercise Needs',
            sortable: true,
            width: 140,
            render: (val) => val ? (
              <Badge variant="secondary" className="capitalize">
                {val}
              </Badge>
            ) : '-',
          },
          {
            key: 'grooming_needs',
            label: 'Grooming',
            sortable: true,
            width: 120,
            render: (val) => val ? (
              <Badge variant="outline" className="capitalize">
                {val}
              </Badge>
            ) : '-',
          },
          {
            key: 'life_span_years',
            label: 'Life Span',
            sortable: true,
            width: 110,
            render: (val) => val ? `${val} years` : '-',
          },
          {
            key: 'temperament',
            label: 'Temperament',
            render: (val) => (
              <span className="text-sm text-muted-foreground line-clamp-2">
                {val || '-'}
              </span>
            ),
          },
        ]}
        onRowClick={(breed) => console.log('View breed:', breed.id)}
        onAdd={() => console.log('Add breed')}
        onRefresh={loadBreeds}
        onExport={() => {}}
        enableSearch
        enableViews
        enablePagination
        searchPlaceholder="Search breeds..."
        defaultView="table"
        pageSize={50}
      />
    </div>
  );
}
