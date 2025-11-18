import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Upload, Search, Pencil, Trash2, Image, Video, FileText, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface MediaAsset {
  id: string;
  title: string;
  description: string | null;
  media_type: string;
  file_path: string;
  file_url: string;
  mime_type: string | null;
  file_size_bytes: number | null;
  duration_seconds: number | null;
  tags: string[];
  thumbnail_url: string | null;
  is_published: boolean;
  created_at: string;
}

export default function AdminMedia() {
  const [media, setMedia] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    media_type: "image",
    tags: "",
    is_published: true,
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const { toast } = useToast();

  useEffect(() => {
    loadMedia();
  }, []);

  const loadMedia = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from("media_assets")
        .select("*")
        .order("created_at", { ascending: false });

      if (filterType !== "all") {
        query = query.eq("media_type", filterType);
      }

      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setMedia(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading media",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      
      // Auto-detect media type
      if (file.type.startsWith("image/")) {
        setFormData(prev => ({ ...prev, media_type: "image" }));
      } else if (file.type.startsWith("video/")) {
        setFormData(prev => ({ ...prev, media_type: "video" }));
      } else {
        setFormData(prev => ({ ...prev, media_type: "document" }));
      }
    }
  };

  const uploadFile = async (file: File): Promise<{ path: string; url: string }> => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
    const filePath = `media/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("dog-photos")
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from("dog-photos")
      .getPublicUrl(filePath);

    return { path: filePath, url: publicUrl };
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast({
        title: "Validation Error",
        description: "Title is required",
        variant: "destructive",
      });
      return;
    }

    if (!editingId && !selectedFile) {
      toast({
        title: "Validation Error",
        description: "Please select a file to upload",
        variant: "destructive",
      });
      return;
    }

    try {
      setUploading(true);
      
      let fileData = { path: "", url: "" };
      
      if (selectedFile) {
        fileData = await uploadFile(selectedFile);
      }

      const tags = formData.tags
        .split(",")
        .map(t => t.trim())
        .filter(t => t.length > 0);

      if (editingId) {
        const updateData: any = {
          title: formData.title,
          description: formData.description || null,
          tags,
          is_published: formData.is_published,
        };

        if (selectedFile) {
          updateData.file_path = fileData.path;
          updateData.file_url = fileData.url;
          updateData.mime_type = selectedFile.type;
          updateData.file_size_bytes = selectedFile.size;
        }

        const { error } = await supabase
          .from("media_assets")
          .update(updateData)
          .eq("id", editingId);

        if (error) throw error;
        
        toast({ title: "Media updated successfully" });
      } else {
        const { error } = await supabase
          .from("media_assets")
          .insert({
            title: formData.title,
            description: formData.description || null,
            media_type: formData.media_type,
            file_path: fileData.path,
            file_url: fileData.url,
            mime_type: selectedFile!.type,
            file_size_bytes: selectedFile!.size,
            tags,
            is_published: formData.is_published,
          });

        if (error) throw error;
        
        toast({ title: "Media uploaded successfully" });
      }

      setDialogOpen(false);
      resetForm();
      loadMedia();
    } catch (error: any) {
      toast({
        title: "Error saving media",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string, filePath: string) => {
    if (!confirm("Are you sure you want to delete this media asset?")) return;

    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from("dog-photos")
        .remove([filePath]);

      if (storageError) console.error("Storage deletion error:", storageError);

      // Delete from database
      const { error } = await supabase
        .from("media_assets")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({ title: "Media deleted successfully" });
      loadMedia();
    } catch (error: any) {
      toast({
        title: "Error deleting media",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (asset: MediaAsset) => {
    setEditingId(asset.id);
    setFormData({
      title: asset.title,
      description: asset.description || "",
      media_type: asset.media_type,
      tags: asset.tags.join(", "),
      is_published: asset.is_published,
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      media_type: "image",
      tags: "",
      is_published: true,
    });
    setSelectedFile(null);
    setEditingId(null);
  };

  const getMediaIcon = (type: string) => {
    switch (type) {
      case "image": return <Image className="h-4 w-4" />;
      case "video": return <Video className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "N/A";
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Media Library</h1>
          <p className="text-muted-foreground">Manage training videos, images, and documents</p>
        </div>
        <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
          <Upload className="mr-2 h-4 w-4" />
          Upload Media
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Media Assets</CardTitle>
          <CardDescription>
            <div className="flex gap-4 mt-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search media..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyUp={loadMedia}
                  className="pl-10"
                />
              </div>
              <Select value={filterType} onValueChange={(value) => { setFilterType(value); loadMedia(); }}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="image">Images</SelectItem>
                  <SelectItem value="video">Videos</SelectItem>
                  <SelectItem value="document">Documents</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading media...</div>
          ) : media.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No media assets found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {media.map((asset) => (
                  <TableRow key={asset.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getMediaIcon(asset.media_type)}
                        <span className="capitalize">{asset.media_type}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{asset.title}</TableCell>
                    <TableCell>{formatFileSize(asset.file_size_bytes)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {asset.tags.slice(0, 2).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {asset.tags.length > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{asset.tags.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={asset.is_published ? "default" : "secondary"}>
                        {asset.is_published ? "Published" : "Draft"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(asset.file_url, "_blank")}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(asset)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(asset.id, asset.file_path)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Media" : "Upload Media"}</DialogTitle>
            <DialogDescription>
              {editingId ? "Update media details" : "Upload a new media file"}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {!editingId && (
              <div>
                <Label>File</Label>
                <Input
                  type="file"
                  onChange={handleFileSelect}
                  accept="image/*,video/*,.pdf,.doc,.docx"
                />
                {selectedFile && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Selected: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                  </p>
                )}
              </div>
            )}

            <div>
              <Label>Title *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter media title"
              />
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter media description"
                rows={3}
              />
            </div>

            <div>
              <Label>Tags (comma-separated)</Label>
              <Input
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="training, beginner, tutorial"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_published"
                checked={formData.is_published}
                onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                className="h-4 w-4"
              />
              <Label htmlFor="is_published">Published</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={uploading}>
              {uploading ? "Saving..." : editingId ? "Update" : "Upload"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
