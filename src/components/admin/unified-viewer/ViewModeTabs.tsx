import { LayoutGrid, List, Table } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ViewModeTabsProps {
  viewMode: 'table' | 'list' | 'cards';
  onViewModeChange: (mode: 'table' | 'list' | 'cards') => void;
}

export function ViewModeTabs({ viewMode, onViewModeChange }: ViewModeTabsProps) {
  return (
    <Tabs value={viewMode} onValueChange={(v) => onViewModeChange(v as any)}>
      <TabsList>
        <TabsTrigger value="table" className="gap-2">
          <Table className="h-4 w-4" />
          <span className="hidden sm:inline">Table</span>
        </TabsTrigger>
        <TabsTrigger value="list" className="gap-2">
          <List className="h-4 w-4" />
          <span className="hidden sm:inline">List</span>
        </TabsTrigger>
        <TabsTrigger value="cards" className="gap-2">
          <LayoutGrid className="h-4 w-4" />
          <span className="hidden sm:inline">Cards</span>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
