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
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container max-w-7xl mx-auto px-4 md:px-8 py-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/admin/content/sections')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Sections
          </Button>
        </div>
      </div>

      <div className="container max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-8">
        {/* Header Section */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{section.display_name}</h1>
                <Badge variant={section.is_active ? "default" : "secondary"}>
                  {section.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
              {section.description && (
                <p className="text-muted-foreground text-base md:text-lg">{section.description}</p>
              )}
            </div>
            <Button onClick={() => navigate(`/admin/content/sections/${sectionId}/tables/new`)} size="lg">
              <Plus className="h-4 w-4 mr-2" />
              Create Table
            </Button>
          </div>
        </div>

        {/* Content Tables Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold tracking-tight">
              Content Tables
              <span className="ml-2 text-muted-foreground font-normal">({tables.length})</span>
            </h2>
          </div>

          {tables.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                  <TableIcon className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No tables yet</h3>
                <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                  Get started by creating your first content table
                </p>
                <Button onClick={() => navigate(`/admin/content/sections/${sectionId}/tables/new`)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Table
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {tables.map((table) => (
                <Card key={table.id} className="group hover:shadow-lg hover:border-primary/20 transition-all duration-200">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                          <TableIcon className="h-4 w-4" />
                        </div>
                        <span className="line-clamp-1">{table.display_name}</span>
                      </CardTitle>
                      <Badge variant={table.is_active ? "default" : "secondary"} className="shrink-0">
                        {table.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    {table.description && (
                      <CardDescription className="line-clamp-2 mt-2">
                        {table.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-muted/50 text-sm">
                      <div>
                        <div className="text-muted-foreground mb-1">Table</div>
                        <code className="text-xs font-mono bg-background px-2 py-1 rounded border">
                          {table.table_name}
                        </code>
                      </div>
                      <div>
                        <div className="text-muted-foreground mb-1">Fields</div>
                        <div className="font-semibold">{(table.schema_definition as any[]).length}</div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 pt-2">
                      <Button 
                        size="sm" 
                        className="w-full"
                        onClick={() => navigate(`/admin/content/sections/${sectionId}/tables/${table.id}/records`)}
                      >
                        Manage Data
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="w-full"
                        onClick={() => navigate(`/admin/content/sections/${sectionId}/tables/new?tableId=${table.id}`)}
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
    </div>
  );
}
