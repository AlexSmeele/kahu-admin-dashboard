import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, Search, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { MediaUploadDialog } from "@/components/admin/media/MediaUploadDialog";
import { MediaCard } from "@/components/admin/media/MediaCard";

export default function AdminMedia() {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: mediaAssets, isLoading } = useQuery({
    queryKey: ["media-assets", searchTerm],
    queryFn: async () => {
      let query = supabase
        .from("media_assets")
        .select("*")
        .order("created_at", { ascending: false });

      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const media = mediaAssets?.find((m) => m.id === id);
      if (!media) throw new Error("Media not found");

      const { error: storageError } = await supabase.storage
        .from("media-assets")
        .remove([media.file_path]);

      if (storageError) throw storageError;

      const { error: dbError } = await supabase
        .from("media_assets")
        .delete()
        .eq("id", id);

      if (dbError) throw dbError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["media-assets"] });
      toast({
        title: "Media deleted",
        description: "The media has been removed from the library",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Media Library</h1>
          <p className="text-muted-foreground">Manage training videos and images</p>
        </div>
        <Button onClick={() => setUploadDialogOpen(true)}>
          <Upload className="mr-2 h-4 w-4" />
          Upload Media
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Search Media</CardTitle>
          <CardDescription>Filter by title or description</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search media..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : mediaAssets && mediaAssets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {mediaAssets.map((media) => (
            <MediaCard
              key={media.id}
              media={media}
              onDelete={(id) => deleteMutation.mutate(id)}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              {searchTerm ? "No media found matching your search" : "No media assets yet. Upload some to get started!"}
            </p>
          </CardContent>
        </Card>
      )}

      <MediaUploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        onUploadComplete={() => queryClient.invalidateQueries({ queryKey: ["media-assets"] })}
      />
    </div>
  );
}
