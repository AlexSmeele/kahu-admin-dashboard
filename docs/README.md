# Kahu Admin Dashboard Documentation

## Overview

This directory contains comprehensive documentation for the Kahu Admin Dashboard, with a focus on the UnifiedDataViewer component system.

## Documentation Index

### 📖 [UnifiedDataViewer Guide](./UNIFIED_DATA_VIEWER.md)
Complete reference documentation for the UnifiedDataViewer component, including:
- Feature overview and capabilities
- Props reference and configuration options
- Column configuration guide
- View modes (Table, List, Cards)
- Advanced features (search, sort, pagination, bulk actions)
- Mobile responsiveness guidelines
- Styling and theming
- Migration guide from legacy table implementations
- Troubleshooting common issues

**Read this first** if you're implementing a new table page or learning about the component.

### ✅ [Testing & Validation](./UNIFIED_DATA_VIEWER_TESTING.md)
Comprehensive testing checklist and validation guide:
- Phase-by-phase implementation checklist
- Manual testing scenarios
- Browser compatibility testing
- Accessibility testing guidelines
- Performance benchmarks
- Known issues and resolutions

**Use this** to validate your implementation or troubleshoot issues.

### 💡 [Examples & Recipes](./UNIFIED_DATA_VIEWER_EXAMPLES.md)
Practical, copy-paste code examples:
- Basic table setup
- Custom rendering (badges, switches, formatted values)
- Cards view with images
- Bulk actions implementation
- Custom filters integration
- Pagination setup
- Full-featured example with all options
- Quick reference guide

**Start here** for practical implementation patterns and code snippets.

## Quick Start

### 1. Basic Implementation

```tsx
import { UnifiedDataViewer } from "@/components/admin/UnifiedDataViewer";

<UnifiedDataViewer
  title="My Data Table"
  data={data}
  loading={loading}
  columns={[
    { key: 'name', label: 'Name', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
  ]}
  onRowClick={(record) => navigate(`/detail/${record.id}`)}
  enableSearch
  enableViews
/>
```

### 2. With All Features

```tsx
<UnifiedDataViewer
  title="Complete Example"
  data={data}
  columns={columns}
  onRowClick={handleRowClick}
  onAdd={handleAdd}
  onRefresh={handleRefresh}
  onBulkDelete={handleBulkDelete}
  enableSearch
  enableViews
  enablePagination
  enableRowSelection
  enableBulkActions
  pageSize={50}
/>
```

## Component Architecture

```
UnifiedDataViewer/
├── UnifiedDataViewer.tsx          # Main component
└── unified-viewer/
    ├── TableView.tsx              # Table view mode
    ├── ListView.tsx               # List view mode
    ├── CardsView.tsx              # Cards view mode
    ├── ViewModeTabs.tsx           # View mode switcher
    ├── PaginationControls.tsx     # Pagination UI
    ├── BulkActionBar.tsx          # Bulk actions UI
    └── ColumnVisibilityMenu.tsx   # Column toggle menu
```

## Features at a Glance

| Feature | Status | Description |
|---------|--------|-------------|
| 📊 Table View | ✅ Complete | Traditional sortable table with row selection |
| 📋 List View | ✅ Complete | Compact list layout for mobile |
| 🎴 Cards View | ✅ Complete | Grid-based cards with custom rendering |
| 🔍 Global Search | ✅ Complete | Client-side search across all columns |
| ↕️ Multi-column Sort | ✅ Complete | Click headers to sort with visual indicators |
| 📄 Pagination | ✅ Complete | Configurable page sizes and navigation |
| ☑️ Row Selection | ✅ Complete | Single and bulk selection with checkboxes |
| 🗑️ Bulk Actions | ✅ Complete | Delete and export selected records |
| 👁️ Column Visibility | ✅ Complete | Show/hide columns with toggle menu |
| 📤 CSV Export | ✅ Complete | Export all or selected data to CSV |
| 📱 Mobile Responsive | ✅ Complete | Full mobile support with touch targets |
| 🎨 Custom Rendering | ✅ Complete | Custom cell and card renderers |
| 🔧 Custom Filters | ✅ Complete | Integrate custom filter components |

## Implementation Status

### ✅ Completed Integrations
- **Skills Management** (`/admin/training/skills`)
- **Foundation Modules** (`/admin/training/modules`)
- **Dog Breeds** (`/admin/dogs/breeds`)

### 🚧 Planned Integrations
- Troubleshooting Modules
- Vaccines Management
- Treatments Management
- Users Management
- Media Assets
- Invitations
- Dynamic Content Tables

## Development Guidelines

### When to Use UnifiedDataViewer

✅ **Use for:**
- Any page displaying tabular/list data
- Data that needs search/filter/sort
- Pages with CRUD operations
- Admin management interfaces
- Data browsing and exploration

❌ **Don't use for:**
- Complex forms with nested inputs
- Single-record detail pages
- Highly specialized custom layouts
- Real-time dashboards with charts

### Best Practices

1. **Always provide unique IDs** on records for row selection
2. **Use minWidth on important columns** to prevent truncation
3. **Enable pagination for large datasets** (>100 records)
4. **Implement loading states** for better UX
5. **Test on mobile devices** to ensure touch usability
6. **Use custom renderers** for complex data types
7. **Follow design system tokens** for consistent styling

### Performance Considerations

- Enable pagination for datasets with >100 records
- Keep custom render functions lightweight
- Consider server-side search for very large datasets
- Disable unused features to reduce complexity

## Migration Guide

To migrate an existing table page:

1. **Import the component**:
   ```tsx
   import { UnifiedDataViewer } from "@/components/admin/UnifiedDataViewer";
   ```

2. **Define columns**:
   ```tsx
   const columns = [
     { key: 'name', label: 'Name', sortable: true },
     // ... more columns
   ];
   ```

3. **Replace existing table UI**:
   ```tsx
   <UnifiedDataViewer
     title="Page Title"
     data={data}
     columns={columns}
     {...otherProps}
   />
   ```

4. **Remove old state** for search/sort/pagination
5. **Test all view modes** and mobile layout

## Support & Resources

- **Component Source**: `src/components/admin/UnifiedDataViewer.tsx`
- **Type Definitions**: See `Column<T>` and `UnifiedDataViewerProps<T>` interfaces
- **Live Examples**: Check `/admin/training/skills` or `/admin/dogs/breeds`
- **Design System**: `src/index.css` and `tailwind.config.ts`

## Contributing

When adding new features to UnifiedDataViewer:

1. Update the main component and relevant subcomponents
2. Add comprehensive TypeScript types
3. Update documentation in this directory
4. Add practical examples to the examples guide
5. Update the testing checklist
6. Test on mobile devices
7. Verify accessibility with keyboard navigation

## Version History

- **v1.0** (2025-11) - Initial implementation
  - Core architecture with TypeScript generics
  - Three view modes (Table, List, Cards)
  - Search, sort, and pagination
  - Bulk actions and CSV export
  - Full mobile responsiveness
  - Integration with Skills, Modules, and Breeds pages

## Future Enhancements

Planned features for future releases:
- Server-side pagination support
- Advanced filtering with filter builder UI
- Column resizing with drag handles
- Row drag-and-drop reordering
- Expandable row details
- Sticky headers for table view
- Virtualized scrolling for large datasets
- More customization options

---

**Last Updated**: November 2025  
**Maintained By**: Kahu Development Team
