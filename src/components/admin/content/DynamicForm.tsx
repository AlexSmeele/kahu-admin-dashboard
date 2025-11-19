import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { SchemaField } from "./SchemaFieldEditor";

interface DynamicFormProps {
  fields: SchemaField[];
  data: Record<string, any>;
  onChange: (field: string, value: any) => void;
  errors?: Record<string, string>;
}

export function DynamicForm({ fields, data, onChange, errors = {} }: DynamicFormProps) {
  const renderField = (field: SchemaField) => {
    const value = data[field.name];
    const error = errors[field.name];
    const fieldId = `field-${field.name}`;

    const commonProps = {
      id: fieldId,
      required: !field.nullable,
    };

    switch (field.type) {
      case 'text':
        if (field.validation?.options && field.validation.options.length > 200) {
          return (
            <Textarea
              {...commonProps}
              value={value || ''}
              onChange={(e) => onChange(field.name, e.target.value)}
              placeholder={field.description || `Enter ${field.label}`}
              rows={4}
            />
          );
        }
        return (
          <Input
            {...commonProps}
            type="text"
            value={value || ''}
            onChange={(e) => onChange(field.name, e.target.value)}
            placeholder={field.description || `Enter ${field.label}`}
            pattern={field.validation?.pattern}
          />
        );

      case 'number':
        return (
          <Input
            {...commonProps}
            type="number"
            value={value ?? ''}
            onChange={(e) => onChange(field.name, e.target.value ? Number(e.target.value) : null)}
            placeholder={field.description || `Enter ${field.label}`}
            min={field.validation?.min}
            max={field.validation?.max}
            step="any"
          />
        );

      case 'boolean':
        return (
          <div className="flex items-center space-x-2">
            <Switch
              id={fieldId}
              checked={value || false}
              onCheckedChange={(checked) => onChange(field.name, checked)}
            />
            <Label htmlFor={fieldId} className="cursor-pointer">
              {field.description || 'Enable this option'}
            </Label>
          </div>
        );

      case 'date':
      case 'datetime':
        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !value && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {value ? format(new Date(value), field.type === 'date' ? 'PPP' : 'PPP p') : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={value ? new Date(value) : undefined}
                onSelect={(date) => {
                  if (date) {
                    onChange(field.name, field.type === 'datetime' ? date.toISOString() : format(date, 'yyyy-MM-dd'));
                  }
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        );

      case 'select':
        return (
          <Select value={value || ''} onValueChange={(v) => onChange(field.name, v)}>
            <SelectTrigger>
              <SelectValue placeholder={`Select ${field.label}`} />
            </SelectTrigger>
            <SelectContent>
              {field.nullable && <SelectItem value="">None</SelectItem>}
              {field.validation?.options?.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'multiselect':
        const selectedValues = Array.isArray(value) ? value : [];
        return (
          <div className="space-y-2">
            {field.validation?.options?.map((option) => (
              <div key={option} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={`${fieldId}-${option}`}
                  checked={selectedValues.includes(option)}
                  onChange={(e) => {
                    const newValues = e.target.checked
                      ? [...selectedValues, option]
                      : selectedValues.filter((v) => v !== option);
                    onChange(field.name, newValues);
                  }}
                  className="h-4 w-4"
                />
                <Label htmlFor={`${fieldId}-${option}`} className="cursor-pointer">
                  {option}
                </Label>
              </div>
            ))}
          </div>
        );

      case 'json':
        return (
          <Textarea
            {...commonProps}
            value={typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                onChange(field.name, parsed);
              } catch {
                onChange(field.name, e.target.value);
              }
            }}
            placeholder={field.description || 'Enter valid JSON'}
            rows={6}
            className="font-mono text-sm"
          />
        );

      case 'array':
        const arrayValue = Array.isArray(value) ? value.join('\n') : '';
        return (
          <Textarea
            {...commonProps}
            value={arrayValue}
            onChange={(e) => {
              const arr = e.target.value.split('\n').filter(line => line.trim());
              onChange(field.name, arr);
            }}
            placeholder="One item per line"
            rows={4}
          />
        );

      case 'file_url':
        return (
          <Input
            {...commonProps}
            type="url"
            value={value || ''}
            onChange={(e) => onChange(field.name, e.target.value)}
            placeholder="https://example.com/file.jpg"
          />
        );

      case 'uuid':
        return (
          <Input
            {...commonProps}
            type="text"
            value={value || ''}
            onChange={(e) => onChange(field.name, e.target.value)}
            placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            pattern="[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}"
          />
        );

      default:
        return (
          <Input
            {...commonProps}
            type="text"
            value={value || ''}
            onChange={(e) => onChange(field.name, e.target.value)}
            placeholder={field.description || `Enter ${field.label}`}
          />
        );
    }
  };

  return (
    <div className="space-y-6">
      {fields.map((field) => (
        <div key={field.name} className="space-y-2">
          <Label htmlFor={`field-${field.name}`}>
            {field.label}
            {!field.nullable && <span className="text-destructive ml-1">*</span>}
          </Label>
          {renderField(field)}
          {field.description && field.type !== 'boolean' && (
            <p className="text-xs text-muted-foreground">{field.description}</p>
          )}
          {errors[field.name] && (
            <p className="text-xs text-destructive">{errors[field.name]}</p>
          )}
        </div>
      ))}
    </div>
  );
}
