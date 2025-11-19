import { useState, useMemo, useEffect } from "react";
import { Plus, RefreshCw, ArrowUpDown, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TableView } from "./unified-viewer/TableView";
import { ListView } from "./unified-viewer/ListView";
import { CardsView } from "./unified-viewer/CardsView";
import { ViewModeTabs } from "./unified-viewer/ViewModeTabs";
import { PaginationControls } from "./unified-viewer/PaginationControls";
import { BulkActionBar } from "./unified-viewer/BulkActionBar";
import { ColumnVisibilityMenu } from "./unified-viewer/ColumnVisibilityMenu";
import { exportToCSV } from "@/lib/export";

export interface Column<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  render?: (value: any, record: T) => React.ReactNode;
  filterType?: 'text' | 'select' | 'multiselect' | 'date' | 'number';
  filterOptions?: { label: string; value: any }[];
}

export interface UnifiedDataViewerProps<T> {
  // Data
  data: T[];
  loading?: boolean;
  
  // Columns
  columns: Column<T>[];
  
  // Actions
  onRowClick?: (record: T) => void;
  onAdd?: () => void;
  onDelete?: (record: T) => void;
  onBulkDelete?: (records: T[]) => void;
  onReorder?: () => void;
  onRefresh?: () => void;
  onExport?: () => void;
  
  // Configuration
  title: string;
  description?: string;
  searchPlaceholder?: string;
  enableSearch?: boolean;
  enableViews?: boolean;
  enablePagination?: boolean;
  enableRowSelection?: boolean;
  enableColumnResize?: boolean;
  enableBulkActions?: boolean;
  defaultView?: 'table' | 'list' | 'cards';
  pageSize?: number;
  
  // Card view rendering
  renderCard?: (record: T) => React.ReactNode;
  
  // Custom filters
  customFilters?: React.ReactNode;
}

