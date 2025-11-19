import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function AdminTroubleshooting() {
  return (
    <div className="p-4 md:p-8">
      <div className="mb-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Troubleshooting Library</h1>
            <p className="text-sm md:text-base text-muted-foreground">Manage behavior issues and solutions</p>
          </div>
          <Button disabled>
            <Plus className="mr-2 h-4 w-4" />
            Add Issue
          </Button>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Coming Soon</AlertTitle>
          <AlertDescription>
            The Troubleshooting management system is under development. Once implemented, you'll be able to manage behavior issues using the unified table viewer.
          </AlertDescription>
        </Alert>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Behavior Issues</CardTitle>
          <CardDescription>Common problems and evidence-based solutions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground space-y-4">
            <p>The troubleshooting interface will include:</p>
            <ul className="list-disc list-inside space-y-2">
              <li>Problem descriptions and behavioral signs</li>
              <li>Root cause explanations</li>
              <li>Recommended training steps</li>
              <li>Linked skills and modules for remediation</li>
              <li>Management strategies (do's and don'ts)</li>
              <li>Supporting media and video demonstrations</li>
              <li>Severity levels and urgency indicators</li>
              <li>When to consult a professional trainer or behaviorist</li>
            </ul>
            <p className="pt-4 text-xs text-muted-foreground italic">
              To implement: Create a 'troubleshooting_issues' table in the database and integrate with the UnifiedDataViewer component.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

