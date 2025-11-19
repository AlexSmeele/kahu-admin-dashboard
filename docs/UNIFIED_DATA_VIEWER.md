# UnifiedDataViewer Component

## Overview

The `UnifiedDataViewer` is a comprehensive, reusable data table component designed for the Kahu Admin Dashboard. It provides multiple view modes, advanced filtering, sorting, pagination, bulk actions, and extensive customization options.

## Features

### Core Features
- ✅ **Multiple View Modes**: Table, List, and Cards views
- ✅ **Search & Filter**: Global search across all columns with optional custom filters
- ✅ **Sorting**: Multi-column sorting with visual indicators
- ✅ **Pagination**: Configurable page sizes with navigation controls
- ✅ **Row Selection**: Single and bulk selection with checkbox support
- ✅ **Column Management**: Show/hide columns with visibility toggle
- ✅ **Bulk Actions**: Delete and export selected records
- ✅ **CSV Export**: Export all or selected data to CSV format
- ✅ **Mobile Responsive**: Fully responsive design for all screen sizes
- ✅ **Custom Rendering**: Support for custom cell and card renderers
- ✅ **Loading States**: Built-in loading indicators

### Mobile Responsiveness
- Header actions stack vertically on mobile devices
- Table view uses horizontal ScrollArea for small screens
- Cards view adapts from 1 to 3 columns based on screen size
- Pagination controls stack on mobile
- Touch-friendly 44px minimum touch targets
- Responsive text labels (hidden on mobile for icons)

## Installation

The component is already integrated into the admin dashboard. No additional installation required.

## Basic Usage

```tsx
import { UnifiedDataViewer } from "@/components/admin/UnifiedDataViewer";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  created_at: string;
}

export function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const columns = [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      minWidth: 200,
    },
    {
      key: 'email',
      label: 'Email',
      sortable: true,
    },
    {
      key: 'role',
      label: 'Role',
      sortable: true,
      render: (value) => (
        <Badge variant="secondary">{value}</Badge>
      ),
    },
  ];

  return (
    <UnifiedDataViewer
      title="Users"
      description="Manage user accounts"
      data={users}
      loading={loading}
      columns={columns}
      onRowClick={(user) => navigate(`/users/${user.id}`)}
      onAdd={() => navigate('/users/new')}
      onRefresh={loadUsers}
      enableSearch
      enableViews
      enablePagination
      pageSize={20}
    />
  );
}
```

## Props Reference

### Data Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `data` | `T[]` | required | Array of data records to display |
| `loading` | `boolean` | `false` | Shows loading state |
| `columns` | `Column<T>[]` | required | Column configuration array |

### Action Props

| Prop | Type | Description |
|------|------|-------------|
| `onRowClick` | `(record: T) => void` | Callback when a row is clicked |
| `onAdd` | `() => void` | Callback for add button (shows button if provided) |
| `onDelete` | `(record: T) => void` | Callback for single record deletion |
| `onBulkDelete` | `(records: T[]) => void` | Callback for bulk deletion |
| `onReorder` | `() => void` | Callback for reorder button |
| `onRefresh` | `() => void` | Callback for refresh button |
| `onExport` | `() => void` | Callback for export button |

### Configuration Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string` | required | Page/section title |
| `description` | `string` | `undefined` | Optional description text |
| `searchPlaceholder` | `string` | `"Search..."` | Placeholder for search input |
| `enableSearch` | `boolean` | `true` | Enable global search |
| `enableViews` | `boolean` | `true` | Enable view mode switcher |
| `enablePagination` | `boolean` | `false` | Enable pagination controls |
| `enableRowSelection` | `boolean` | `false` | Enable row checkboxes |
| `enableBulkActions` | `boolean` | `false` | Enable bulk action bar |
| `defaultView` | `'table' \| 'list' \| 'cards'` | `'table'` | Default view mode |
| `pageSize` | `number` | `20` | Items per page |
| `renderCard` | `(record: T) => ReactNode` | `undefined` | Custom card renderer |
| `customFilters` | `ReactNode` | `undefined` | Custom filter components |

