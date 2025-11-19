import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Table as TableIcon, Upload, Plus, Edit, Trash2, ArrowUpDown, RefreshCw, CheckCircle, AlertTriangle, MoreVertical, Database } from "lucide-react";
import { IconPicker } from "@/components/admin/content/IconPicker";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { TableReorderDialog } from "@/components/admin/content/TableReorderDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function SectionDetail() {
  const { sectionId } = useParams();
  const navigate = useNavigate();
  const [section, setSection] = useState<any>(null);
  const [tables, setTables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedSection, setEditedSection] = useState<any>(null);
  const [firstDeleteDialogOpen, setFirstDeleteDialogOpen] = useState(false);
  const [secondDeleteDialogOpen, setSecondDeleteDialogOpen] = useState(false);
  const [reorderDialogOpen, setReorderDialogOpen] = useState(false);
  const [resettingConnection, setResettingConnection] = useState<string | null>(null);

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

  const handleEditClick = () => {
    setEditedSection({ ...section });
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedSection(null);
  };

  const handleSaveEdit = async () => {
    try {
      const { error } = await supabase
        .from('admin_sections')
        .update({
          display_name: editedSection.display_name,
          name: editedSection.name,
          description: editedSection.description,
          icon: editedSection.icon,
          is_active: editedSection.is_active,
        })
        .eq('id', sectionId);

      if (error) throw error;

      toast.success("Section updated successfully");
      setSection(editedSection);
      setIsEditing(false);
      setEditedSection(null);
    } catch (error: any) {
      console.error("Error:", error);
      toast.error(`Failed to update section: ${error.message}`);
    }
  };

  const handleFirstDeleteConfirm = () => {
    setFirstDeleteDialogOpen(false);
    setSecondDeleteDialogOpen(true);
  };

  const handleFinalDelete = async () => {
    try {
      const { error } = await supabase
        .from('admin_sections')
        .delete()
        .eq('id', sectionId);

      if (error) throw error;

      toast.success("Section deleted successfully");
      navigate('/admin/content/sections');
    } catch (error: any) {
      console.error("Error:", error);
      toast.error(`Failed to delete section: ${error.message}`);
    } finally {
      setSecondDeleteDialogOpen(false);
    }
  };

  const handleResetConnection = async (tableId: string) => {
    const table = tables.find(t => t.id === tableId);
    if (!table) return;

    setResettingConnection(tableId);
    try {
      // Call introspect-schema to get fresh database schema
      const { data: introspectData, error: introspectError } = await supabase.functions.invoke('introspect-schema', {
        body: { tableName: table.table_name }
      });

      if (introspectError) throw introspectError;
      if (!introspectData?.columns) throw new Error("No columns returned from introspection");

      // Map database columns to schema fields
      const schemaFields = introspectData.columns.map((col: any, index: number) => ({
        id: crypto.randomUUID(),
        name: col.column_name,
        label: col.column_name.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
        type: mapPostgreSQLType(col.data_type),
        nullable: col.is_nullable === 'YES',
        required: col.is_nullable === 'NO',
        unique: false,
        defaultValue: col.column_default || '',
        description: '',
        order: index,
      }));

      // Update schema_definition
      const { error: updateError } = await supabase
        .from('admin_content_tables')
        .update({ schema_definition: schemaFields as any })
        .eq('id', tableId);

      if (updateError) throw updateError;

      toast.success(`Connection reset successfully for "${table.display_name}"`, {
        description: `Synced ${schemaFields.length} columns from database.`
      });

      // Refresh the tables list
      await fetchSectionAndTables();
    } catch (error: any) {
      console.error("Error resetting connection:", error);
      toast.error("Failed to reset connection", {
        description: error.message
      });
    } finally {
      setResettingConnection(null);
    }
  };

  const handleDeleteConnection = async (tableId: string) => {
    const table = tables.find(t => t.id === tableId);
    if (!table) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete the connection to "${table.display_name}"?\n\n` +
      `This will remove the table from the Content Manager but will NOT delete the actual database table "${table.table_name}".`
    );

    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from('admin_content_tables')
        .delete()
        .eq('id', tableId);

      if (error) throw error;

      toast.success(`Connection deleted for "${table.display_name}"`, {
        description: "The database table remains intact."
      });

      // Refresh the tables list
      await fetchSectionAndTables();
    } catch (error: any) {
      console.error("Error deleting connection:", error);
      toast.error("Failed to delete connection", {
        description: error.message
      });
    }
  };

  const mapPostgreSQLType = (pgType: string): string => {
    const typeMap: Record<string, string> = {
      'text': 'text',
      'character varying': 'text',
      'varchar': 'text',
      'integer': 'integer',
      'bigint': 'bigint',
      'numeric': 'number',
      'real': 'number',
      'double precision': 'number',
      'boolean': 'boolean',
      'date': 'date',
      'timestamp with time zone': 'datetime',
      'timestamp without time zone': 'datetime',
      'time': 'time',
      'uuid': 'uuid',
      'jsonb': 'json',
      'json': 'json',
      'text[]': 'text_array',
      'integer[]': 'integer_array',
      'uuid[]': 'uuid_array',
      'jsonb[]': 'jsonb_array',
    };
    return typeMap[pgType.toLowerCase()] || 'text';
  };

  const getSchemaStatus = (table: any) => {
    const schema = table.schema_definition;
    if (Array.isArray(schema) && schema.length > 0) {
      return { valid: true, label: 'Connected', variant: 'default' as const };
    }
    return { valid: false, label: 'Invalid Schema', variant: 'destructive' as const };
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
          {!isEditing ? (
            <>
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
                  <div className="mt-2 text-sm text-muted-foreground">
                    <span className="font-mono bg-muted px-2 py-1 rounded">System name: {section.name}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleEditClick} variant="outline" size="lg">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Section
                  </Button>
                  <Button onClick={() => navigate(`/admin/content/sections/${sectionId}/tables/new`)} size="lg">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Table
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Edit Section</CardTitle>
                <CardDescription>Update section information and settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="display_name">Display Name</Label>
                    <Input
                      id="display_name"
                      value={editedSection.display_name}
                      onChange={(e) => setEditedSection({ ...editedSection, display_name: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="name">System Name</Label>
                    <Input
                      id="name"
                      value={editedSection.name}
                      onChange={(e) => setEditedSection({ ...editedSection, name: e.target.value })}
                      placeholder="lowercase-with-dashes"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={editedSection.description || ""}
                      onChange={(e) => setEditedSection({ ...editedSection, description: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="icon">Icon</Label>
                    <IconPicker
                      value={editedSection.icon}
                      onChange={(iconName) => setEditedSection({ ...editedSection, icon: iconName })}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_active"
                      checked={editedSection.is_active}
                      onCheckedChange={(checked) => setEditedSection({ ...editedSection, is_active: checked })}
                    />
                    <Label htmlFor="is_active">Active</Label>
                  </div>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button onClick={handleSaveEdit} className="flex-1">
                    Save Changes
                  </Button>
                  <Button onClick={handleCancelEdit} variant="outline" className="flex-1">
                    Cancel
                  </Button>
                  <Button
                    onClick={() => setFirstDeleteDialogOpen(true)}
                    variant="destructive"
                    size="icon"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Content Tables Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold tracking-tight">
              Content Tables
              <span className="ml-2 text-muted-foreground font-normal">({tables.length})</span>
            </h2>
            {tables.length > 0 && (
              <Button 
                onClick={() => setReorderDialogOpen(true)} 
                variant="outline" 
                size="sm"
                className="gap-2"
              >
                <ArrowUpDown className="h-4 w-4" />
                Reorder Tables
              </Button>
            )}
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
                <Card key={table.id} className="group hover:shadow-lg hover:border-primary/20 transition-all duration-200 overflow-hidden flex flex-col min-h-[380px]">
                  {/* Header with Icon and Status */}
                  <div className="relative bg-gradient-to-br from-primary/5 to-primary/10 px-6 pt-6 pb-4">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="p-3 rounded-xl bg-background shadow-sm border">
                          <TableIcon className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 
                            className="text-lg font-semibold leading-tight truncate mb-1" 
                            title={table.display_name}
                          >
                            {table.display_name}
                          </h3>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="px-2 py-0.5 rounded-md bg-muted font-mono">
                              #{table.order_index}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-start gap-2 flex-wrap">
                        {(() => {
                          const status = getSchemaStatus(table);
                          return (
                            <Badge 
                              variant={status.variant}
                              className="shrink-0 shadow-sm whitespace-nowrap"
                            >
                              {status.valid ? (
                                <CheckCircle className="h-3 w-3 mr-1" />
                              ) : (
                                <AlertTriangle className="h-3 w-3 mr-1" />
                              )}
                              {status.label}
                            </Badge>
                          );
                        })()}
                        <Badge 
                          variant={table.is_active ? "default" : "secondary"} 
                          className="shrink-0 shadow-sm whitespace-nowrap"
                        >
                          {table.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                    {table.description && (
                      <p 
                        className="text-sm text-muted-foreground line-clamp-2 leading-relaxed min-h-[2.5rem]" 
                        title={table.description}
                      >
                        {table.description}
                      </p>
                    )}
                    {!table.description && (
                      <div className="min-h-[2.5rem]" />
                    )}
                  </div>

                  <CardContent className="space-y-4 p-6 flex flex-col flex-1">
                    {/* Metadata Grid */}
                    <div className="grid grid-cols-2 gap-3 flex-1">
                      <div className="space-y-1.5">
                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Table Name
                        </div>
                        <code 
                          className="block text-xs font-mono bg-muted px-2.5 py-1.5 rounded border text-foreground break-words max-w-full overflow-x-auto" 
                          title={table.table_name}
                        >
                          {table.table_name}
                        </code>
                      </div>
                      <div className="space-y-1.5">
                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Fields
                        </div>
                        <div className="flex items-center gap-2 px-2.5 py-1.5 bg-muted rounded border">
                          <span className="text-2xl font-bold text-foreground">
                            {(table.schema_definition as any[]).length}
                          </span>
                          <span className="text-xs text-muted-foreground">fields</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2">
                      <Button 
                        size="default" 
                        className="flex-1 shadow-sm"
                        onClick={() => navigate(`/admin/content/sections/${sectionId}/tables/${table.id}/records`)}
                      >
                        <TableIcon className="h-4 w-4 mr-2" />
                        Manage Data
                      </Button>
                      <Button 
                        size="default" 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => navigate(`/admin/content/sections/${sectionId}/tables/${table.id}/edit`)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Schema
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            onClick={() => handleResetConnection(table.id)}
                            disabled={resettingConnection === table.id}
                            className="text-yellow-600 dark:text-yellow-400"
                          >
                            <RefreshCw className={`h-4 w-4 mr-2 ${resettingConnection === table.id ? 'animate-spin' : ''}`} />
                            Reset Connection
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDeleteConnection(table.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Connection
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* First Delete Confirmation */}
      <AlertDialog open={firstDeleteDialogOpen} onOpenChange={setFirstDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Section?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{section.display_name}"? This will also delete all content
              tables within this section.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleFirstDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Yes, Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Second Delete Confirmation */}
      <AlertDialog open={secondDeleteDialogOpen} onOpenChange={setSecondDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the section and all its content tables
              from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleFinalDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Permanently Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <TableReorderDialog
        open={reorderDialogOpen}
        onOpenChange={setReorderDialogOpen}
        onReorderComplete={fetchSectionAndTables}
        sectionId={sectionId as string}
      />
    </div>
  );
}
