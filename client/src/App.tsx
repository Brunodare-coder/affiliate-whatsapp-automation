import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Campaigns from "./pages/Campaigns";
import CampaignDetail from "./pages/CampaignDetail";
import WhatsAppConnect from "./pages/WhatsAppConnect";
import Groups from "./pages/Groups";
import Automations from "./pages/Automations";
import Logs from "./pages/Logs";
import LogDetail from "./pages/LogDetail";
import Settings from "./pages/Settings";
import FeedGlobal from "./pages/FeedGlobal";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/campaigns" component={Campaigns} />
      <Route path="/campaigns/:id" component={CampaignDetail} />
      <Route path="/whatsapp" component={WhatsAppConnect} />
      <Route path="/groups" component={Groups} />
      <Route path="/automations" component={Automations} />
      <Route path="/logs" component={Logs} />
      <Route path="/logs/:id" component={LogDetail} />
      <Route path="/settings" component={Settings} />
      <Route path="/feed-global" component={FeedGlobal} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
