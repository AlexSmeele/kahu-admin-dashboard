import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileVideo, Image, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface MediaAsset {
  id: string;
  title: string;
  description: string | null;
  media_type: string;
  file_url: string;
  thumbnail_url: string | null;
  tags: string[] | null;
  created_at: string | null;
  file_size_bytes: number | null;
}

interface MediaCardProps {
  media: MediaAsset;
  onDelete: (id: string) => void;
}

export function MediaCard({ media, onDelete }: MediaCardProps) {
  const isVideo = media.media_type === "video";

  return (
    <Card className="overflow-hidden">
      <div className="aspect-video bg-muted relative">
        {isVideo ? (
          <video
            src={media.file_url}
            className="w-full h-full object-cover"
            controls={false}
          />
        ) : (
          <img
            src={media.file_url}
            alt={media.title}
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute top-2 right-2">
          <Badge variant="secondary" className="gap-1">
            {isVideo ? <FileVideo className="h-3 w-3" /> : <Image className="h-3 w-3" />}
            {media.media_type}
          </Badge>
        </div>
      </div>
      <CardContent className="p-4">
        <div className="space-y-3">
          <div>
            <h3 className="font-semibold line-clamp-1 text-lg">{media.title}</h3>
            {media.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                {media.description}
              </p>
            )}
          </div>
          {media.tags && media.tags.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Tags:</p>
              <div className="flex flex-wrap gap-1.5">
                {media.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs font-medium">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          <div className="flex items-center justify-between pt-2">
            <div className="text-xs text-muted-foreground">
              {media.created_at && formatDistanceToNow(new Date(media.created_at), { addSuffix: true })}
              {media.file_size_bytes && ` · ${(media.file_size_bytes / 1024 / 1024).toFixed(1)} MB`}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(media.id)}
              className="h-8 w-8 p-0"
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
