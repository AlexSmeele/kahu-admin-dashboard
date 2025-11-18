import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SectionForm {
  name: string;
  display_name: string;
  description: string;
  icon: string;
  order_index: number;
  is_active: boolean;
}

export default function SectionDetail() {
  const { id } = useParams();
  const isNew = id === "new";
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState<SectionForm>({
    name: "",
    display_name: "",
    description: "",
    icon: "",
    order_index: 0,
    is_active: true,
  });

  useEffect(() => {
    if (!isNew && id) {
      fetchSection();
    }
  }, [id, isNew]);

  const fetchSection = async () => {
    try {
      const { data, error } = await supabase
        .from("admin_sections")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      
      setFormData({
        name: data.name,
        display_name: data.display_name,
        description: data.description || "",
        icon: data.icon || "",
        order_index: data.order_index,
        is_active: data.is_active,
      });
    } catch (error: any) {
      toast({
        title: "Error loading section",
        description: error.message,
        variant: "destructive",
      });
      navigate("/admin/content/sections");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (isNew) {
        const { error } = await supabase
          .from("admin_sections")
          .insert({
            name: formData.name,
            display_name: formData.display_name,
            description: formData.description || null,
            icon: formData.icon || null,
            order_index: formData.order_index,
            is_active: formData.is_active,
          });

        if (error) throw error;

        toast({
          title: "Section created",
          description: `${formData.display_name} has been created successfully.`,
        });
      } else {
        const { error } = await supabase
          .from("admin_sections")
          .update({
            name: formData.name,
            display_name: formData.display_name,
            description: formData.description || null,
            icon: formData.icon || null,
            order_index: formData.order_index,
            is_active: formData.is_active,
          })
          .eq("id", id);

        if (error) throw error;

        toast({
          title: "Section updated",
          description: `${formData.display_name} has been updated successfully.`,
        });
      }

      navigate("/admin/content/sections");
    } catch (error: any) {
      toast({
        title: isNew ? "Error creating section" : "Error updating section",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin/content/sections")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">
            {isNew ? "New Section" : "Edit Section"}
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">
            {isNew ? "Create a new content section" : "Update section details"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Section Information</CardTitle>
            <CardDescription>
              Configure the section name, display name, and organization
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">System Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="training-content"
                  required
                  pattern="[a-z0-9-]+"
                  title="Use lowercase letters, numbers, and hyphens only"
                />
                <p className="text-xs text-muted-foreground">
                  Lowercase, hyphens only. Used in URLs and system references.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="display_name">Display Name *</Label>
                <Input
                  id="display_name"
                  value={formData.display_name}
                  onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                  placeholder="Training Content"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Human-readable name shown in the UI
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of this section..."
                rows={3}
              />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="icon">Icon Name</Label>
                <Input
                  id="icon"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  placeholder="GraduationCap"
                />
                <p className="text-xs text-muted-foreground">
                  Lucide icon name (e.g., GraduationCap, BookOpen)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="order_index">Order Index *</Label>
                <Input
                  id="order_index"
                  type="number"
                  value={formData.order_index}
                  onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) || 0 })}
                  min={0}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Controls display order (lower numbers appear first)
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="is_active" className="cursor-pointer">
                Active (visible in navigation)
              </Label>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/admin/content/sections")}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                <Save className="mr-2 h-4 w-4" />
                {saving ? "Saving..." : "Save Section"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
