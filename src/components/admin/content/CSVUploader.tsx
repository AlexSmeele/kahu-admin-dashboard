import { useCallback } from "react";
import { Upload, FileSpreadsheet } from "lucide-react";
import { cn } from "@/lib/utils";

interface CSVUploaderProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
}

export function CSVUploader({ onFileSelect, disabled }: CSVUploaderProps) {
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (disabled) return;
      
      const file = e.dataTransfer.files[0];
      if (file && (file.type === "text/csv" || file.name.endsWith(".csv"))) {
        onFileSelect(file);
      }
    },
    [onFileSelect, disabled]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        onFileSelect(file);
      }
    },
    [onFileSelect]
  );

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      className={cn(
        "border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors",
        "hover:border-primary hover:bg-accent/50",
        disabled && "opacity-50 cursor-not-allowed hover:border-border hover:bg-transparent"
      )}
    >
      <input
        type="file"
        accept=".csv,text/csv"
        onChange={handleFileInput}
        className="hidden"
        id="csv-upload"
        disabled={disabled}
      />
      <label
        htmlFor="csv-upload"
        className={cn(
          "flex flex-col items-center gap-4",
          disabled ? "cursor-not-allowed" : "cursor-pointer"
        )}
      >
        <div className="p-4 rounded-full bg-primary/10">
          <FileSpreadsheet className="h-8 w-8 text-primary" />
        </div>
        <div className="space-y-2">
          <p className="text-lg font-medium">
            <Upload className="inline h-4 w-4 mr-2" />
            Drop CSV file here or click to browse
          </p>
          <p className="text-sm text-muted-foreground">
            Maximum file size: 10MB
          </p>
        </div>
      </label>
    </div>
  );
}
