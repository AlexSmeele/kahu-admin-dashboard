import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ResetPassword from "./pages/ResetPassword";

// Lazy load admin routes for code splitting
const AdminLayout = lazy(() => import("./admin/layout/AdminLayout").then(m => ({ default: m.AdminLayout })));
const AdminOverview = lazy(() => import("./admin/pages/Overview"));
const AdminUsers = lazy(() => import("./admin/pages/Users"));
const AdminSkills = lazy(() => import("./admin/pages/training/Skills"));
const AdminModules = lazy(() => import("./admin/pages/training/Modules"));
const AdminTroubleshooting = lazy(() => import("./admin/pages/training/Troubleshooting"));
const AdminMedia = lazy(() => import("./admin/pages/Media"));
const AdminBreeds = lazy(() => import("./admin/pages/dogs/Breeds"));
const AdminVaccines = lazy(() => import("./admin/pages/dogs/Vaccines"));
const AdminTreatments = lazy(() => import("./admin/pages/dogs/Treatments"));
const AdminInvites = lazy(() => import("./admin/pages/Invites"));
const AdminSystem = lazy(() => import("./admin/pages/System"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          
          {/* Admin Routes - Lazy loaded for code splitting */}
          <Route path="/admin" element={
            <Suspense fallback={
              <div className="flex h-screen items-center justify-center">
                <div className="text-center">
                  <h1 className="text-2xl font-bold mb-2">Loading admin...</h1>
                </div>
              </div>
            }>
              <AdminLayout />
            </Suspense>
          }>
            <Route index element={<AdminOverview />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="training/skills" element={<AdminSkills />} />
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
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
