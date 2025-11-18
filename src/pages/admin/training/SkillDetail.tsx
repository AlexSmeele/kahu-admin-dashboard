import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Pencil, Trash2, Save, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface Skill {
  id: string;
  name: string;
  category: string[];
  difficulty_level: number;
  skill_type: string | null;
  short_description: string | null;
  long_description: string | null;
  video_url: string | null;
  created_at: string;
}

export default function SkillDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [skill, setSkill] = useState<Skill | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    category: ["foundation"],
    difficulty_level: 1,
    skill_type: "foundation",
    short_description: "",
    long_description: "",
    video_url: "",
  });

  useEffect(() => {
    loadSkill();
  }, [id]);

  const loadSkill = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("skills")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      setSkill(data);
      setFormData({
        name: data.name,
        category: data.category || ["foundation"],
        difficulty_level: data.difficulty_level,
        skill_type: data.skill_type || "foundation",
        short_description: data.short_description || "",
        long_description: data.long_description || "",
        video_url: data.video_url || "",
      });
    } catch (error) {
      console.error("Error loading skill:", error);
      toast.error("Failed to load skill");
      navigate("/admin/training/skills");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!id) return;

    try {
      const { error } = await supabase
        .from("skills")
        .update(formData)
        .eq("id", id);

      if (error) throw error;

      toast.success("Skill updated successfully");
      setEditing(false);
      loadSkill();
    } catch (error) {
      console.error("Error saving skill:", error);
      toast.error("Failed to save skill");
    }
  };

  const handleDelete = async () => {
    if (!id || !confirm("Are you sure you want to delete this skill?")) return;

    try {
      const { error } = await supabase
        .from("skills")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Skill deleted successfully");
      navigate("/admin/training/skills");
    } catch (error) {
      console.error("Error deleting skill:", error);
      toast.error("Failed to delete skill");
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id) return;

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${id}-${Date.now()}.${fileExt}`;
      const filePath = `skills/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("media-assets")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("media-assets")
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from("skills")
        .update({ video_url: publicUrl })
        .eq("id", id);

      if (updateError) throw updateError;

      toast.success("Video uploaded successfully");
      loadSkill();
    } catch (error) {
      console.error("Error uploading video:", error);
      toast.error("Failed to upload video");
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!skill) {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">Skill not found</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin/training/skills")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{skill.name}</h1>
            <div className="flex gap-2 mt-2">
              {skill.category?.map((cat) => (
                <Badge key={cat} variant="secondary">
                  {cat}
                </Badge>
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {editing ? (
            <>
              <Button variant="outline" onClick={() => setEditing(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                <Save className="mr-2 h-4 w-4" />
                Save
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setEditing(true)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Skill Name</Label>
              {editing ? (
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              ) : (
                <p className="text-foreground">{skill.name}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="type">Skill Type</Label>
                {editing ? (
                  <Select
                    value={formData.skill_type || "foundation"}
                    onValueChange={(value) => setFormData({ ...formData, skill_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="foundation">Foundation</SelectItem>
                      <SelectItem value="obedience">Obedience</SelectItem>
                      <SelectItem value="trick">Trick</SelectItem>
                      <SelectItem value="behavior">Behavior</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-foreground">{skill.skill_type || "N/A"}</p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="difficulty">Difficulty (1-5)</Label>
                {editing ? (
                  <Input
                    id="difficulty"
                    type="number"
                    min="1"
                    max="5"
                    value={formData.difficulty_level}
                    onChange={(e) =>
                      setFormData({ ...formData, difficulty_level: parseInt(e.target.value) || 1 })
                    }
                  />
                ) : (
                  <p className="text-foreground">{skill.difficulty_level}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="short-desc">Short Description</Label>
              {editing ? (
                <Input
                  id="short-desc"
                  value={formData.short_description}
                  onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
                />
              ) : (
                <p className="text-foreground">{skill.short_description || "N/A"}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="long-desc">Long Description</Label>
              {editing ? (
                <Textarea
                  id="long-desc"
                  rows={6}
                  value={formData.long_description}
                  onChange={(e) => setFormData({ ...formData, long_description: e.target.value })}
                />
              ) : (
                <p className="text-foreground whitespace-pre-wrap">{skill.long_description || "N/A"}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Video</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            {skill.video_url && (
              <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                <video
                  src={skill.video_url}
                  controls
                  className="w-full h-full object-contain"
                >
                  Your browser does not support the video tag.
                </video>
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="video">Upload Video</Label>
              <div className="flex gap-2">
                <Input
                  id="video"
                  type="file"
                  accept="video/*"
                  onChange={handleVideoUpload}
                  disabled={uploading}
                />
                {uploading && <p className="text-sm text-muted-foreground">Uploading...</p>}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
