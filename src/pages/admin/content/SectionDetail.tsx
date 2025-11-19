import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Table as TableIcon, Upload, Plus } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export default function SectionDetail() {
  const { sectionId } = useParams();
  const navigate = useNavigate();
  const [section, setSection] = useState<any>(null);
  const [tables, setTables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <div className="p-8">Loading...</div>;
  if (!section) return <div className="p-8">Section not found</div>;

  return (
    <div className="p-4 md:p-8 space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate('/admin/content/sections')}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Sections
      </Button>

      <div>
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold">{section.display_name}</h1>
          <Badge variant={section.is_active ? "default" : "secondary"}>
            {section.is_active ? "Active" : "Inactive"}
          </Badge>
        </div>
        {section.description && <p className="text-muted-foreground">{section.description}</p>}
      </div>

      <div className="flex flex-wrap gap-4">
        <Button onClick={() => navigate(`/admin/content/sections/${sectionId}/tables/new`)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Table
        </Button>
        <Button variant="outline" onClick={() => navigate(`/admin/content/sections/${sectionId}/import`)}>
          <Upload className="h-4 w-4 mr-2" />
          Import CSV
        </Button>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Content Tables ({tables.length})</h2>
        {tables.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground mb-4">No tables created yet</p>
              <Button onClick={() => navigate(`/admin/content/sections/${sectionId}/tables/new`)}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Table
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {tables.map((table) => (
              <Card key={table.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TableIcon className="h-5 w-5" />
                    {table.display_name}
                  </CardTitle>
                  {table.description && <CardDescription>{table.description}</CardDescription>}
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 mb-4">
                    <div className="text-sm text-muted-foreground">
                      Table: <code className="text-xs bg-muted px-1 py-0.5 rounded">{table.table_name}</code>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Fields: {(table.schema_definition as any[]).length}
                    </div>
                    <Badge variant={table.is_active ? "default" : "secondary"} className="text-xs">
                      {table.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button 
                      size="sm" 
                      className="w-full"
                      onClick={() => navigate(`/admin/content/sections/${sectionId}/tables/${table.id}/manage`)}
                    >
                      Manage Data
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="w-full"
                      onClick={() => navigate(`/admin/content/sections/${sectionId}/tables/${table.id}`)}
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
  );
}
