import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, Search, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SchemaField } from "@/components/admin/content/SchemaFieldEditor";

interface ContentTable {
  id: string;
  display_name: string;
  table_name: string;
  schema_definition: SchemaField[];
}

export default function DynamicContentManager() {
  const { sectionId, tableId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [contentTable, setContentTable] = useState<ContentTable | null>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<any>(null);

  useEffect(() => {
    fetchContentTable();
  }, [tableId]);

  useEffect(() => {
    if (contentTable) {
      fetchRecords();
    }
  }, [contentTable, searchTerm]);

  const fetchContentTable = async () => {
    try {
      const { data, error } = await supabase
        .from("admin_content_tables")
        .select("*")
        .eq("id", tableId)
        .single();

      if (error) throw error;
      setContentTable(data as any);
    } catch (error: any) {
      toast({
        title: "Error loading content table",
        description: error.message,
        variant: "destructive",
      });
      navigate(`/admin/content/sections/${sectionId}/tables`);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecords = async () => {
    if (!contentTable) return;

    try {
      let query = supabase
        .from(contentTable.table_name as any)
        .select('*')
        .order('created_at', { ascending: false });

      // Simple search across all text fields
      if (searchTerm) {
        const textFields = contentTable.schema_definition
          .filter(f => f.type === 'text')
          .map(f => f.name);
        
        if (textFields.length > 0) {
          query = query.or(
            textFields.map(field => `${field}.ilike.%${searchTerm}%`).join(',')
          );
        }
      }

      const { data, error } = await query;

      if (error) throw error;
      setRecords(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading records",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!recordToDelete || !contentTable) return;

    try {
      const { error } = await supabase
        .from(contentTable.table_name as any)
        .delete()
        .eq('id', recordToDelete.id);

      if (error) throw error;

      toast({
        title: "Record deleted",
        description: "The record has been deleted successfully.",
      });

      fetchRecords();
    } catch (error: any) {
      toast({
        title: "Error deleting record",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setRecordToDelete(null);
    }
  };

  const confirmDelete = (record: any) => {
    setRecordToDelete(record);
    setDeleteDialogOpen(true);
  };

  const renderCellValue = (field: SchemaField, value: any) => {
    if (value === null || value === undefined) {
      return <span className="text-muted-foreground italic">null</span>;
    }

    switch (field.type) {
      case 'boolean':
        return <Badge variant={value ? "default" : "secondary"}>{value ? 'Yes' : 'No'}</Badge>;
      case 'date':
        return new Date(value).toLocaleDateString();
      case 'datetime':
        return new Date(value).toLocaleString();
      case 'json':
      case 'text_array':
      case 'integer_array':
      case 'uuid_array':
      case 'jsonb_array':
        return (
          <pre className="text-xs max-w-[200px] overflow-hidden">
            {JSON.stringify(value).substring(0, 50)}...
          </pre>
        );
      case 'file_url':
        return (
          <a href={value} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            View
          </a>
        );
      default:
        const stringValue = String(value);
        return stringValue.length > 50 ? stringValue.substring(0, 50) + '...' : stringValue;
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  if (!contentTable) {
    return null;
  }

  // Get first 5 fields for table display
  const displayFields = contentTable.schema_definition.slice(0, 5);

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/admin/content/sections/${sectionId}/tables`)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold">{contentTable.display_name}</h1>
            <p className="text-sm md:text-base text-muted-foreground">
              Manage {contentTable.table_name} records
            </p>
          </div>
          <Button onClick={() => navigate(`/admin/content/sections/${sectionId}/tables/${tableId}/records/new`)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Record
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex-1">
                <CardTitle>Records</CardTitle>
                <CardDescription>
                  {records.length} record{records.length !== 1 ? 's' : ''} total
                </CardDescription>
              </div>
              <div className="flex-1 sm:max-w-sm relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search records..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    {displayFields.map((field) => (
                      <TableHead key={field.name}>{field.label}</TableHead>
                    ))}
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={displayFields.length + 1} className="text-center py-8 text-muted-foreground">
                        No records found
                      </TableCell>
                    </TableRow>
                  ) : (
                    records.map((record) => (
                      <TableRow key={record.id}>
                        {displayFields.map((field) => (
                          <TableCell key={field.name}>
                            {renderCellValue(field, record[field.name])}
                          </TableCell>
                        ))}
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => navigate(`/admin/content/sections/${sectionId}/tables/${tableId}/records/${record.id}`)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => confirmDelete(record)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Record</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this record? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