## Column Configuration

The `Column<T>` interface provides extensive customization options:

```tsx
interface Column<T> {
  key: keyof T | string;          // Data property key
  label: string;                   // Column header label
  sortable?: boolean;              // Enable sorting
  filterable?: boolean;            // Enable filtering
  width?: number;                  // Fixed width in pixels
  minWidth?: number;               // Minimum width in pixels
  maxWidth?: number;               // Maximum width in pixels
  render?: (value: any, record: T) => ReactNode; // Custom renderer
  filterType?: 'text' | 'select' | 'multiselect' | 'date' | 'number';
  filterOptions?: { label: string; value: any }[];
}
```

### Column Examples

```tsx
// Basic column
{
  key: 'name',
  label: 'Name',
  sortable: true,
}

// Column with custom rendering
{
  key: 'status',
  label: 'Status',
  sortable: true,
  render: (value) => (
    <Badge variant={value === 'active' ? 'default' : 'secondary'}>
      {value}
    </Badge>
  ),
}

// Column with width constraints
{
  key: 'email',
  label: 'Email Address',
  sortable: true,
  minWidth: 200,
  maxWidth: 400,
}

// Column with complex rendering
{
  key: 'is_published',
  label: 'Published',
  render: (value, record) => (
    <Switch
      checked={value}
      onCheckedChange={() => handleToggle(record.id)}
    />
  ),
}
```

## View Modes

### Table View
- Traditional table layout with sortable headers
- Row selection checkboxes
- Horizontal scroll on mobile
- Best for data-dense displays

### List View
- Compact list layout
- Prioritizes first column as title
- Shows secondary info inline
- Displays badges for additional fields
- Best for mobile and quick scanning

### Cards View
- Grid-based card layout (1-3 columns responsive)
- Custom card rendering support
- Default card layout uses first 8 columns:
  - Column 1: Card title
  - Column 2: Card description
  - Columns 3-5: Content fields
  - Columns 6-8: Badge fields
- Best for visual browsing

## Advanced Features

### Custom Filters

Add custom filter UI alongside the search input:

```tsx
<UnifiedDataViewer
  {...props}
  customFilters={
    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
      <SelectTrigger className="w-48">
        <SelectValue placeholder="Filter by category" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Categories</SelectItem>
        <SelectItem value="foundation">Foundation</SelectItem>
        <SelectItem value="advanced">Advanced</SelectItem>
      </SelectContent>
    </Select>
  }
/>
```

### Custom Card Rendering

Provide complete control over card appearance:

```tsx
<UnifiedDataViewer
  {...props}
  defaultView="cards"
  renderCard={(record) => (
    <Card>
      <CardHeader>
        <CardTitle>{record.name}</CardTitle>
        <Badge>{record.category}</Badge>
      </CardHeader>
      <CardContent>
        <p>{record.description}</p>
        <div className="flex gap-2 mt-4">
          <Button size="sm">Edit</Button>
          <Button size="sm" variant="outline">View</Button>
        </div>
      </CardContent>
    </Card>
  )}
/>
```

### Bulk Actions

Enable row selection and bulk operations:

```tsx
const handleBulkDelete = async (records: Skill[]) => {
  const ids = records.map(r => r.id);
  await supabase.from('skills').delete().in('id', ids);
  toast.success(`Deleted ${records.length} items`);
  loadData();
};

<UnifiedDataViewer
  {...props}
  enableRowSelection
  enableBulkActions
  onBulkDelete={handleBulkDelete}
/>
```

### Column Visibility

Users can toggle column visibility via the Columns dropdown menu. The component ensures at least one column remains visible.

### CSV Export

Export functionality is built-in:
- Export button exports all filtered/sorted data
- Bulk export exports only selected rows
- Respects column visibility settings
- Handles nested objects and arrays
- Generates timestamped filenames

## Integration Examples

### Example 1: Skills Management

