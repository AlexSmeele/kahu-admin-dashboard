import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";

interface StepsEditorProps {
  steps: string[];
  onChange: (steps: string[]) => void;
  editing: boolean;
  label: string;
  placeholder?: string;
}

export function StepsEditor({ 
  steps, 
  onChange, 
  editing, 
  label, 
  placeholder = "Enter step text..." 
}: StepsEditorProps) {
  const handleStepChange = (index: number, value: string) => {
    const newSteps = [...steps];
    newSteps[index] = value;
    onChange(newSteps);
  };

  const handleAddStep = () => {
    onChange([...steps, ""]);
  };

  const handleRemoveStep = (index: number) => {
    if (steps[index] && !confirm(`Remove Step ${index + 1}?`)) return;
    const newSteps = steps.filter((_, i) => i !== index);
    onChange(newSteps);
  };

  if (!editing) {
    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        {steps.length > 0 ? (
          <ol className="space-y-2 list-none">
            {steps.map((step, index) => (
              <li key={index} className="flex gap-2">
                <Badge variant="outline" className="shrink-0">
                  Step {index + 1}
                </Badge>
                <span className="text-sm">{step}</span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-sm text-muted-foreground">No steps added</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Label>{label}</Label>
      {steps.map((step, index) => (
        <Card key={index} className="p-3">
          <div className="flex items-start gap-2">
            <Badge variant="outline" className="shrink-0 mt-2">
              Step {index + 1}
            </Badge>
            <Textarea
              value={step}
              onChange={(e) => handleStepChange(index, e.target.value)}
              placeholder={placeholder}
              rows={3}
              className="flex-1"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleRemoveStep(index)}
              className="shrink-0"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      ))}
      <Button
        variant="outline"
        onClick={handleAddStep}
        className="w-full"
      >
        <Plus className="mr-2 h-4 w-4" />
        Add Step
      </Button>
    </div>
  );
}
