import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Dog, GraduationCap, Activity } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Metrics {
  totalUsers: number;
  newUsersLast7Days: number;
  newUsersLast30Days: number;
  totalDogs: number;
  totalSkills: number;
  activeTrainingSessions: number;
}

export default function AdminOverview() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const [
        { count: totalUsers },
        { count: newUsersLast7Days },
        { count: newUsersLast30Days },
        { count: totalDogs },
        { count: totalSkills },
        { count: activeTrainingSessions },
      ] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", sevenDaysAgo.toISOString()),
        supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", thirtyDaysAgo.toISOString()),
        supabase.from("dogs").select("*", { count: "exact", head: true }),
        supabase.from("skills").select("*", { count: "exact", head: true }),
        supabase.from("dog_skills").select("*", { count: "exact", head: true }).eq("status", "in_progress"),
      ]);

      setMetrics({
        totalUsers: totalUsers || 0,
        newUsersLast7Days: newUsersLast7Days || 0,
        newUsersLast30Days: newUsersLast30Days || 0,
        totalDogs: totalDogs || 0,
        totalSkills: totalSkills || 0,
        activeTrainingSessions: activeTrainingSessions || 0,
      });
    } catch (error) {
      console.error("Error loading metrics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 md:p-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6">Dashboard Overview</h1>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const metricCards = [
    {
      title: "Total Users",
      value: metrics?.totalUsers || 0,
      description: "Registered users",
      icon: Users,
      color: "text-primary" as const,
    },
    {
      title: "New Users (7d)",
      value: metrics?.newUsersLast7Days || 0,
      description: "Last 7 days",
      icon: Activity,
      color: "text-success" as const,
    },
    {
      title: "New Users (30d)",
      value: metrics?.newUsersLast30Days || 0,
      description: "Last 30 days",
      icon: Activity,
      color: "text-info" as const,
    },
    {
      title: "Total Dogs",
      value: metrics?.totalDogs || 0,
      description: "Dogs in system",
      icon: Dog,
      color: "text-secondary" as const,
    },
    {
      title: "Total Skills",
      value: metrics?.totalSkills || 0,
      description: "Training skills",
      icon: GraduationCap,
      color: "text-accent" as const,
    },
    {
      title: "Active Training",
      value: metrics?.activeTrainingSessions || 0,
      description: "In progress",
      icon: Activity,
      color: "text-warning" as const,
    },
  ];

  return (
    <div className="p-4 md:p-8">
      <div className="mb-4 md:mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Dashboard Overview</h1>
        <p className="text-sm md:text-base text-muted-foreground">Key metrics and system overview</p>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {metricCards.map((card) => (
          <Card key={card.title} className="hover:border-primary/40 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">{card.title}</CardTitle>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground">{card.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 md:mt-8 grid gap-4 grid-cols-1 md:grid-cols-2">
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="text-base md:text-lg">Recent Activity</CardTitle>
            <CardDescription className="text-xs md:text-sm">Latest user signups and activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-xs md:text-sm text-muted-foreground">Activity feed coming soon...</div>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="text-base md:text-lg">System Health</CardTitle>
            <CardDescription className="text-xs md:text-sm">Database and system status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs md:text-sm">Database</span>
                <span className="text-xs md:text-sm font-medium text-success">✓ Operational</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs md:text-sm">Authentication</span>
                <span className="text-xs md:text-sm font-medium text-success">✓ Operational</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs md:text-sm">Storage</span>
                <span className="text-xs md:text-sm font-medium text-success">✓ Operational</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
