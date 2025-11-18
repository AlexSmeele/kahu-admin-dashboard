import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function AdminTreatments() {
  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Treatments & Medical</h1>
          <p className="text-muted-foreground">Manage preventive treatments and medical information</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Treatment
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Treatments Database</CardTitle>
          <CardDescription>Flea/tick, worming, and other preventive treatments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            Treatments management interface coming soon. Features will include:
            <ul className="mt-2 list-disc list-inside space-y-1">
              <li>Treatment names and types (flea/tick, worming, preventive)</li>
              <li>Administration route (oral/topical/injection)</li>
              <li>Frequency and dosing information</li>
              <li>Species compatibility</li>
              <li>Usage instructions and warnings</li>
              <li>Breed-specific contraindications</li>
              <li>Age restrictions and safety notes</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
