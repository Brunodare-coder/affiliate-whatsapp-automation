import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import ProtectedRoute from "./components/ProtectedRoute";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Campaigns from "./pages/Campaigns";
import CampaignDetail from "./pages/CampaignDetail";
import WhatsAppConnect from "./pages/WhatsAppConnect";
import Groups from "./pages/Groups";
import { Redirect } from "wouter";
import Logs from "./pages/Logs";
import LogDetail from "./pages/LogDetail";
import Settings from "./pages/Settings";
import FeedGlobal from "./pages/FeedGlobal";
import Subscription from "./pages/Subscription";
import Admin from "./pages/Admin";
import Support from "./pages/Support";
import Diagnostico from "./pages/Diagnostico";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import VerifyEmail from "./pages/VerifyEmail";

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/cadastro" component={Register} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/esqueci-senha" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/support" component={Support} />
      <Route path="/suporte" component={Support} />
      <Route path="/verify-email" component={VerifyEmail} />
      <Route path="/404" component={NotFound} />

      {/* Protected routes — require authentication */}
      <Route path="/dashboard">
        <ProtectedRoute><Dashboard /></ProtectedRoute>
      </Route>
      <Route path="/campaigns">
        <ProtectedRoute><Campaigns /></ProtectedRoute>
      </Route>
      <Route path="/campaigns/:id">
        <ProtectedRoute><CampaignDetail /></ProtectedRoute>
      </Route>
      <Route path="/whatsapp">
        <ProtectedRoute><WhatsAppConnect /></ProtectedRoute>
      </Route>
      <Route path="/groups">
        <ProtectedRoute><Groups /></ProtectedRoute>
      </Route>
      <Route path="/automations">
        <Redirect to="/groups" />
      </Route>
      <Route path="/logs">
        <ProtectedRoute><Logs /></ProtectedRoute>
      </Route>
      <Route path="/logs/:id">
        <ProtectedRoute><LogDetail /></ProtectedRoute>
      </Route>
      <Route path="/settings">
        <ProtectedRoute><Settings /></ProtectedRoute>
      </Route>
      <Route path="/feed-global">
        <ProtectedRoute><FeedGlobal /></ProtectedRoute>
      </Route>
      <Route path="/subscription">
        <ProtectedRoute><Subscription /></ProtectedRoute>
      </Route>
      <Route path="/admin">
        <ProtectedRoute><Admin /></ProtectedRoute>
      </Route>
      <Route path="/diagnostico">
        <ProtectedRoute><Diagnostico /></ProtectedRoute>
      </Route>

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
