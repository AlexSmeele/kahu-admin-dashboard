import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { History, CheckCircle2, XCircle, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface MigrationHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tableId: string;
}

export function MigrationHistoryDialog({
  open,
  onOpenChange,
  tableId,
}: MigrationHistoryDialogProps) {
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      loadHistory();
    }
  }, [open, tableId]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('schema_migration_history')
        .select('*')
        .eq('table_id', tableId)
        .order('executed_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setHistory(data || []);
    } catch (error: any) {
      console.error("Error loading migration history:", error);
      toast.error(`Failed to load history: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Migration History
          </DialogTitle>
          <DialogDescription>
            View all schema changes made to this table
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[500px]">
          {loading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              Loading history...
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No migration history found
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((migration) => (
                <MigrationHistoryItem
                  key={migration.id}
                  migration={migration}
                  expanded={expandedId === migration.id}
                  onToggleExpand={() =>
                    setExpandedId(expandedId === migration.id ? null : migration.id)
                  }
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function MigrationHistoryItem({
  migration,
  expanded,
  onToggleExpand,
}: {
  migration: any;
  expanded: boolean;
  onToggleExpand: () => void;
}) {
  const changes = migration.changes as any[];
  const changeCount = changes?.length || 0;

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            {migration.success ? (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500" />
            )}
            <span className="font-semibold">{migration.migration_type}</span>
            <Badge variant="secondary">{changeCount} changes</Badge>
            {migration.affected_rows !== null && (
              <Badge variant="outline">{migration.affected_rows} rows affected</Badge>
            )}
          </div>
          <div className="text-sm text-muted-foreground">
            {format(new Date(migration.executed_at), 'PPpp')}
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onToggleExpand}>
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </div>

      {expanded && (
        <div className="space-y-3 pt-3 border-t">
          {!migration.success && migration.error_message && (
            <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded p-3">
              <div className="text-sm font-semibold text-red-900 dark:text-red-100 mb-1">
                Error:
              </div>
              <div className="text-sm text-red-800 dark:text-red-200">
                {migration.error_message}
              </div>
            </div>
          )}

          <div>
            <div className="text-sm font-semibold mb-2">Changes:</div>
            <div className="space-y-2">
              {changes?.map((change, idx) => (
                <div key={idx} className="text-sm bg-muted p-2 rounded">
                  <Badge className="mb-1">{change.type}</Badge>
                  <div className="ml-2">
                    <strong>{change.columnName}</strong>
                    {change.type === 'modify' && change.oldValue && change.newValue && (
                      <span className="text-muted-foreground">
                        {' '}
                        ({change.oldValue.type} → {change.newValue.type})
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {migration.sql_executed && (
            <div>
              <div className="text-sm font-semibold mb-2">SQL Executed:</div>
              <ScrollArea className="h-[200px] w-full">
                <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                  {migration.sql_executed}
                </pre>
              </ScrollArea>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
