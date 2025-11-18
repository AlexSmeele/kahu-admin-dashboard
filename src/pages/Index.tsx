import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dog, Shield, Users, GraduationCap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsAuthenticated(!!user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Dog className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">Kahu</span>
          </div>
          {isAuthenticated ? (
            <Link to="/admin">
              <Button variant="outline" size="sm">
                <Shield className="mr-2 h-4 w-4" />
                Dashboard
              </Button>
            </Link>
          ) : (
            <Link to="/login">
              <Button variant="outline" size="sm">
                <Shield className="mr-2 h-4 w-4" />
                Admin Login
              </Button>
            </Link>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main className="container px-4 py-16">
        <div className="mx-auto max-w-4xl">
          {/* Main Hero */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary mb-6">
              <Dog className="h-4 w-4" />
              Dog Training & Wellness Platform
            </div>
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Welcome to Kahu
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              A comprehensive system for managing dog training, health, and wellness. 
              Empowering owners with knowledge and tools for their canine companions.
            </p>
          </div>

          {/* Feature Cards */}
          <div className="grid gap-6 md:grid-cols-3 mb-12">
            <Card className="border-primary/20 hover:border-primary/40 transition-colors">
              <CardHeader>
                <GraduationCap className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Training Programs</CardTitle>
                <CardDescription>
                  Structured courses, skills, and behavioral guidance
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-primary/20 hover:border-primary/40 transition-colors">
              <CardHeader>
                <Dog className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Dog Knowledge Base</CardTitle>
                <CardDescription>
                  Comprehensive breed info, health, and care resources
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-primary/20 hover:border-primary/40 transition-colors">
              <CardHeader>
                <Users className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Community & Support</CardTitle>
                <CardDescription>
                  Connect with trainers, vets, and fellow dog owners
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          {/* Admin CTA */}
          <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/30">
            <CardHeader className="text-center">
              <Shield className="h-12 w-12 text-primary mx-auto mb-2" />
              <CardTitle className="text-2xl">Admin Dashboard</CardTitle>
              <CardDescription className="text-base">
                Manage users, training content, dog breeds, and system settings
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center pb-6">
              {isAuthenticated ? (
                <Link to="/admin">
                  <Button size="lg" className="shadow-lg">
                    Go to Dashboard
                  </Button>
                </Link>
              ) : (
                <Link to="/login">
                  <Button size="lg" className="shadow-lg">
                    Admin Access
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-16">
        <div className="container px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Dog className="h-5 w-5 text-primary" />
              <span>© 2024 Kahu. Dog Training & Wellness Platform.</span>
            </div>
            <div className="flex gap-4">
              <a href="#" className="hover:text-primary transition-colors">Documentation</a>
              <a href="#" className="hover:text-primary transition-colors">Support</a>
              <a href="#" className="hover:text-primary transition-colors">GitHub</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
