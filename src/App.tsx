import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ResetPassword from "./pages/ResetPassword";
import { AdminLayout } from "./components/admin/AdminLayout";
import AdminOverview from "./pages/admin/Overview";
import AdminUsers from "./pages/admin/Users";
import AdminSkills from "./pages/admin/training/Skills";
import SkillDetail from "./pages/admin/training/SkillDetail";
import AdminModules from "./pages/admin/training/Modules";
import AdminTroubleshooting from "./pages/admin/training/Troubleshooting";
import AdminMedia from "./pages/admin/Media";
import AdminBreeds from "./pages/admin/dogs/Breeds";
import AdminVaccines from "./pages/admin/dogs/Vaccines";
import AdminTreatments from "./pages/admin/dogs/Treatments";
import AdminInvites from "./pages/admin/Invites";
import AdminSystem from "./pages/admin/System";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          
          {/* Admin Routes */}
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
      </BrowserRouter>
    </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
