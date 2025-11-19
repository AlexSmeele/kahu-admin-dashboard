import { ReactNode, useEffect, useState } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  FileText,
  Image,
  Dog,
  Ticket,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Moon,
  Sun,
  Menu,
  Layers,
  Home,
  User,
  Database,
  Table,
  Folder,
  FolderOpen,
  Video,
  Music,
  File,
  FileCode,
  BookOpen,
  Book,
  BookMarked,
  Library,
  Bookmark,
  Tag,
  Tags,
  Package,
  Box,
  Archive,
  Calendar,
  Clock,
  Bell,
  Mail,
  MessageSquare,
  Phone,
  MapPin,
  Map,
  Globe,
  Compass,
  Heart,
  Star,
  Award,
  Trophy,
  Target,
  TrendingUp,
  BarChart,
  PieChart,
  Activity,
  Zap,
  Shield,
  Lock,
  Key,
  Eye,
  Flag,
  Grid,
  List,
  Layout,
  Sidebar,
  Wrench,
  Code,
  Terminal,
  Cpu,
  Palette,
  Paintbrush,
  Pencil,
  Edit,
  Trash,
  Plus,
  Minus,
  X,
  Check,
  Info,
  HelpCircle,
  AlertCircle,
  AlertTriangle,
  Ban,
  DollarSign,
} from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";

interface NavItem {
  title: string;
  href: string;
  icon: any;
  children?: NavItem[];
}

interface Section {
  id: string;
  name: string;
  display_name: string;
  order_index: number;
  is_active: boolean;
}

interface ContentTable {
  id: string;
  section_id: string;
  name: string;
  display_name: string;
  is_active: boolean;
}

// Base navigation items that don't come from dynamic sections
const baseNavigation: NavItem[] = [
  { title: "Overview", href: "/admin", icon: LayoutDashboard },
  { title: "Users & Usage", href: "/admin/users", icon: Users },
  { title: "Media Library", href: "/admin/media", icon: Image },
  { title: "Content Manager", href: "/admin/content/sections", icon: Layers },
  { title: "Invite Codes", href: "/admin/invites", icon: Ticket },
  { title: "System & Logs", href: "/admin/system", icon: Settings },
];

