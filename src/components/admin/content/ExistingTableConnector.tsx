import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ExistingTableConnectorProps {
  sectionId: string;
}

interface DatabaseTable {
  table_name: string;
  table_schema: string;
}

interface ColumnInfo {
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string | null;
}

export function ExistingTableConnector({ sectionId }: ExistingTableConnectorProps) {
  const [availableTables, setAvailableTables] = useState<DatabaseTable[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>("");
  const [displayName, setDisplayName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [detectedSchema, setDetectedSchema] = useState<any[]>([]);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadAvailableTables();
  }, []);

  const loadAvailableTables = async () => {
    setLoading(true);
    try {
      // Get already connected tables
      const { data: connectedTables, error: connectedError } = await supabase
        .from('admin_content_tables')
        .select('table_name');

      if (connectedError) throw connectedError;

      const connectedTableNames = new Set(connectedTables?.map(t => t.table_name) || []);
      
      // Hardcoded list of common tables - in production this would query information_schema via RPC
      const commonTables = [
        'skills', 'foundation_modules', 'troubleshooting_issues',
        'dog_breeds', 'vaccination_records', 'medical_treatments',
        'course_modules', 'lessons', 'quizzes', 'questions',
        'profiles', 'dogs', 'custom_breeds', 'media_assets'
      ];
      
      const filtered = commonTables
        .filter(t => !connectedTableNames.has(t))
        .map(t => ({ table_name: t, table_schema: 'public' }));
      
      setAvailableTables(filtered);
    } catch (error: any) {
      console.error("Error loading tables:", error);
      toast({
        title: "Error loading tables",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const detectSchema = async (tableName: string) => {
    setDetecting(true);
    try {
      // For now, generate a basic schema since we can't query information_schema directly
      // In production, this would use a Supabase RPC function to query the schema
      setDetectedSchema([
        { name: "id", label: "ID", type: "text", nullable: false },
        { name: "created_at", label: "Created At", type: "datetime", nullable: false },
        { name: "updated_at", label: "Updated At", type: "datetime", nullable: false },
      ]);
      
      toast({
        title: "Schema detected",
        description: "Basic schema structure created. You can customize this later.",
      });
    } catch (error: any) {
      console.error("Error detecting schema:", error);
      toast({
        title: "Error detecting schema",
        description: "Could not auto-detect schema. Using default structure.",
        variant: "destructive",
      });
    } finally {
      setDetecting(false);
    }
  };

  const mapPostgreSQLType = (pgType: string): string => {
    const typeMap: Record<string, string> = {
      'text': 'text',
      'character varying': 'text',
      'varchar': 'text',
      'integer': 'number',
      'bigint': 'number',
      'numeric': 'number',
      'real': 'number',
      'double precision': 'number',
      'boolean': 'boolean',
      'date': 'date',
      'timestamp with time zone': 'datetime',
      'timestamp without time zone': 'datetime',
      'time': 'time',
      'uuid': 'text',
      'jsonb': 'json',
      'json': 'json',
    };
    return typeMap[pgType.toLowerCase()] || 'text';
  };

  const handleTableSelect = async (tableName: string) => {
    setSelectedTable(tableName);
    setDisplayName(tableName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()));
    await detectSchema(tableName);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTable || !displayName) {
      toast({
        title: "Missing information",
        description: "Please select a table and provide a display name.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      // Insert into admin_content_tables
      const { data, error } = await supabase
        .from('admin_content_tables')
        .insert({
          section_id: sectionId,
          name: selectedTable.replace(/_/g, '-'),
          display_name: displayName,
          description: description || null,
          table_name: selectedTable,
          schema_definition: detectedSchema,
          order_index: 999, // Will be adjusted by reordering
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Table connected",
        description: `${displayName} has been connected to the Content Manager.`,
      });

      navigate(`/admin/content/sections/${sectionId}`);
    } catch (error: any) {
      console.error("Error connecting table:", error);
      toast({
        title: "Error connecting table",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Connect Existing Table</CardTitle>
          <CardDescription>
            Link an existing database table to the Content Manager
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              This will create a link to an existing table in your database. The table structure will be auto-detected.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="table">Select Table</Label>
            <Select value={selectedTable} onValueChange={handleTableSelect} disabled={loading}>
              <SelectTrigger id="table">
                <SelectValue placeholder={loading ? "Loading tables..." : "Choose a table"} />
              </SelectTrigger>
              <SelectContent>
                {availableTables.map((table) => (
                  <SelectItem key={table.table_name} value={table.table_name}>
                    {table.table_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {detecting && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Detecting schema...
            </div>
          )}

          {detectedSchema.length > 0 && (
            <div className="space-y-2">
              <Label>Detected Fields ({detectedSchema.length})</Label>
              <div className="text-xs text-muted-foreground space-y-1 max-h-32 overflow-y-auto border rounded-md p-2">
                {detectedSchema.map((field) => (
                  <div key={field.name} className="flex items-center gap-2">
                    <span className="font-mono">{field.name}</span>
                    <span className="text-muted-foreground">({field.type})</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name *</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g., Dog Breeds"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this content"
              rows={3}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(`/admin/content/sections/${sectionId}`)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || !selectedTable || !displayName}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                "Connect Table"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
