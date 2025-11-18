import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";

export default function AdminMedia() {
  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Media Library</h1>
          <p className="text-muted-foreground">Manage training videos and images</p>
        </div>
        <Button>
          <Upload className="mr-2 h-4 w-4" />
          Upload Media
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Media Assets</CardTitle>
          <CardDescription>Videos, images, and other training resources</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            Media library interface coming soon. Features will include:
            <ul className="mt-2 list-disc list-inside space-y-1">
              <li>Grid/list view of media assets</li>
              <li>Filter by type (video/image), tags, usage</li>
              <li>Upload new media to Supabase storage</li>
              <li>Edit metadata (title, description, tags)</li>
              <li>Track where media is used (skills, modules, breeds)</li>
              <li>Bulk operations and asset management</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
