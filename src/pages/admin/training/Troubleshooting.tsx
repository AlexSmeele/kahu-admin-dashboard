import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function AdminTroubleshooting() {
  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Troubleshooting Library</h1>
          <p className="text-muted-foreground">Manage behavior issues and solutions</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Issue
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Behavior Issues</CardTitle>
          <CardDescription>Common problems and recommended training approaches</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            Troubleshooting entries will be displayed here. This section will include:
            <ul className="mt-2 list-disc list-inside space-y-1">
              <li>Problem descriptions and signs</li>
              <li>Root cause explanations</li>
              <li>Recommended training steps</li>
              <li>Linked skills and modules</li>
              <li>Do's and don'ts</li>
              <li>Supporting media and resources</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
