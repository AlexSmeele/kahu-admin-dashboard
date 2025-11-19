import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, ArrowUpDown } from "lucide-react";

export default function AdminTroubleshooting() {
  return (
    <div className="p-4 md:p-8">
      <div className="mb-4 md:mb-6">
        <div className="mb-3 md:mb-4">
          <h1 className="text-2xl md:text-3xl font-bold">Troubleshooting Library</h1>
          <p className="text-sm md:text-base text-muted-foreground">Manage behavior issues and solutions</p>
        </div>
        <div className="flex flex-row gap-2">
          <Button variant="outline" className="flex-1 sm:flex-none sm:w-auto">
            <ArrowUpDown className="mr-2 h-4 w-4" />
            Reorder Issues
          </Button>
          <Button className="flex-1 sm:flex-none sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Add Issue
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="text-base md:text-lg">Behavior Issues</CardTitle>
          <CardDescription className="text-xs md:text-sm">
            Click on an issue to view and edit details
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
          <div className="mb-3 md:mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search issues..."
                className="pl-10"
              />
            </div>
          </div>

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
