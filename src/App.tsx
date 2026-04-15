import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import Auth from "./pages/Auth.tsx";
import AppLayout from "./layouts/AppLayout.tsx";
import Dashboard from "./pages/app/Dashboard.tsx";
import Organizations from "./pages/app/Organizations.tsx";
import OrgDetail from "./pages/app/OrgDetail.tsx";
import Teams from "./pages/app/Teams.tsx";
import TeamWorkspace from "./pages/app/TeamWorkspace.tsx";
import Events from "./pages/app/Events.tsx";
import Explore from "./pages/app/Explore.tsx";
import Profile from "./pages/app/Profile.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/app" element={<AppLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="organizations" element={<Organizations />} />
            <Route path="organizations/:orgId" element={<OrgDetail />} />
            <Route path="teams" element={<Teams />} />
            <Route path="teams/:teamId" element={<TeamWorkspace />} />
            <Route path="events" element={<Events />} />
            <Route path="explore" element={<Explore />} />
            <Route path="profile" element={<Profile />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