export function UnifiedDataViewer<T extends Record<string, any>>({
  data,
  loading = false,
  columns,
  onRowClick,
  onAdd,
  onDelete,
  onBulkDelete,
  onReorder,
  onRefresh,
  onExport,
  title,
  description,
  searchPlaceholder = "Search...",
  enableSearch = true,
  enableViews = true,
  enablePagination = false,
  enableRowSelection = false,
  enableColumnResize = false,
  enableBulkActions = false,
  defaultView = 'table',
  pageSize = 20,
  renderCard,
  customFilters,
}: UnifiedDataViewerProps<T>) {
  // State management
  const [viewMode, setViewMode] = useState<'table' | 'list' | 'cards'>(defaultView);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{ field: string; direction: 'asc' | 'desc' } | null>(null);
  const [selectedRows, setSelectedRows] = useState<Set<string | number>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(pageSize);
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    new Set(columns.map(c => String(c.key)))
  );

  // Reset to first page when search or sort changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortConfig]);

  // Search and filter logic
  const filteredData = useMemo(() => {
    if (!enableSearch || !searchTerm.trim()) return data;

    const lowerSearch = searchTerm.toLowerCase();
    return data.filter((record) => {
      return columns.some((column) => {
        const value = record[column.key as keyof T];
        if (value == null) return false;
        return String(value).toLowerCase().includes(lowerSearch);
      });
    });
  }, [data, searchTerm, columns, enableSearch]);

  // Sort logic
  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData;

    const sorted = [...filteredData].sort((a, b) => {
      const aVal = a[sortConfig.field];
      const bVal = b[sortConfig.field];

      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortConfig.direction === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
      }

      return 0;
    });

    return sorted;
  }, [filteredData, sortConfig]);

  // Handle sort
  const handleSort = (field: string) => {
    setSortConfig((current) => {
      if (!current || current.field !== field) {
        return { field, direction: 'asc' };
      }
      if (current.direction === 'asc') {
        return { field, direction: 'desc' };
      }
      return null; // Clear sort
    });
  };

  // Pagination logic
  const paginatedData = useMemo(() => {
    if (!enablePagination) return sortedData;
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return sortedData.slice(start, end);
  }, [sortedData, currentPage, itemsPerPage, enablePagination]);

  const totalPages = Math.ceil(sortedData.length / itemsPerPage);

  // Handle row selection
  const handleRowSelect = (id: string | number) => {
    setSelectedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    const currentData = enablePagination ? paginatedData : sortedData;
    if (selectedRows.size === currentData.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(currentData.map((record) => record.id)));
    }
  };

  const handleBulkDelete = () => {
    if (onBulkDelete) {
      const selectedRecords = sortedData.filter((record) => selectedRows.has(record.id));
      onBulkDelete(selectedRecords);
      setSelectedRows(new Set());
    }
  };

  const handleBulkExport = () => {
    const selectedRecords = sortedData.filter((record) => selectedRows.has(record.id));
    const visibleCols = columns.filter(c => visibleColumns.has(String(c.key)));
    exportToCSV(selectedRecords, `${title.toLowerCase().replace(/\s/g, '-')}-export`, visibleCols);
  };

  const handleExport = () => {
    const visibleCols = columns.filter(c => visibleColumns.has(String(c.key)));
    exportToCSV(sortedData, `${title.toLowerCase().replace(/\s/g, '-')}-export`, visibleCols);
  };

  const handleToggleColumn = (key: string) => {
    setVisibleColumns((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        if (newSet.size > 1) { // Keep at least one column visible
          newSet.delete(key);
        }
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  const handleResetColumns = () => {
    setVisibleColumns(new Set(columns.map(c => String(c.key))));
  };

  const displayData = enablePagination ? paginatedData : sortedData;
  const visibleColumnsArray = columns.filter(c => visibleColumns.has(String(c.key)));

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>{title}</CardTitle>
              {description && <CardDescription className="mt-1">{description}</CardDescription>}
            </div>
            <div className="flex flex-wrap gap-2">
              <ColumnVisibilityMenu
                columns={columns}
                visibleColumns={visibleColumns}
                onToggleColumn={handleToggleColumn}
                onResetColumns={handleResetColumns}
              />
              {onExport && (
                <Button variant="outline" size="sm" onClick={handleExport}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              )}
              {onReorder && (
                <Button variant="outline" size="sm" onClick={onReorder}>
                  <ArrowUpDown className="h-4 w-4 mr-2" />
                  Reorder
                </Button>
              )}
              {onRefresh && (
                <Button variant="outline" size="sm" onClick={onRefresh}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              )}
              {onAdd && (
                <Button size="sm" onClick={onAdd}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and View Switcher */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            {enableSearch && (
              <div className="w-full md:w-96">
                <Input
                  placeholder={searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
            )}
            {enableViews && (
              <ViewModeTabs viewMode={viewMode} onViewModeChange={setViewMode} />
            )}
          </div>

          {/* Custom Filters */}
          {customFilters && <div className="flex flex-wrap gap-2">{customFilters}</div>}

          {/* Bulk Action Bar */}
          {enableBulkActions && (
            <BulkActionBar
              selectedCount={selectedRows.size}
              onClearSelection={() => setSelectedRows(new Set())}
              onBulkDelete={onBulkDelete ? handleBulkDelete : undefined}
              onBulkExport={handleBulkExport}
            />
          )}

          {/* Data Display */}
          {loading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              Loading...
            </div>
          ) : displayData.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              {searchTerm ? "No results found" : "No data available"}
            </div>
          ) : (
            <>
              {viewMode === 'table' && (
                <TableView
                  data={displayData}
                  columns={visibleColumnsArray}
                  sortConfig={sortConfig}
                  onSort={handleSort}
                  onRowClick={onRowClick}
                  enableRowSelection={enableRowSelection}
                  selectedRows={selectedRows}
                  onRowSelect={handleRowSelect}
                  onSelectAll={handleSelectAll}
                />
              )}
              {viewMode === 'list' && (
                <ListView
                  data={displayData}
                  columns={visibleColumnsArray}
                  onRowClick={onRowClick}
                />
              )}
              {viewMode === 'cards' && (
                <CardsView
                  data={displayData}
                  columns={visibleColumnsArray}
                  onRowClick={onRowClick}
                  renderCard={renderCard}
                />
              )}

              {/* Pagination */}
              {enablePagination && sortedData.length > 0 && (
                <PaginationControls
                  currentPage={currentPage}
                  totalPages={totalPages}
                  pageSize={itemsPerPage}
                  totalItems={sortedData.length}
                  onPageChange={setCurrentPage}
                  onPageSizeChange={(size) => {
                    setItemsPerPage(size);
                    setCurrentPage(1);
                  }}
                />
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
