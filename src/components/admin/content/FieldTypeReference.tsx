import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

const fieldTypeReference = [
  {
    internal: 'text',
    postgresql: 'TEXT',
    useCase: 'Short or long text, names, descriptions, paragraphs',
    validations: 'Pattern (regex), min/max length',
  },
  {
    internal: 'integer',
    postgresql: 'INTEGER',
    useCase: 'Whole numbers: counts, IDs, quantities (-2B to 2B)',
    validations: 'Min/max values',
  },
  {
    internal: 'number',
    postgresql: 'NUMERIC',
    useCase: 'Decimal numbers: prices, percentages, measurements',
    validations: 'Min/max values, precision',
  },
  {
    internal: 'bigint',
    postgresql: 'BIGINT',
    useCase: 'Very large integers: timestamps, large IDs (-9Q to 9Q)',
    validations: 'Min/max values',
  },
  {
    internal: 'boolean',
    postgresql: 'BOOLEAN',
    useCase: 'True/false values: flags, toggles, yes/no',
    validations: 'None',
  },
  {
    internal: 'date',
    postgresql: 'DATE',
    useCase: 'Calendar dates without time: birthdays, deadlines',
    validations: 'Date range',
  },
  {
    internal: 'datetime',
    postgresql: 'TIMESTAMP',
    useCase: 'Date and time with timezone: events, logs, created_at',
    validations: 'Date/time range',
  },
  {
    internal: 'uuid',
    postgresql: 'UUID',
    useCase: 'Unique identifiers: primary keys, foreign keys',
    validations: 'UUID format',
  },
  {
    internal: 'json',
    postgresql: 'JSONB',
    useCase: 'Structured data: nested objects, flexible schemas',
    validations: 'JSON format',
  },
  {
    internal: 'text_array',
    postgresql: 'TEXT[]',
    useCase: 'Multiple text values: tags, categories, lists',
    validations: 'Array length',
  },
  {
    internal: 'integer_array',
    postgresql: 'INTEGER[]',
    useCase: 'Multiple numbers: scores, ratings, IDs',
    validations: 'Array length, value ranges',
  },
  {
    internal: 'uuid_array',
    postgresql: 'UUID[]',
    useCase: 'Multiple unique identifiers: foreign keys, references',
    validations: 'Array length, UUID format',
  },
  {
    internal: 'jsonb_array',
    postgresql: 'JSONB[]',
    useCase: 'Array of JSON objects: complex nested data structures',
    validations: 'Array length, JSON format',
  },
  {
    internal: 'file_url',
    postgresql: 'TEXT',
    useCase: 'File paths and URLs: images, documents, media',
    validations: 'URL format, file extensions',
  },
];

export function FieldTypeReference() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card>
        <CardHeader className="pb-3">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-0 hover:bg-transparent">
              <CardTitle className="text-sm font-medium">Field Type Reference</CardTitle>
              <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="text-xs text-muted-foreground mb-3 space-y-1">
              <p><strong>Field types</strong> define the PostgreSQL column type stored in your database.</p>
              <p><strong>Array types</strong> store multiple values in a single column.</p>
              <p><strong>Integer</strong> for whole numbers, <strong>Number</strong> for decimals.</p>
              <p><strong>UUID</strong> for unique identifiers like primary and foreign keys.</p>
            </div>
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px]">Type</TableHead>
                    <TableHead className="w-[100px]">PostgreSQL</TableHead>
                    <TableHead>Use Case</TableHead>
                    <TableHead className="w-[140px]">Validations</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fieldTypeReference.map((type) => (
                    <TableRow key={type.internal}>
                      <TableCell className="font-mono text-xs">{type.internal}</TableCell>
                      <TableCell className="font-mono text-xs">{type.postgresql}</TableCell>
                      <TableCell className="text-xs">{type.useCase}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{type.validations}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
