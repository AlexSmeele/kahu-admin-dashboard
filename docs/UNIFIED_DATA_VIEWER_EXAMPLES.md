# UnifiedDataViewer - Real-World Examples

This document provides practical, copy-paste examples for common use cases of the UnifiedDataViewer component in the Kahu Admin Dashboard.

## Table of Contents
1. [Basic Table](#basic-table)
2. [Table with Custom Rendering](#table-with-custom-rendering)
3. [Cards View with Images](#cards-view-with-images)
4. [With Bulk Actions](#with-bulk-actions)
5. [With Custom Filters](#with-custom-filters)
6. [With Pagination](#with-pagination)
7. [Full-Featured Example](#full-featured-example)

---

## Basic Table

Simple read-only table with search and sorting.

```tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { UnifiedDataViewer } from "@/components/admin/UnifiedDataViewer";
import { toast } from "sonner";

interface Breed {
  id: string;
  breed: string;
  origin: string | null;
  temperament: string | null;
  life_span_years: string | null;
}

export default function AdminBreeds() {
  const navigate = useNavigate();
  const [breeds, setBreeds] = useState<Breed[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBreeds();
  }, []);

  const loadBreeds = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("dog_breeds")
        .select("id, breed, origin, temperament, life_span_years")
        .order("breed", { ascending: true });

      if (error) throw error;
      setBreeds(data || []);
    } catch (error) {
      console.error("Error loading breeds:", error);
      toast.error("Failed to load breeds");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8">
      <UnifiedDataViewer
        title="Dog Breeds"
        description="Browse breed information and characteristics"
        data={breeds}
        loading={loading}
        columns={[
          {
            key: 'breed',
            label: 'Breed Name',
            sortable: true,
            minWidth: 200,
          },
          {
            key: 'origin',
            label: 'Origin',
            sortable: true,
            render: (val) => val || '-',
          },
          {
            key: 'life_span_years',
            label: 'Life Span',
            sortable: true,
            render: (val) => val ? `${val} years` : '-',
          },
          {
            key: 'temperament',
            label: 'Temperament',
            render: (val) => (
              <span className="text-sm text-muted-foreground line-clamp-2">
                {val || '-'}
              </span>
            ),
          },
        ]}
        onRowClick={(breed) => navigate(`/admin/dogs/breeds/${breed.id}`)}
        onRefresh={loadBreeds}
        enableSearch
        enableViews
        searchPlaceholder="Search breeds..."
        defaultView="table"
        pageSize={50}
      />
    </div>
  );
}
```

---

## Table with Custom Rendering

Advanced table with badges, switches, and formatted values.

```tsx
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { UnifiedDataViewer } from "@/components/admin/UnifiedDataViewer";

interface Module {
  id: string;
  name: string;
  category: string;
  estimated_minutes: number;
  is_published: boolean;
  order_index: number;
}

export default function AdminModules() {
  const [modules, setModules] = useState<Module[]>([]);
  
  const togglePublished = async (id: string, currentState: boolean) => {
    const { error } = await supabase
      .from('foundation_modules')
      .update({ is_published: !currentState })
      .eq('id', id);
    
    if (error) {
      toast.error('Failed to update module');
    } else {
      toast.success('Module updated');
      loadModules();
    }
  };

  return (
    <UnifiedDataViewer
      title="Foundation Modules"
      data={modules}
      loading={loading}
      columns={[
        {
          key: 'name',
          label: 'Module Name',
          sortable: true,
          minWidth: 250,
        },
        {
          key: 'category',
          label: 'Category',
          sortable: true,
          width: 150,
          render: (value) => (
            <Badge variant="secondary" className="capitalize">
              {value}
            </Badge>
          ),
        },
        {
          key: 'estimated_minutes',
          label: 'Duration',
          sortable: true,
          width: 100,
          render: (value) => `${value} min`,
        },
        {
          key: 'order_index',
          label: 'Order',
          sortable: true,
          width: 80,
        },
        {
          key: 'is_published',
          label: 'Published',
          width: 100,
          render: (value, record) => (
            <Switch
              checked={value}
              onCheckedChange={() => togglePublished(record.id, value)}
              onClick={(e) => e.stopPropagation()}
            />
          ),
        },
      ]}
      onRowClick={(module) => navigate(`/admin/training/modules/${module.id}`)}
      onAdd={() => setShowAddDialog(true)}
      onReorder={() => setShowReorderDialog(true)}
      onRefresh={loadModules}
      enableSearch
      enableViews
      enablePagination
      pageSize={20}
    />
  );
}
```

---

## Cards View with Images

Cards view optimized for visual content.

```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UnifiedDataViewer } from "@/components/admin/UnifiedDataViewer";

interface Skill {
  id: string;
  name: string;
  category: string;
  difficulty_level: string;
  brief_description: string;
  estimated_minutes: number;
}

export default function AdminSkills() {
  return (
    <UnifiedDataViewer
      title="Training Skills"
      data={skills}
      columns={[
        { key: 'name', label: 'Skill Name' },
        { key: 'brief_description', label: 'Description' },
        { key: 'category', label: 'Category' },
        { key: 'difficulty_level', label: 'Difficulty' },
        { key: 'estimated_minutes', label: 'Duration' },
      ]}
      defaultView="cards"
      enableViews
      renderCard={(skill) => (
        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-start justify-between">
              <CardTitle className="text-lg">{skill.name}</CardTitle>
              <Badge variant="outline">{skill.difficulty_level}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground line-clamp-3">
              {skill.brief_description}
            </p>
            <div className="flex items-center justify-between text-sm">
              <Badge variant="secondary">{skill.category}</Badge>
              <span className="text-muted-foreground">
                {skill.estimated_minutes} min
              </span>
            </div>
          </CardContent>
        </Card>
      )}
      onRowClick={(skill) => navigate(`/admin/training/skills/${skill.id}`)}
      enableSearch
    />
  );
}
```

---

## With Bulk Actions

Enable row selection and bulk operations.

```tsx
import { UnifiedDataViewer } from "@/components/admin/UnifiedDataViewer";
import { toast } from "sonner";

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);

  const handleBulkDelete = async (selectedUsers: User[]) => {
    const ids = selectedUsers.map(u => u.id);
    
    const { error } = await supabase
      .from('profiles')
      .delete()
      .in('id', ids);
    
    if (error) {
      toast.error('Failed to delete users');
    } else {
      toast.success(`Deleted ${selectedUsers.length} users`);
      loadUsers();
    }
  };

  return (
    <UnifiedDataViewer
      title="Users"
      data={users}
      columns={[
        { key: 'display_name', label: 'Name', sortable: true },
        { key: 'email', label: 'Email', sortable: true },
        { key: 'role', label: 'Role', sortable: true },
      ]}
      enableRowSelection
      enableBulkActions
      onBulkDelete={handleBulkDelete}
      onRowClick={(user) => navigate(`/admin/users/${user.id}`)}
      enableSearch
      enablePagination
      pageSize={50}
    />
  );
}
```

---

## With Custom Filters

Add custom filter dropdowns alongside search.

```tsx
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UnifiedDataViewer } from "@/components/admin/UnifiedDataViewer";

export default function AdminSkills() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [difficultyFilter, setDifficultyFilter] = useState("all");

  // Apply filters to data
  const filteredSkills = useMemo(() => {
    let filtered = skills;
    
    if (categoryFilter !== "all") {
      filtered = filtered.filter(s => s.category === categoryFilter);
    }
    
    if (difficultyFilter !== "all") {
      filtered = filtered.filter(s => s.difficulty_level === difficultyFilter);
    }
    
    return filtered;
  }, [skills, categoryFilter, difficultyFilter]);

  return (
    <UnifiedDataViewer
      title="Skills"
      data={filteredSkills}
      columns={[
        { key: 'name', label: 'Skill Name', sortable: true },
        { key: 'category', label: 'Category', sortable: true },
        { key: 'difficulty_level', label: 'Difficulty', sortable: true },
      ]}
      customFilters={
        <>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="Foundation">Foundation</SelectItem>
              <SelectItem value="Obedience">Obedience</SelectItem>
              <SelectItem value="Socialization">Socialization</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Difficulties" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Difficulties</SelectItem>
              <SelectItem value="Beginner">Beginner</SelectItem>
              <SelectItem value="Intermediate">Intermediate</SelectItem>
              <SelectItem value="Advanced">Advanced</SelectItem>
            </SelectContent>
          </Select>
        </>
      }
      enableSearch
      enableViews
    />
  );
}
```

---

## With Pagination

Large dataset with pagination and page size control.

```tsx
import { UnifiedDataViewer } from "@/components/admin/UnifiedDataViewer";

export default function AdminInvites() {
  const [invites, setInvites] = useState<Invite[]>([]);

  return (
    <UnifiedDataViewer
      title="Invitation Codes"
      description="Manage family and group invitation codes"
      data={invites}
      loading={loading}
      columns={[
        {
          key: 'code',
          label: 'Invite Code',
          sortable: true,
          width: 150,
        },
        {
          key: 'created_at',
          label: 'Created',
          sortable: true,
          render: (val) => new Date(val).toLocaleDateString(),
        },
        {
          key: 'expires_at',
          label: 'Expires',
          sortable: true,
          render: (val) => val ? new Date(val).toLocaleDateString() : 'Never',
        },
        {
          key: 'max_uses',
          label: 'Max Uses',
          sortable: true,
        },
        {
          key: 'times_used',
          label: 'Used',
          sortable: true,
        },
      ]}
      onRowClick={(invite) => navigate(`/admin/invites/${invite.id}`)}
      onAdd={() => setShowCreateDialog(true)}
      onRefresh={loadInvites}
      enableSearch
      enablePagination
      pageSize={25}
      searchPlaceholder="Search invite codes..."
    />
  );
}
```

---

## Full-Featured Example

Complete example with all features enabled.

```tsx
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { UnifiedDataViewer } from "@/components/admin/UnifiedDataViewer";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SkillReorderDialog } from "@/components/admin/training/SkillReorderDialog";
import { toast } from "sonner";

interface Skill {
  id: string;
  name: string;
  category: string;
  difficulty_level: string;
  brief_description: string;
  detailed_description: string;
  estimated_minutes: number;
  priority_order: number;
}

export default function AdminSkills() {
  const navigate = useNavigate();
  
  // State
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showReorderDialog, setShowReorderDialog] = useState(false);

  // Load data
  useEffect(() => {
    loadSkills();
  }, []);

  const loadSkills = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("skills")
        .select("*")
        .order("priority_order", { ascending: true });

      if (error) throw error;
      setSkills(data || []);
    } catch (error) {
      console.error("Error loading skills:", error);
      toast.error("Failed to load skills");
    } finally {
      setLoading(false);
    }
  };

  // Apply category filter
  const filteredSkills = useMemo(() => {
    if (categoryFilter === "all") return skills;
    return skills.filter(s => s.category === categoryFilter);
  }, [skills, categoryFilter]);

  // Bulk delete handler
  const handleBulkDelete = async (selectedSkills: Skill[]) => {
    const ids = selectedSkills.map(s => s.id);
    
    const { error } = await supabase
      .from('skills')
      .delete()
      .in('id', ids);
    
    if (error) {
      toast.error('Failed to delete skills');
    } else {
      toast.success(`Deleted ${selectedSkills.length} skills`);
      loadSkills();
    }
  };

  return (
    <div className="p-4 md:p-8">
      <UnifiedDataViewer
        title="Training Skills"
        description="Manage skill library and prerequisites"
        data={filteredSkills}
        loading={loading}
        columns={[
          {
            key: 'priority_order',
            label: '#',
            sortable: true,
            width: 60,
          },
          {
            key: 'name',
            label: 'Skill Name',
            sortable: true,
            minWidth: 200,
          },
          {
            key: 'category',
            label: 'Category',
            sortable: true,
            width: 150,
            render: (value) => (
              <Badge variant="secondary" className="capitalize">
                {value}
              </Badge>
            ),
          },
          {
            key: 'difficulty_level',
            label: 'Difficulty',
            sortable: true,
            width: 120,
            render: (value) => {
              const variants: Record<string, any> = {
                'Beginner': 'default',
                'Intermediate': 'secondary',
                'Advanced': 'outline',
              };
              return (
                <Badge variant={variants[value] || 'default'}>
                  {value}
                </Badge>
              );
            },
          },
          {
            key: 'estimated_minutes',
            label: 'Duration',
            sortable: true,
            width: 100,
            render: (value) => `${value} min`,
          },
          {
            key: 'brief_description',
            label: 'Description',
            render: (value) => (
              <span className="text-sm text-muted-foreground line-clamp-2">
                {value || '-'}
              </span>
            ),
          },
        ]}
        customFilters={
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="Foundation">Foundation</SelectItem>
              <SelectItem value="Obedience">Obedience</SelectItem>
              <SelectItem value="Socialization">Socialization</SelectItem>
              <SelectItem value="Tricks">Tricks</SelectItem>
            </SelectContent>
          </Select>
        }
        onRowClick={(skill) => navigate(`/admin/training/skills/${skill.id}`)}
        onAdd={() => setShowAddDialog(true)}
        onReorder={() => setShowReorderDialog(true)}
        onRefresh={loadSkills}
        onExport={() => {}}
        onBulkDelete={handleBulkDelete}
        enableSearch
        enableViews
        enablePagination
        enableRowSelection
        enableBulkActions
        searchPlaceholder="Search skills..."
        defaultView="table"
        pageSize={50}
      />

      {/* Add Skill Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Skill</DialogTitle>
          </DialogHeader>
          {/* Add form here */}
        </DialogContent>
      </Dialog>

      {/* Reorder Dialog */}
      <SkillReorderDialog
        open={showReorderDialog}
        onOpenChange={setShowReorderDialog}
        onComplete={loadSkills}
      />
    </div>
  );
}
```

---

## Quick Reference

### Minimal Setup
```tsx
<UnifiedDataViewer
  title="My Data"
  data={data}
  columns={columns}
/>
```

### With Search
```tsx
<UnifiedDataViewer
  {...props}
  enableSearch
  searchPlaceholder="Search..."
/>
```

### With Pagination
```tsx
<UnifiedDataViewer
  {...props}
  enablePagination
  pageSize={20}
/>
```

### With Bulk Actions
```tsx
<UnifiedDataViewer
  {...props}
  enableRowSelection
  enableBulkActions
  onBulkDelete={handleBulkDelete}
/>
```

### With All Features
```tsx
<UnifiedDataViewer
  {...props}
  enableSearch
  enableViews
  enablePagination
  enableRowSelection
  enableBulkActions
  onRowClick={handleRowClick}
  onAdd={handleAdd}
  onRefresh={handleRefresh}
  onExport={handleExport}
  onBulkDelete={handleBulkDelete}
/>
```

---

## Tips & Best Practices

1. **Always provide unique IDs**: Ensure each record has an `id` property for row selection
2. **Use minWidth for text columns**: Prevents text truncation on important fields
3. **Implement loading states**: Always show loading indicator during data fetch
4. **Handle errors gracefully**: Use toast notifications for errors
5. **Enable pagination for large datasets**: Use pagination when displaying >100 records
6. **Custom renderers for complex data**: Use `render` function for badges, switches, dates
7. **Mobile-first design**: Test on mobile devices to ensure usability
8. **Accessible labels**: Provide meaningful `label` values for screen readers
