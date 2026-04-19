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
import TaskBoard from "./pages/app/TaskBoard.tsx";
import TeamDocs from "./pages/app/TeamDocs.tsx";
import Events from "./pages/app/Events.tsx";
import EventCreate from "./pages/app/EventCreate.tsx";
import EventDetail from "./pages/app/EventDetail.tsx";
import CheckIn from "./pages/app/CheckIn.tsx";
import CalendarView from "./pages/app/CalendarView.tsx";
import Explore from "./pages/app/Explore.tsx";
import Profile from "./pages/app/Profile.tsx";
import Analytics from "./pages/app/Analytics.tsx";
import Portfolio from "./pages/app/Portfolio.tsx";
import JobBoard from "./pages/app/JobBoard.tsx";
import PublicExplore from "./pages/PublicExplore.tsx";
import PublicEvents from "./pages/PublicEvents.tsx";
import PublicOrgPage from "./pages/PublicOrgPage.tsx";
import PublicTeamPage from "./pages/PublicTeamPage.tsx";
import Pricing from "./pages/Pricing.tsx";
import Billing from "./pages/app/Billing.tsx";
import BillingSuccess from "./pages/app/BillingSuccess.tsx";
import TeamSettings from "./pages/app/TeamSettings.tsx";
import NotFound from "./pages/NotFound.tsx";
import TermsOfUse from "./pages/TermsOfUse.tsx";
import PrivacyPolicy from "./pages/PrivacyPolicy.tsx";

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
          <Route path="/explore" element={<PublicExplore />} />
          <Route path="/events" element={<PublicEvents />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/org/:orgSlug" element={<PublicOrgPage />} />
          <Route path="/org/:orgSlug/team/:teamSlug" element={<PublicTeamPage />} />
          <Route path="/app" element={<AppLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="organizations" element={<Organizations />} />
            <Route path="organizations/:orgId" element={<OrgDetail />} />
            <Route path="teams" element={<Teams />} />
            <Route path="teams/:teamId" element={<TeamWorkspace />} />
            <Route path="teams/:teamId/tasks" element={<TaskBoard />} />
            <Route path="teams/:teamId/docs" element={<TeamDocs />} />
            <Route path="teams/:teamId/settings" element={<TeamSettings />} />
            <Route path="events" element={<Events />} />
            <Route path="events/create" element={<EventCreate />} />
            <Route path="events/:eventId" element={<EventDetail />} />
            <Route path="events/:eventId/checkin" element={<CheckIn />} />
            <Route path="calendar" element={<CalendarView />} />
            <Route path="explore" element={<Explore />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="portfolio" element={<Portfolio />} />
            <Route path="jobs" element={<JobBoard />} />
            <Route path="profile" element={<Profile />} />
            <Route path="billing" element={<Billing />} />
            <Route path="billing/success" element={<BillingSuccess />} />
          </Route>
          <Route path="terms" element={<TermsOfUse />} />
          <Route path="privacy" element={<PrivacyPolicy />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
