import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
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
    <div className="min-h-screen flex flex-col bg-background">
      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="text-center space-y-12">
          <h1 className="text-6xl md:text-7xl font-bold text-foreground tracking-tight">
            Kahu Admin Dashboard
          </h1>
          
          <div className="pt-4">
            {isAuthenticated ? (
              <Link to="/admin">
                <Button size="lg" className="text-base px-10 py-6">
                  Go to Dashboard
                </Button>
              </Link>
            ) : (
              <Link to="/login">
                <Button size="lg" className="text-base px-10 py-6">
                  Login
                </Button>
              </Link>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-6">
        <div className="container px-4 max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-3">
            <span className="text-sm text-muted-foreground">
              © 2024 Kahu. All rights reserved.
            </span>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">Documentation</a>
              <a href="#" className="hover:text-foreground transition-colors">Support</a>
              <a href="#" className="hover:text-foreground transition-colors">GitHub</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
