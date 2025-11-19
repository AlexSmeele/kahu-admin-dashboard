import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Database, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface SampleDataPreviewProps {
  tableName: string;
  columns?: string[];
  limit?: number;
}

export function SampleDataPreview({ tableName, columns, limit = 5 }: SampleDataPreviewProps) {
  const [loading, setLoading] = useState(false);
  const [sampleData, setSampleData] = useState<any[]>([]);
  const [rowCount, setRowCount] = useState(0);

  useEffect(() => {
    loadSampleData();
  }, [tableName, columns]);

  const loadSampleData = async () => {
    try {
      setLoading(true);

      // Get total row count (using any to handle dynamic table names)
      const { count, error: countError } = await (supabase as any)
        .from(tableName)
        .select('*', { count: 'exact', head: true });

      if (countError) throw countError;
      setRowCount(count || 0);

      // Get sample data (using any to handle dynamic table names)
      const { data, error } = await (supabase as any)
        .from(tableName)
        .select(columns?.join(',') || '*')
        .limit(limit);

      if (error) throw error;
      setSampleData(data || []);
    } catch (error: any) {
      console.error("Error loading sample data:", error);
      toast.error(`Failed to load sample data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading && sampleData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Sample Data Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <RefreshCw className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (sampleData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Sample Data Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No data found in this table
          </div>
        </CardContent>
      </Card>
    );
  }

  const displayColumns = columns || Object.keys(sampleData[0] || {});

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Sample Data Preview
            <Badge variant="secondary">{rowCount} total rows</Badge>
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={loadSampleData}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] w-full">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  {displayColumns.map((col) => (
                    <th
                      key={col}
                      className="p-2 text-left text-sm font-semibold bg-muted/50 sticky top-0"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sampleData.map((row, idx) => (
                  <tr key={idx} className="border-b hover:bg-muted/20">
                    {displayColumns.map((col) => (
                      <td key={col} className="p-2 text-sm max-w-[200px] truncate">
                        {formatCellValue(row[col])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ScrollArea>
        <div className="mt-2 text-xs text-muted-foreground">
          Showing {sampleData.length} of {rowCount} rows
        </div>
      </CardContent>
    </Card>
  );
}

function formatCellValue(value: any): string {
  if (value === null || value === undefined) {
    return 'NULL';
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }
  return String(value);
}
