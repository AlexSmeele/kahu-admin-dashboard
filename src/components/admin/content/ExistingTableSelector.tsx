import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Database, RefreshCw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface DatabaseTable {
  table_name: string;
  table_schema: string;
  table_comment?: string;
  estimated_rows?: number;
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
  sectionId?: string;
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
  const [tables, setTables] = useState<DatabaseTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [introspecting, setIntrospecting] = useState(false);
  const [schema, setSchema] = useState<TableSchema | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchTables = async () => {
    setLoading(true);
    try {
      console.log('Fetching all database tables...');
      
      const { data, error } = await supabase.functions.invoke('list-tables');

      if (error) throw error;

      if (data?.error) {
        throw new Error(data.error);
      }

      console.log('Database tables fetched:', data);
      setTables(data.tables || []);
    } catch (error) {
      console.error('Error fetching tables:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch tables",
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

  const handleTableChange = async (tableName: string) => {
    const selectedTable = tables.find(t => t.table_name === tableName);
    if (!selectedTable) return;

    const introspectedSchema = await introspectSchema(selectedTable.table_name);
    if (introspectedSchema) {
      onTableSelect(tableName, selectedTable.table_name, introspectedSchema);
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
  }, []);

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
          No tables found in the database. Please create a table first.
        </AlertDescription>
      </Alert>
    );
  }

  // Filter tables by search term
  const filteredTables = tables.filter(t => 
    t.table_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="tableSearch">Search Tables</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="tableSearch"
            type="text"
            placeholder="Search by table name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          {filteredTables.length} of {tables.length} tables
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="existingTable">Select Existing Table *</Label>
        <Select
          value={selectedTableName || undefined}
          onValueChange={handleTableChange}
          disabled={introspecting}
        >
          <SelectTrigger id="existingTable">
            <SelectValue placeholder="Choose a table to import into..." />
          </SelectTrigger>
          <SelectContent>
            {filteredTables.map((table) => (
              <SelectItem key={table.table_name} value={table.table_name}>
                <div className="flex items-center gap-2">
                  <code className="text-sm font-mono">{table.table_name}</code>
                  {table.estimated_rows !== undefined && table.estimated_rows > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      ~{table.estimated_rows.toLocaleString()} rows
                    </Badge>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Select any table in the database to import your CSV data
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
