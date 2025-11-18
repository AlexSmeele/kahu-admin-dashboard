import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function AdminVaccines() {
  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Vaccines</h1>
          <p className="text-muted-foreground">Manage vaccine information and schedules</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Vaccine
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Vaccine Database</CardTitle>
          <CardDescription>Core and non-core vaccines for dogs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            Vaccine management interface coming soon. Features will include:
            <ul className="mt-2 list-disc list-inside space-y-1">
              <li>Vaccine names and categories (core/non-core)</li>
              <li>Pathogens covered</li>
              <li>Recommended schedule (puppy series, adult boosters)</li>
              <li>Regional variations (NZ/AU/US/UK)</li>
              <li>Detailed explanations and notes</li>
              <li>Status management</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
