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
import { ArrowLeft, Pencil, Trash2, Save } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { StepsEditor } from "@/components/admin/training/StepsEditor";
import { ImageManager } from "@/components/admin/training/ImageManager";
import { SkillMultiSelect } from "@/components/admin/training/SkillMultiSelect";

interface Skill {
  id: string;
  name: string;
  category: string[];
  difficulty_level: number;
  estimated_time_weeks: number | null;
  prerequisites: string[] | null;
  priority_order: number | null;
  min_age_weeks: number | null;
  skill_type: string | null;
  recommended_practice_frequency_days: number | null;
  short_description: string | null;
  long_description: string | null;
  brief_instructions: any | null;
  detailed_instructions: any | null;
  general_tips: string | null;
  troubleshooting: string | null;
  preparation_tips: string | null;
  training_insights: string | null;
  achievement_levels: any | null;
  ideal_stage_timeline: any | null;
  criteria: any | null;
  pass_criteria: string | null;
  fail_criteria: string | null;
  mastery_criteria: string | null;
  video_url: string | null;
  images: any | null;
  created_at: string;
}

export default function SkillDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [skill, setSkill] = useState<Skill | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState<Partial<Skill>>({});

  useEffect(() => {
    loadSkill();
  }, [id]);

  const parseInstructions = (instructions: any): string[] => {
    if (!instructions) return [];
    if (Array.isArray(instructions)) return instructions;
    if (typeof instructions === 'string') {
      try {
        const parsed = JSON.parse(instructions);
        return Array.isArray(parsed) ? parsed : [instructions];
      } catch {
        return [instructions];
      }
    }
    return [];
  };

  const parseImages = (images: any): Array<{ url: string; order: number }> => {
    if (!images) return [];
    if (Array.isArray(images)) return images;
    if (typeof images === 'string') {
      try {
        const parsed = JSON.parse(images);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  };

  const [prerequisiteSkills, setPrerequisiteSkills] = useState<Array<{ id: string; name: string }>>([]);

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
      setFormData(data);

      // Load prerequisite skill names
      if (data.prerequisites && data.prerequisites.length > 0) {
        const { data: prereqData } = await supabase
          .from("skills")
          .select("id, name")
          .in("id", data.prerequisites);
        
        if (prereqData) {
          setPrerequisiteSkills(prereqData);
        }
      } else {
        setPrerequisiteSkills([]);
      }
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
      // Prepare data with proper type conversions
      const dataToSave = {
        ...formData,
        // Ensure priority_order is a number or null
        priority_order: formData.priority_order ? parseInt(String(formData.priority_order)) : null,
        // Ensure numeric fields are properly typed
        difficulty_level: formData.difficulty_level ? parseInt(String(formData.difficulty_level)) : 1,
        estimated_time_weeks: formData.estimated_time_weeks ? parseInt(String(formData.estimated_time_weeks)) : null,
        min_age_weeks: formData.min_age_weeks ? parseInt(String(formData.min_age_weeks)) : null,
        recommended_practice_frequency_days: formData.recommended_practice_frequency_days 
          ? parseInt(String(formData.recommended_practice_frequency_days)) 
          : null,
      };

      const { error } = await supabase
        .from("skills")
        .update(dataToSave)
        .eq("id", id);

      if (error) {
        console.error("Save error:", error);
        toast.error(`Failed to save: ${error.message || 'Unknown error'}`);
        throw error;
      }

      toast.success("Skill updated successfully");
      setEditing(false);
      // Re-fetch to confirm changes
      await loadSkill();
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

      const { data: urlData } = supabase.storage
        .from("media-assets")
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from("skills")
        .update({ video_url: urlData.publicUrl })
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
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!skill) {
    return (
      <div className="p-8">
        <div className="text-center">Skill not found</div>
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
            <p className="text-muted-foreground">Skill Details</p>
          </div>
        </div>
        <div className="flex gap-2">
          {!editing ? (
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
          ) : (
            <>
              <Button variant="outline" onClick={() => { setEditing(false); setFormData(skill); }}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                <Save className="mr-2 h-4 w-4" />
                Save
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name</Label>
                {editing ? (
                  <Input
                    value={formData.name || ""}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                ) : (
                  <div className="text-sm">{skill.name}</div>
                )}
              </div>
              <div className="space-y-2">
                <Label>Skill Type</Label>
                {editing ? (
                  <Select
                    value={formData.skill_type || ""}
                    onValueChange={(value) => setFormData({ ...formData, skill_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="foundation">Foundation</SelectItem>
                      <SelectItem value="trick">Trick</SelectItem>
                      <SelectItem value="behavior">Behavior</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="text-sm">{skill.skill_type}</div>
                )}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Difficulty Level</Label>
                {editing ? (
                  <Select
                    value={String(formData.difficulty_level)}
                    onValueChange={(value) => setFormData({ ...formData, difficulty_level: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map((level) => (
                        <SelectItem key={level} value={String(level)}>
                          Level {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge variant="outline">Level {skill.difficulty_level}</Badge>
                )}
              </div>
              <div className="space-y-2">
                <Label>Priority Order</Label>
                {editing ? (
                  <div className="space-y-1">
                    <Input
                      type="number"
                      min="1"
                      value={formData.priority_order ?? ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData({ 
                          ...formData, 
                          priority_order: val === "" ? null : parseInt(val)
                        });
                      }}
                    />
                    <p className="text-xs text-muted-foreground">
                      1 = most basic skill, higher numbers = more advanced
                    </p>
                  </div>
                ) : (
                  <Badge variant="secondary">{skill.priority_order || "Not set"}</Badge>
                )}
              </div>
              <div className="space-y-2">
                <Label>Categories</Label>
                <div className="flex flex-wrap gap-1">
                  {skill.category?.map((cat) => (
                    <Badge key={cat} variant="outline">{cat}</Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Time & Requirements */}
        <Card>
          <CardHeader>
            <CardTitle>Time & Requirements</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Estimated Time (weeks)</Label>
                {editing ? (
                  <Input
                    type="number"
                    value={formData.estimated_time_weeks || ""}
                    onChange={(e) => setFormData({ ...formData, estimated_time_weeks: parseInt(e.target.value) || null })}
                  />
                ) : (
                  <div className="text-sm">{skill.estimated_time_weeks || "Not specified"}</div>
                )}
              </div>
              <div className="space-y-2">
                <Label>Minimum Age (weeks)</Label>
                {editing ? (
                  <Input
                    type="number"
                    value={formData.min_age_weeks || ""}
                    onChange={(e) => setFormData({ ...formData, min_age_weeks: parseInt(e.target.value) || null })}
                  />
                ) : (
                  <div className="text-sm">{skill.min_age_weeks || "Not specified"}</div>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Recommended Practice Frequency (days)</Label>
              {editing ? (
                <Input
                  type="number"
                  value={formData.recommended_practice_frequency_days || ""}
                  onChange={(e) => setFormData({ ...formData, recommended_practice_frequency_days: parseInt(e.target.value) || null })}
                />
              ) : (
                <div className="text-sm">{skill.recommended_practice_frequency_days || "Not specified"}</div>
              )}
            </div>
            <div className="space-y-2">
              <Label>Prerequisites</Label>
              {editing ? (
                <SkillMultiSelect
                  value={formData.prerequisites || []}
                  onChange={(value) => setFormData({ ...formData, prerequisites: value })}
                  currentSkillId={id}
                />
              ) : (
                <div className="flex flex-wrap gap-2">
                  {prerequisiteSkills.length > 0 ? (
                    prerequisiteSkills.map((prereq) => (
                      <Badge key={prereq.id} variant="secondary">{prereq.name}</Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">None</span>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Descriptions */}
        <Card>
          <CardHeader>
            <CardTitle>Descriptions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Short Description</Label>
              {editing ? (
                <Input
                  value={formData.short_description || ""}
                  onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
                />
              ) : (
                <div className="text-sm">{skill.short_description || "N/A"}</div>
              )}
            </div>
            <div className="space-y-2">
              <Label>Long Description</Label>
              {editing ? (
                <Textarea
                  rows={3}
                  value={formData.long_description || ""}
                  onChange={(e) => setFormData({ ...formData, long_description: e.target.value })}
                />
              ) : (
                <div className="text-sm">{skill.long_description || "N/A"}</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <StepsEditor
              steps={parseInstructions(formData.brief_instructions)}
              onChange={(steps) => setFormData({ ...formData, brief_instructions: steps })}
              editing={editing}
              label="Brief Instructions"
              placeholder="Enter a brief instruction step..."
            />
            
            <StepsEditor
              steps={parseInstructions(formData.detailed_instructions)}
              onChange={(steps) => setFormData({ ...formData, detailed_instructions: steps })}
              editing={editing}
              label="Detailed Instructions"
              placeholder="Enter a detailed instruction step..."
            />
          </CardContent>
        </Card>

        {/* Tips & Troubleshooting */}
        <Card>
          <CardHeader>
            <CardTitle>Tips & Troubleshooting</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>General Tips</Label>
              {editing ? (
                <Textarea
                  rows={3}
                  value={formData.general_tips || ""}
                  onChange={(e) => setFormData({ ...formData, general_tips: e.target.value })}
                />
              ) : (
                <div className="text-sm">{skill.general_tips || "N/A"}</div>
              )}
            </div>
            <div className="space-y-2">
              <Label>Troubleshooting</Label>
              {editing ? (
                <Textarea
                  rows={3}
                  value={formData.troubleshooting || ""}
                  onChange={(e) => setFormData({ ...formData, troubleshooting: e.target.value })}
                />
              ) : (
                <div className="text-sm">{skill.troubleshooting || "N/A"}</div>
              )}
            </div>
            <div className="space-y-2">
              <Label>Preparation Tips</Label>
              {editing ? (
                <Textarea
                  rows={3}
                  value={formData.preparation_tips || ""}
                  onChange={(e) => setFormData({ ...formData, preparation_tips: e.target.value })}
                />
              ) : (
                <div className="text-sm">{skill.preparation_tips || "N/A"}</div>
              )}
            </div>
            <div className="space-y-2">
              <Label>Training Insights</Label>
              {editing ? (
                <Textarea
                  rows={3}
                  value={formData.training_insights || ""}
                  onChange={(e) => setFormData({ ...formData, training_insights: e.target.value })}
                />
              ) : (
                <div className="text-sm">{skill.training_insights || "N/A"}</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Mastery Criteria */}
        <Card>
          <CardHeader>
            <CardTitle>Mastery Criteria</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Pass Criteria</Label>
              {editing ? (
                <Textarea
                  rows={3}
                  value={formData.pass_criteria || ""}
                  onChange={(e) => setFormData({ ...formData, pass_criteria: e.target.value })}
                />
              ) : (
                <div className="text-sm">{skill.pass_criteria || "N/A"}</div>
              )}
            </div>
            <div className="space-y-2">
              <Label>Fail Criteria</Label>
              {editing ? (
                <Textarea
                  rows={3}
                  value={formData.fail_criteria || ""}
                  onChange={(e) => setFormData({ ...formData, fail_criteria: e.target.value })}
                />
              ) : (
                <div className="text-sm">{skill.fail_criteria || "N/A"}</div>
              )}
            </div>
            <div className="space-y-2">
              <Label>Mastery Criteria</Label>
              {editing ? (
                <Textarea
                  rows={3}
                  value={formData.mastery_criteria || ""}
                  onChange={(e) => setFormData({ ...formData, mastery_criteria: e.target.value })}
                />
              ) : (
                <div className="text-sm">{skill.mastery_criteria || "N/A"}</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Images */}
        <Card>
          <CardHeader>
            <CardTitle>Images</CardTitle>
          </CardHeader>
          <CardContent>
            <ImageManager
              images={parseImages(formData.images)}
              onChange={(images) => setFormData({ ...formData, images })}
              editing={editing}
              skillId={id || ""}
            />
          </CardContent>
        </Card>

        {/* Video */}
        <Card>
          <CardHeader>
            <CardTitle>Video</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {skill.video_url && (
              <div className="aspect-video w-full overflow-hidden rounded-lg bg-muted">
                <video
                  src={skill.video_url}
                  controls
                  className="h-full w-full object-contain"
                />
              </div>
            )}
            {editing && (
              <div>
                <Label htmlFor="video-upload">Upload Video</Label>
                <div className="mt-2 flex items-center gap-2">
                  <Input
                    id="video-upload"
                    type="file"
                    accept="video/*"
                    onChange={handleVideoUpload}
                    disabled={uploading}
                  />
                  {uploading && <span className="text-sm text-muted-foreground">Uploading...</span>}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
