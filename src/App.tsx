import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { lazy, Suspense } from "react";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ResetPassword from "./pages/ResetPassword";

// Lazy load admin components to reduce initial bundle size
const AdminLayout = lazy(() => import("./components/admin/AdminLayout").then(m => ({ default: m.AdminLayout })));
const AdminOverview = lazy(() => import("./pages/admin/Overview"));
const AdminUsers = lazy(() => import("./pages/admin/Users"));
const AdminSkills = lazy(() => import("./pages/admin/training/Skills"));
const SkillDetail = lazy(() => import("./pages/admin/training/SkillDetail"));
const AdminModules = lazy(() => import("./pages/admin/training/Modules"));
const AdminTroubleshooting = lazy(() => import("./pages/admin/training/Troubleshooting"));
const AdminMedia = lazy(() => import("./pages/admin/Media"));
const AdminBreeds = lazy(() => import("./pages/admin/dogs/Breeds"));
const AdminVaccines = lazy(() => import("./pages/admin/dogs/Vaccines"));
const AdminTreatments = lazy(() => import("./pages/admin/dogs/Treatments"));
const AdminInvites = lazy(() => import("./pages/admin/Invites"));
const AdminSystem = lazy(() => import("./pages/admin/System"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            
            {/* Admin Routes - Lazy loaded to reduce initial bundle size */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminOverview />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="training/skills" element={<AdminSkills />} />
              <Route path="training/skills/:id" element={<SkillDetail />} />
              <Route path="training/modules" element={<AdminModules />} />
              <Route path="training/troubleshooting" element={<AdminTroubleshooting />} />
              <Route path="media" element={<AdminMedia />} />
              <Route path="dogs/breeds" element={<AdminBreeds />} />
              <Route path="dogs/vaccines" element={<AdminVaccines />} />
              <Route path="dogs/treatments" element={<AdminTreatments />} />
              <Route path="invites" element={<AdminInvites />} />
              <Route path="system" element={<AdminSystem />} />
            </Route>

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
