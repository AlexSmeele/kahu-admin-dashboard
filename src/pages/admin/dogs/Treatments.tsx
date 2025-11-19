import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function AdminTreatments() {
  return (
    <div className="p-4 md:p-8">
      <div className="mb-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Treatments & Medical</h1>
            <p className="text-sm md:text-base text-muted-foreground">Manage preventive treatments and medical information</p>
          </div>
          <Button disabled>
            <Plus className="mr-2 h-4 w-4" />
            Add Treatment
          </Button>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Coming Soon</AlertTitle>
          <AlertDescription>
            The Treatments management system is under development. Once implemented, you'll be able to manage treatment information using the unified table viewer.
          </AlertDescription>
        </Alert>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Treatments Database</CardTitle>
          <CardDescription>Flea/tick, worming, and other preventive treatments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground space-y-4">
            <p>The treatments management interface will include:</p>
            <ul className="list-disc list-inside space-y-2">
              <li>Treatment names and types (flea/tick, worming, preventive)</li>
              <li>Administration route (oral, topical, injection)</li>
              <li>Frequency and dosing information</li>
              <li>Species compatibility (dogs, cats, other)</li>
              <li>Usage instructions and warnings</li>
              <li>Breed-specific contraindications (e.g., ivermectin sensitivity)</li>
              <li>Age restrictions and safety notes</li>
              <li>Active ingredients and formulations</li>
            </ul>
            <p className="pt-4 text-xs text-muted-foreground italic">
              To implement: Create a 'treatments' table in the database and integrate with the UnifiedDataViewer component.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
