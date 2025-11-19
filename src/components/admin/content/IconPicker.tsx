import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import * as Icons from "lucide-react";
import { Search } from "lucide-react";

// Common icons for sections
const COMMON_ICONS = [
  "Home", "Settings", "User", "Users", "Database", "Table", "FileText",
  "Folder", "FolderOpen", "Image", "Video", "Music", "File", "FileCode",
  "BookOpen", "Book", "BookMarked", "Library", "Bookmark",
  "Tag", "Tags", "Package", "Box", "Archive",
  "Calendar", "Clock", "Bell", "Mail", "MessageSquare",
  "Phone", "MapPin", "Map", "Globe", "Compass",
  "Heart", "Star", "Award", "Trophy", "Target",
  "TrendingUp", "BarChart", "PieChart", "Activity", "Zap",
  "Shield", "Lock", "Key", "Eye", "Flag",
  "Grid", "List", "Layers", "Layout", "Sidebar",
  "Wrench", "Code", "Terminal", "Cpu",
  "Palette", "Paintbrush", "Pencil", "Edit", "Trash",
  "Plus", "Minus", "X", "Check", "Info",
  "HelpCircle", "AlertCircle", "AlertTriangle", "Ban", "DollarSign"
];

interface IconPickerProps {
  value: string | null;
  onChange: (iconName: string) => void;
}

export function IconPicker({ value, onChange }: IconPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  // Get the icon component
  const IconComponent = value && (Icons as any)[value] ? (Icons as any)[value] : Icons.HelpCircle;

  // Filter icons based on search
  const filteredIcons = COMMON_ICONS.filter(iconName =>
    iconName.toLowerCase().includes(search.toLowerCase())
  );

  const handleIconSelect = (iconName: string) => {
    onChange(iconName);
    setOpen(false);
    setSearch("");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-start gap-2"
          type="button"
        >
          <IconComponent className="h-4 w-4" />
          {value || "Select an icon"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0 bg-background z-50" align="start">
        <div className="p-3 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search icons..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        <ScrollArea className="h-[300px] bg-background">
          <div className="grid grid-cols-6 gap-2 p-3">
            {filteredIcons.map((iconName) => {
              const Icon = (Icons as any)[iconName];
              if (!Icon) return null;
              
              const isSelected = value === iconName;
              
              return (
                <button
                  key={iconName}
                  onClick={() => handleIconSelect(iconName)}
                  className={`p-3 rounded-md hover:bg-accent transition-colors flex items-center justify-center ${
                    isSelected ? "bg-primary text-primary-foreground" : ""
                  }`}
                  title={iconName}
                  type="button"
                >
                  <Icon className="h-5 w-5" />
                </button>
              );
            })}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
