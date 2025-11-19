import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ManualSchemaBuilder } from "@/components/admin/content/ManualSchemaBuilder";
import { CSVImportBuilder } from "@/components/admin/content/CSVImportBuilder";

type CreationMethod = 'manual' | 'csv';

export default function TableBuilder() {
  const { sectionId } = useParams();
  const navigate = useNavigate();
  const [method, setMethod] = useState<CreationMethod>('manual');

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/admin/content/sections/${sectionId}`)}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Section
        </Button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Create New Table</h1>
            <p className="text-muted-foreground mt-1">
              Choose how you want to create your table
            </p>
          </div>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Table Creation Method</CardTitle>
          <CardDescription>
            Select whether you want to manually define the schema or import from a CSV file
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup value={method} onValueChange={(value) => setMethod(value as CreationMethod)}>
            <div className="flex items-start space-x-3 space-y-0 rounded-md border p-4 cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => setMethod('manual')}>
              <RadioGroupItem value="manual" id="manual" />
              <div className="space-y-1 leading-none flex-1">
                <Label htmlFor="manual" className="cursor-pointer">
                  <div className="font-semibold text-base">Manual Schema Builder</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Define table fields one by one with full control over data types and constraints
                  </div>
                </Label>
              </div>
            </div>

            <div className="flex items-start space-x-3 space-y-0 rounded-md border p-4 cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => setMethod('csv')}>
              <RadioGroupItem value="csv" id="csv" />
              <div className="space-y-1 leading-none flex-1">
                <Label htmlFor="csv" className="cursor-pointer">
                  <div className="font-semibold text-base">Import from CSV</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Upload a CSV file to automatically detect schema and import data
                  </div>
                </Label>
              </div>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {method === 'manual' && <ManualSchemaBuilder sectionId={sectionId!} />}
      {method === 'csv' && <CSVImportBuilder sectionId={sectionId!} />}
    </div>
  );
}