export function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [navigation, setNavigation] = useState<NavItem[]>(baseNavigation);
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const isMobile = useIsMobile();

  useEffect(() => {
    checkAuth();
    fetchDynamicSections();
    fixMissingRouteOverrides();
  }, []);

  // Fix missing route overrides for custom pages
  const fixMissingRouteOverrides = async () => {
    const routeFixes = [
      { name: 'foundation-modules', route: '/admin/training/modules' },
      { name: 'troubleshooting_modules', route: '/admin/training/troubleshooting' },
      { name: 'vaccines', route: '/admin/dogs/vaccines' },
      { name: 'treatments', route: '/admin/dogs/treatments' },
    ];

    for (const fix of routeFixes) {
      const { error } = await supabase
        .from('admin_content_tables')
        .update({ route_override: fix.route })
        .eq('name', fix.name)
        .is('route_override', null);
      
      if (error) {
        console.error(`Failed to fix route for ${fix.name}:`, error);
      }
    }
  };

  const fetchDynamicSections = async () => {
    try {
      // Fetch all active sections
      const { data: sections, error: sectionsError } = await supabase
        .from("admin_sections")
        .select("*")
        .eq("is_active", true)
        .order("order_index", { ascending: true });

      if (sectionsError) throw sectionsError;
      if (!sections || sections.length === 0) return;

      // Fetch all active content tables
      const { data: tables, error: tablesError } = await supabase
        .from("admin_content_tables")
        .select("*")
        .eq("is_active", true)
        .order("order_index", { ascending: true });

      if (tablesError) throw tablesError;

      // Icon mapping from string names to Lucide icons - synced with IconPicker
      const iconMap: Record<string, any> = {
        Home, Settings, User, Users, Database, Table, FileText,
        Folder, FolderOpen, Image, Video, Music, File, FileCode,
        BookOpen, Book, BookMarked, Library, Bookmark,
        Tag, Tags, Package, Box, Archive,
        Calendar, Clock, Bell, Mail, MessageSquare,
        Phone, MapPin, Map, Globe, Compass,
        Heart, Star, Award, Trophy, Target,
        TrendingUp, BarChart, PieChart, Activity, Zap,
        Shield, Lock, Key, Eye, Flag,
        Grid, List, Layers, Layout, Sidebar,
        Wrench, Code, Terminal, Cpu,
        Palette, Paintbrush, Pencil, Edit, Trash,
        Plus, Minus, X, Check, Info,
        HelpCircle, AlertCircle, AlertTriangle, Ban, DollarSign,
        // Legacy icons
        GraduationCap, Dog, Ticket,
      };

      // Build navigation items from sections and tables
      const dynamicNavItems: NavItem[] = sections.map((section: any) => {
        const sectionTables = (tables || []).filter(
          (table: any) => table.section_id === section.id
        );

        return {
          title: section.display_name,
          href: `/admin/content/sections/${section.id}`,
          icon: iconMap[section.icon || "Layers"] || Layers,
          children: sectionTables.map((table: any) => ({
            title: table.display_name,
            // Use route_override if present, otherwise use dynamic route
            href: table.route_override || `/admin/content/sections/${section.id}/tables/${table.id}`,
            icon: FileText,
          })),
        };
      });

      // Insert dynamic sections after "Users & Usage" (index 1)
      const updatedNav = [
        ...baseNavigation.slice(0, 2), // Overview, Users & Usage
        ...dynamicNavItems,              // Dynamic sections from database
        ...baseNavigation.slice(2),      // Media Library, Content Manager, Invites, System
      ];

      setNavigation(updatedNav);
    } catch (error: any) {
      console.error("Error fetching dynamic sections:", error);
      toast.error("Failed to load content sections");
    }
  };

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      navigate("/login?redirect=/admin");
      return;
    }

    // Check if user has admin role using secure function
    const { data: isAdmin, error } = await supabase
      .rpc("has_role", { _user_id: user.id, _role: "admin" });

    if (error || !isAdmin) {
      toast.error("Unauthorized access - Admin role required");
      navigate("/login?redirect=/admin");
      return;
    }

    // Get display name from profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .single();

    setUserEmail(profile?.display_name || user.email || "Admin");
    setIsAuthorized(true);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (!isAuthorized) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Checking authorization...</h1>
        </div>
      </div>
    );
  }

  const SidebarContent = () => (
    <>
      {/* Header */}
      <div className={cn("flex h-16 items-center border-b px-4", isMobile ? "justify-between" : "justify-between")}>
        {(!collapsed || isMobile) && (
          <div className="flex flex-col">
            <span className="font-semibold text-sidebar-foreground">Kahu Admin</span>
            <span className="text-xs text-sidebar-foreground/60">{userEmail}</span>
          </div>
        )}
        {!isMobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="h-8 w-8"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        )}
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {navigation.map((item) => (
            <NavSection key={item.href} item={item} collapsed={isMobile ? false : collapsed} onNavigate={() => isMobile && setMobileMenuOpen(false)} />
          ))}
        </nav>
      </ScrollArea>

      {/* Footer Actions */}
      <div className="border-t p-4">
        <div className={cn("flex gap-2", collapsed && !isMobile ? "flex-col" : "flex-row items-center justify-between")}>
          <Button
            variant="ghost"
            size={collapsed && !isMobile ? "icon" : "sm"}
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className={cn(collapsed && !isMobile && "w-full")}
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {(!collapsed || isMobile) && <span className="ml-2">Theme</span>}
          </Button>
          <Button
            variant="ghost"
            size={collapsed && !isMobile ? "icon" : "sm"}
            onClick={handleSignOut}
            className={cn(collapsed && !isMobile && "w-full")}
          >
            <LogOut className="h-4 w-4" />
            {(!collapsed || isMobile) && <span className="ml-2">Sign Out</span>}
          </Button>
        </div>
      </div>
    </>
  );

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Mobile Header */}
      {isMobile && (
        <header className="fixed top-0 left-0 right-0 z-40 flex h-16 items-center justify-between border-b bg-background px-4">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <div className="flex h-full flex-col">
                <SidebarContent />
              </div>
            </SheetContent>
          </Sheet>
          <span className="font-semibold">Kahu Admin</span>
          <div className="w-10" /> {/* Spacer for centering */}
        </header>
      )}

      {/* Desktop Sidebar */}
      {!isMobile && (
        <aside
          className={cn(
            "flex flex-col border-r bg-sidebar transition-all duration-300",
            collapsed ? "w-16" : "w-64"
          )}
        >
          <SidebarContent />
        </aside>
      )}

      {/* Main Content */}
      <main className={cn("flex-1 overflow-auto", isMobile && "pt-16")}>
        <Outlet />
      </main>
    </div>
  );
}

function NavSection({ item, collapsed, onNavigate }: { item: NavItem; collapsed: boolean; onNavigate?: () => void }) {
  const location = useLocation();
  const [expanded, setExpanded] = useState(true);
  const isActive = location.pathname === item.href;
  const hasActiveChild = item.children?.some((child) => location.pathname === child.href);

  if (item.children) {
    return (
      <div>
        <button
          onClick={() => setExpanded(!expanded)}
          className={cn(
            "flex w-full items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
            "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            (isActive || hasActiveChild) && "bg-sidebar-accent text-sidebar-accent-foreground"
          )}
        >
          <item.icon className="h-4 w-4 shrink-0" />
          {!collapsed && (
            <>
              <span className="ml-3 flex-1 text-left">{item.title}</span>
              <ChevronRight className={cn("h-4 w-4 transition-transform", expanded && "rotate-90")} />
            </>
          )}
        </button>
      {item.children && !collapsed && (
        <div className="ml-4 mt-1 space-y-1 border-l pl-4">
          {item.children.map((child) => (
            <NavLink key={child.href} item={child} collapsed={false} onNavigate={onNavigate} />
          ))}
        </div>
      )}
    </div>
  );
}

return <NavLink item={item} collapsed={collapsed} onNavigate={onNavigate} />;
}

function NavLink({ item, collapsed = false, onNavigate }: { item: NavItem; collapsed?: boolean; onNavigate?: () => void }) {
  const location = useLocation();
  const isActive = location.pathname === item.href;

  return (
    <Link
      to={item.href}
      onClick={onNavigate}
      className={cn(
        "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
        "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        isActive && "bg-sidebar-accent text-sidebar-accent-foreground"
      )}
    >
      <item.icon className="h-4 w-4 shrink-0" />
      {!collapsed && <span className="ml-3">{item.title}</span>}
    </Link>
  );
}