```tsx
// src/pages/admin/training/Skills.tsx
<UnifiedDataViewer
  title="Skills"
  description="Manage training skills and prerequisites"
  data={skills}
  loading={loading}
  columns={[
    { key: 'name', label: 'Skill Name', sortable: true, minWidth: 200 },
    { key: 'category', label: 'Category', sortable: true },
    { key: 'difficulty_level', label: 'Difficulty', sortable: true },
  ]}
  onRowClick={(skill) => navigate(`/admin/training/skills/${skill.id}`)}
  onAdd={() => setShowAddDialog(true)}
  onReorder={() => setShowReorderDialog(true)}
  onRefresh={loadSkills}
  onExport={() => {}}
  enableSearch
  enableViews
  enablePagination
  searchPlaceholder="Search skills..."
  defaultView="table"
  pageSize={50}
/>
```

### Example 2: With Custom Filters

```tsx
// src/pages/admin/training/Modules.tsx
const [categoryFilter, setCategoryFilter] = useState('all');

<UnifiedDataViewer
  title="Foundation Modules"
  data={filteredModules}
  columns={columns}
  customFilters={
    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
      <SelectTrigger className="w-48">
        <SelectValue placeholder="All Categories" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Categories</SelectItem>
        {categories.map(cat => (
          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  }
  {...otherProps}
/>
```

## Styling & Theming

The component uses the design system tokens from `index.css` and `tailwind.config.ts`:

- `background` / `foreground` for surfaces and text
- `muted` / `muted-foreground` for secondary UI
- `border` for dividers and outlines
- `primary` / `primary-foreground` for primary actions
- `destructive` for delete actions

All colors use HSL format and support dark mode automatically.

## Performance Considerations

- **Pagination**: Enable `enablePagination` for large datasets (>100 records)
- **Custom Renderers**: Keep render functions lightweight to avoid performance issues
- **Search**: Global search is client-side; consider server-side search for very large datasets
- **Row Selection**: Disable `enableRowSelection` if not needed to reduce re-renders

## Accessibility

- Semantic HTML structure (`<table>`, `<nav>`, etc.)
- Keyboard navigation support
- Screen reader labels on interactive elements
- Focus indicators on all controls
- Minimum 44px touch targets for mobile

## Migration Guide

To migrate existing table pages to `UnifiedDataViewer`:

1. **Import the component**:
   ```tsx
   import { UnifiedDataViewer } from "@/components/admin/UnifiedDataViewer";
   ```

2. **Define column configuration**:
   ```tsx
   const columns = [
     { key: 'name', label: 'Name', sortable: true },
     // ... other columns
   ];
   ```

3. **Replace existing table UI**:
   ```tsx
   <UnifiedDataViewer
     title="Your Title"
     data={data}
     columns={columns}
     onRowClick={handleRowClick}
     {...otherProps}
   />
   ```

4. **Remove old state management** for search, sort, pagination (handled by component)

5. **Test all view modes** and responsive behavior

## Troubleshooting

### Issue: Columns not showing
- Ensure each column has a unique `key` property
- Verify `data` array contains objects with matching keys
- Check column visibility hasn't been toggled off

### Issue: Search not working
- Verify `enableSearch={true}` is set
- Ensure data is loaded (not in loading state)
- Check data contains searchable text fields

### Issue: Pagination not appearing
- Set `enablePagination={true}`
- Verify data array has more items than `pageSize`

### Issue: Row selection not working
- Set `enableRowSelection={true}`
- Ensure records have an `id` property
- For bulk actions, also set `enableBulkActions={true}`

## Future Enhancements

Planned features for future releases:
- Server-side pagination support
- Advanced filtering with filter builder UI
- Column resizing with drag handles
- Row drag-and-drop reordering
- Expandable row details
- Sticky headers for table view
- Virtualized scrolling for large datasets

## Support

For issues or questions about the UnifiedDataViewer component:
1. Check this documentation first
2. Review existing implementations in `/src/pages/admin/`
3. Consult the codebase at `/src/components/admin/UnifiedDataViewer.tsx`
