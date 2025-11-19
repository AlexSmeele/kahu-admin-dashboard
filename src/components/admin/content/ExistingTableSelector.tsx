import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Database, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface TableOption {
  id: string;
  table_name: string;
  display_name: string;
  schema_definition: any;
}

interface TableSchema {
  columns: Array<{
    column_name: string;
    data_type: string;
    is_nullable: string;
    column_default: string | null;
  }>;
}

interface ExistingTableSelectorProps {
  sectionId: string;
  selectedTableId: string | null;
  selectedTableName: string | null;
  onTableSelect: (tableId: string, tableName: string, schema: TableSchema) => void;
}

export function ExistingTableSelector({
  sectionId,
  selectedTableId,
  selectedTableName,
  onTableSelect
}: ExistingTableSelectorProps) {
  const { toast } = useToast();
  const [tables, setTables] = useState<TableOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [introspecting, setIntrospecting] = useState(false);
  const [schema, setSchema] = useState<TableSchema | null>(null);

  const fetchTables = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('admin_content_tables')
        .select('id, table_name, display_name, schema_definition')
        .eq('section_id', sectionId)
        .eq('is_active', true)
        .order('display_name');

      if (error) throw error;
      setTables(data || []);
    } catch (error) {
      console.error('Error fetching tables:', error);
      toast({
        title: "Error",
        description: "Failed to fetch tables",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const introspectSchema = async (tableName: string) => {
    setIntrospecting(true);
    try {
      console.log('Introspecting schema for table:', tableName);
      
      const { data, error } = await supabase.functions.invoke('introspect-schema', {
        body: { tableName }
      });

      if (error) throw error;

      if (data?.error) {
        throw new Error(data.error);
      }

      console.log('Introspected schema:', data);
      setSchema(data);
      return data;
    } catch (error) {
      console.error('Error introspecting schema:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to introspect table schema",
        variant: "destructive",
      });
      return null;
    } finally {
      setIntrospecting(false);
    }
  };

  const handleTableChange = async (tableId: string) => {
    const selectedTable = tables.find(t => t.id === tableId);
    if (!selectedTable) return;

    const introspectedSchema = await introspectSchema(selectedTable.table_name);
    if (introspectedSchema) {
      onTableSelect(tableId, selectedTable.table_name, introspectedSchema);
    }
  };

  const handleRefresh = async () => {
    if (selectedTableName) {
      const introspectedSchema = await introspectSchema(selectedTableName);
      if (introspectedSchema && selectedTableId) {
        setSchema(introspectedSchema);
      }
    }
  };

  useEffect(() => {
    fetchTables();
  }, [sectionId]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading tables...
      </div>
    );
  }

  if (tables.length === 0) {
    return (
      <Alert>
        <Database className="h-4 w-4" />
        <AlertDescription>
          No existing tables found in this section. Please create a table first or import to a different section.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="existingTable">Select Existing Table *</Label>
        <Select
          value={selectedTableId || undefined}
          onValueChange={handleTableChange}
          disabled={introspecting}
        >
          <SelectTrigger id="existingTable">
            <SelectValue placeholder="Choose a table to import into..." />
          </SelectTrigger>
          <SelectContent>
            {tables.map((table) => (
              <SelectItem key={table.id} value={table.id}>
                <div className="flex items-center gap-2">
                  <span>{table.display_name}</span>
                  <code className="text-xs text-muted-foreground">({table.table_name})</code>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Select the table where you want to import your CSV data
        </p>
      </div>

      {introspecting && (
        <Alert>
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertDescription>
            Detecting table schema...
          </AlertDescription>
        </Alert>
      )}

      {schema && selectedTableName && !introspecting && (
        <Alert>
          <Database className="h-4 w-4" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <div>
                <strong>Table: {selectedTableName}</strong>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary">
                    {schema.columns.length} columns detected
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  Columns: {schema.columns.map(c => c.column_name).join(', ')}
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                disabled={introspecting}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
