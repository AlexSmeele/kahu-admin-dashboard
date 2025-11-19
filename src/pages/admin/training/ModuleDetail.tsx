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
import { ArrowLeft, Pencil, Save } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { StepsEditor } from "@/components/admin/training/StepsEditor";

interface Module {
  id: string;
  name: string;
  category: string;
  format: string;
  ideal_stage: string;
  estimated_minutes: number;
  order_index: number;
  is_published: boolean;
  brief_description: string;
  detailed_description: string;
  brief_steps: any;
  detailed_steps: any;
  created_at: string;
  updated_at: string;
}

export default function ModuleDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [module, setModule] = useState<Module | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<Module>>({});

  useEffect(() => {
    loadModule();
  }, [id]);

  const parseSteps = (steps: any): string[] => {
    if (!steps) return [];
    if (Array.isArray(steps)) return steps;
    if (typeof steps === 'string') {
      try {
        const parsed = JSON.parse(steps);
        return Array.isArray(parsed) ? parsed : [steps];
      } catch {
        return [steps];
      }
    }
    return [];
  };

  const loadModule = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("foundation_modules")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      setModule(data);
      setFormData(data);
    } catch (error) {
      console.error("Error loading module:", error);
      toast.error("Failed to load module");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!id) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("foundation_modules")
        .update({
          name: formData.name,
          category: formData.category,
          format: formData.format,
          ideal_stage: formData.ideal_stage,
          estimated_minutes: formData.estimated_minutes,
          order_index: formData.order_index,
          is_published: formData.is_published,
          brief_description: formData.brief_description,
          detailed_description: formData.detailed_description,
          brief_steps: formData.brief_steps,
          detailed_steps: formData.detailed_steps,
        })
        .eq("id", id);

      if (error) throw error;

      toast.success("Module updated successfully");
      setEditing(false);
      loadModule();
    } catch (error) {
      console.error("Error updating module:", error);
      toast.error("Failed to update module");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData(module || {});
    setEditing(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading module...</p>
        </div>
      </div>
    );
  }

  if (!module) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-xl text-muted-foreground">Module not found</p>
          <Button onClick={() => navigate("/admin/training/modules")} className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Modules
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/admin/training/modules")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">{module.name}</h1>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline">{module.category}</Badge>
              <Badge variant="outline">{module.format}</Badge>
              <Badge variant={module.is_published ? "default" : "secondary"}>
                {module.is_published ? "Published" : "Draft"}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {editing ? (
            <>
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                <Save className="mr-2 h-4 w-4" />
                {saving ? "Saving..." : "Save"}
              </Button>
            </>
          ) : (
            <Button onClick={() => setEditing(true)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Button>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Name *</Label>
                {editing ? (
                  <Input
                    id="name"
                    value={formData.name || ""}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                ) : (
                  <p className="mt-2">{module.name}</p>
                )}
              </div>

              <div>
                <Label htmlFor="category">Category *</Label>
                {editing ? (
                  <Select
                    value={formData.category || ""}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="foundation">Foundation</SelectItem>
                      <SelectItem value="behavior">Behavior</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                      <SelectItem value="specialty">Specialty</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="mt-2 capitalize">{module.category}</p>
                )}
              </div>

              <div>
                <Label htmlFor="format">Format *</Label>
                {editing ? (
                  <Select
                    value={formData.format || ""}
                    onValueChange={(value) => setFormData({ ...formData, format: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="video">Video</SelectItem>
                      <SelectItem value="article">Article</SelectItem>
                      <SelectItem value="interactive">Interactive</SelectItem>
                      <SelectItem value="quiz">Quiz</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="mt-2 capitalize">{module.format}</p>
                )}
              </div>

              <div>
                <Label htmlFor="ideal_stage">Ideal Stage *</Label>
                {editing ? (
                  <Select
                    value={formData.ideal_stage || ""}
                    onValueChange={(value) => setFormData({ ...formData, ideal_stage: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="puppy">Puppy</SelectItem>
                      <SelectItem value="adolescent">Adolescent</SelectItem>
                      <SelectItem value="adult">Adult</SelectItem>
                      <SelectItem value="any">Any</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="mt-2 capitalize">{module.ideal_stage}</p>
                )}
              </div>

              <div>
                <Label htmlFor="estimated_minutes">Estimated Minutes *</Label>
                {editing ? (
                  <Input
                    id="estimated_minutes"
                    type="number"
                    min="1"
                    value={formData.estimated_minutes || ""}
                    onChange={(e) => setFormData({ ...formData, estimated_minutes: parseInt(e.target.value) })}
                  />
                ) : (
                  <p className="mt-2">{module.estimated_minutes} min</p>
                )}
              </div>

              <div>
                <Label htmlFor="order_index">Order Index</Label>
                {editing ? (
                  <Input
                    id="order_index"
                    type="number"
                    min="0"
                    value={formData.order_index || ""}
                    onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) })}
                    placeholder="Lower numbers appear first"
                  />
                ) : (
                  <p className="mt-2">{module.order_index}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">Lower numbers appear first in the list</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Label htmlFor="is_published">Published</Label>
              {editing ? (
                <Switch
                  id="is_published"
                  checked={formData.is_published || false}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })}
                />
              ) : (
                <Badge variant={module.is_published ? "default" : "secondary"}>
                  {module.is_published ? "Published" : "Draft"}
                </Badge>
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
            <div>
              <Label htmlFor="brief_description">Brief Description *</Label>
              {editing ? (
                <Textarea
                  id="brief_description"
                  value={formData.brief_description || ""}
                  onChange={(e) => setFormData({ ...formData, brief_description: e.target.value })}
                  rows={3}
                  placeholder="Short summary of the module..."
                />
              ) : (
                <p className="mt-2 whitespace-pre-wrap">{module.brief_description}</p>
              )}
            </div>

            <div>
              <Label htmlFor="detailed_description">Detailed Description *</Label>
              {editing ? (
                <Textarea
                  id="detailed_description"
                  value={formData.detailed_description || ""}
                  onChange={(e) => setFormData({ ...formData, detailed_description: e.target.value })}
                  rows={6}
                  placeholder="Comprehensive description of the module..."
                />
              ) : (
                <p className="mt-2 whitespace-pre-wrap">{module.detailed_description}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Steps */}
        <Card>
          <CardHeader>
            <CardTitle>Steps</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <StepsEditor
              steps={parseSteps(editing ? formData.brief_steps : module.brief_steps)}
              onChange={(steps) => setFormData({ ...formData, brief_steps: steps })}
              editing={editing}
              label="Brief Steps"
              placeholder="Enter a brief step..."
            />

            <StepsEditor
              steps={parseSteps(editing ? formData.detailed_steps : module.detailed_steps)}
              onChange={(steps) => setFormData({ ...formData, detailed_steps: steps })}
              editing={editing}
              label="Detailed Steps"
              placeholder="Enter a detailed step..."
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
