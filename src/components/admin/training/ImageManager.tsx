import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { Upload, Trash2, ArrowUp, ArrowDown, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ImageData {
  url: string;
  order: number;
}

interface ImageManagerProps {
  images: ImageData[];
  onChange: (images: ImageData[]) => void;
  editing: boolean;
  skillId: string;
}

export function ImageManager({ images, onChange, editing, skillId }: ImageManagerProps) {
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${skillId}/${Date.now()}.${fileExt}`;
      const filePath = `skills/${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from("media-assets")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("media-assets")
        .getPublicUrl(filePath);

      const newImage: ImageData = {
        url: publicUrl,
        order: images.length,
      };

      onChange([...images, newImage]);
      toast.success("Image uploaded successfully");
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload image");
    } finally {
      setUploading(false);
      // Reset input
      e.target.value = "";
    }
  };

  const handleRemoveImage = async (index: number) => {
    if (!confirm("Remove this image?")) return;

    const imageToRemove = images[index];
    
    // Extract file path from URL to delete from storage
    try {
      const urlParts = imageToRemove.url.split("/media-assets/");
      if (urlParts.length > 1) {
        const filePath = urlParts[1];
        await supabase.storage.from("media-assets").remove([filePath]);
      }
    } catch (error) {
      console.error("Error deleting image from storage:", error);
    }

    const newImages = images
      .filter((_, i) => i !== index)
      .map((img, i) => ({ ...img, order: i }));
    
    onChange(newImages);
    toast.success("Image removed");
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newImages = [...images];
    [newImages[index - 1], newImages[index]] = [newImages[index], newImages[index - 1]];
    // Update order values
    newImages.forEach((img, i) => img.order = i);
    onChange(newImages);
  };

  const handleMoveDown = (index: number) => {
    if (index === images.length - 1) return;
    const newImages = [...images];
    [newImages[index], newImages[index + 1]] = [newImages[index + 1], newImages[index]];
    // Update order values
    newImages.forEach((img, i) => img.order = i);
    onChange(newImages);
  };

  if (!editing) {
    return (
      <div className="space-y-2">
        <Label>Images</Label>
        {images.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {images
              .sort((a, b) => a.order - b.order)
              .map((image, index) => (
                <Card key={index} className="overflow-hidden">
                  <img
                    src={image.url}
                    alt={`Skill image ${index + 1}`}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-2 text-xs text-center text-muted-foreground">
                    Image {index + 1}
                  </div>
                </Card>
              ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No images added</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Label>Images</Label>
      
      {images.length > 0 && (
        <div className="space-y-3">
          {images
            .sort((a, b) => a.order - b.order)
            .map((image, index) => (
              <Card key={index} className="p-3">
                <div className="flex items-center gap-3">
                  <img
                    src={image.url}
                    alt={`Image ${index + 1}`}
                    className="w-24 h-24 object-cover rounded"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Image {index + 1}</p>
                    <p className="text-xs text-muted-foreground">Order: {index + 1}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0}
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleMoveDown(index)}
                      disabled={index === images.length - 1}
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveImage(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
        </div>
      )}

      <div className="border-2 border-dashed rounded-lg p-4">
        <Input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          disabled={uploading}
          className="hidden"
          id="image-upload"
        />
        <label htmlFor="image-upload">
          <Button
            variant="outline"
            className="w-full"
            disabled={uploading}
            asChild
          >
            <div className="cursor-pointer">
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Image
                </>
              )}
            </div>
          </Button>
        </label>
        <p className="text-xs text-muted-foreground text-center mt-2">
          Max 5MB • JPG, PNG, GIF, WebP
        </p>
      </div>
    </div>
  );
}
