import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function AdminVaccines() {
  return (
    <div className="p-4 md:p-8">
      <div className="mb-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Vaccines</h1>
            <p className="text-sm md:text-base text-muted-foreground">Manage vaccine information and schedules</p>
          </div>
          <Button disabled>
            <Plus className="mr-2 h-4 w-4" />
            Add Vaccine
          </Button>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Coming Soon</AlertTitle>
          <AlertDescription>
            The Vaccine management system is under development. Once implemented, you'll be able to manage vaccine information using the unified table viewer.
          </AlertDescription>
        </Alert>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Vaccine Database</CardTitle>
          <CardDescription>Core and non-core vaccines for dogs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground space-y-4">
            <p>The vaccine management interface will include:</p>
            <ul className="list-disc list-inside space-y-2">
              <li>Vaccine names and categories (core/non-core)</li>
              <li>Pathogens covered by each vaccine</li>
              <li>Recommended schedule (puppy series, adult boosters)</li>
              <li>Regional variations (NZ, AU, US, UK)</li>
              <li>Detailed explanations and veterinary notes</li>
              <li>Status management (active/discontinued)</li>
              <li>Side effects and contraindications</li>
              <li>Manufacturer information</li>
            </ul>
            <p className="pt-4 text-xs text-muted-foreground italic">
              To implement: Create a 'vaccines' table in the database and integrate with the UnifiedDataViewer component.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
