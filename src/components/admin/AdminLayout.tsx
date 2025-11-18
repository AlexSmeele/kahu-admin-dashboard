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
} from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

interface NavItem {
  title: string;
  href: string;
  icon: any;
  children?: NavItem[];
}

const navigation: NavItem[] = [
  { title: "Overview", href: "/admin", icon: LayoutDashboard },
  { title: "Users & Usage", href: "/admin/users", icon: Users },
  {
    title: "Training Content",
    href: "/admin/training",
    icon: GraduationCap,
    children: [
      { title: "Skills", href: "/admin/training/skills", icon: FileText },
      { title: "Foundation Modules", href: "/admin/training/modules", icon: FileText },
      { title: "Troubleshooting", href: "/admin/training/troubleshooting", icon: FileText },
    ],
  },
  { title: "Media Library", href: "/admin/media", icon: Image },
  {
    title: "Dog Knowledge Base",
    href: "/admin/dogs",
    icon: Dog,
    children: [
      { title: "Breeds", href: "/admin/dogs/breeds", icon: Dog },
      { title: "Vaccines", href: "/admin/dogs/vaccines", icon: FileText },
      { title: "Treatments", href: "/admin/dogs/treatments", icon: FileText },
    ],
  },
  { title: "Invite Codes", href: "/admin/invites", icon: Ticket },
  { title: "System & Logs", href: "/admin/system", icon: Settings },
];

export function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    checkAuth();
  }, []);

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

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          "flex flex-col border-r bg-sidebar transition-all duration-300",
          collapsed ? "w-16" : "w-64"
        )}
      >
        {/* Header */}
        <div className="flex h-16 items-center justify-between border-b px-4">
          {!collapsed && (
            <div className="flex flex-col">
              <h1 className="text-lg font-bold text-sidebar-foreground">Kahu Admin</h1>
              <span className="text-xs text-muted-foreground">Dashboard</span>
            </div>
          )}
          <div className="flex items-center gap-1 ml-auto">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="h-8 w-8"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCollapsed(!collapsed)}
              className="h-8 w-8"
            >
              {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 px-2 py-4">
          <nav className="space-y-1">
            {navigation.map((item) => (
              <NavSection key={item.href} item={item} collapsed={collapsed} location={location} />
            ))}
          </nav>
        </ScrollArea>

        {/* User section */}
        <div className="border-t p-4">
          {!collapsed && (
            <div className="mb-2 text-sm text-sidebar-foreground">
              <div className="font-medium">{userEmail}</div>
              <div className="text-xs text-muted-foreground">Administrator</div>
            </div>
          )}
          <Button
            variant="ghost"
            size={collapsed ? "icon" : "sm"}
            onClick={handleSignOut}
            className="w-full justify-start"
          >
            <LogOut className="h-4 w-4" />
            {!collapsed && <span className="ml-2">Sign Out</span>}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}

function NavSection({ item, collapsed, location }: { item: NavItem; collapsed: boolean; location: any }) {
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
        {!collapsed && expanded && (
          <div className="ml-4 mt-1 space-y-1">
            {item.children.map((child) => (
              <NavLink key={child.href} item={child} location={location} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return <NavLink item={item} location={location} collapsed={collapsed} />;
}

function NavLink({ item, location, collapsed = false }: { item: NavItem; location: any; collapsed?: boolean }) {
  const isActive = location.pathname === item.href;

  return (
    <Link
      to={item.href}
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
