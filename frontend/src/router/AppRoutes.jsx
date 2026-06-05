import { Routes, Route, Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { Header, MobileTabBar } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { useEffect } from "react";

// Page imports
import HomePage from "@/pages/Home/HomePage";
import ExplorePage from "@/pages/Explore/ExplorePage";
import PropertyListPage from "@/pages/Properties/PropertyListPage";
import PropertyDetailPage from "@/pages/Properties/PropertyDetailPage";
import PostPropertyPage from "@/pages/Properties/PostPropertyPage";
import UserDashboard from "@/pages/Dashboard/UserDashboard";
import AuthPage from "@/pages/Auth/AuthPage";
import SavedPage from "@/pages/Saved/SavedPage";

function ProtectedRoute({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const user = localStorage.getItem("user");

  useEffect(() => {
    if (!user) {
      toast.error("Please login to access this page", {
        description: "You must be signed in to view listings or post properties.",
        action: {
          label: "Sign In",
          onClick: () => navigate(`/auth?redirect=${location.pathname}${location.search}`)
        }
      });
      navigate(`/auth?redirect=${location.pathname}${location.search}`);
    }
  }, [user, navigate, location]);

  if (!user) return null;

  return children;
}

function AppLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 pb-20 lg:pb-0">
        <Outlet />
      </main>
      <Footer />
      <MobileTabBar />
      <Toaster />
    </div>
  );
}

function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-7xl font-bold">404</h1>
        <p className="mt-2 text-muted-foreground">This page doesn't exist.</p>
        <Link
          to="/"
          className="mt-6 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/explore" element={<ProtectedRoute><ExplorePage /></ProtectedRoute>} />
        <Route path="/properties" element={<ProtectedRoute><PropertyListPage /></ProtectedRoute>} />
        <Route path="/properties/:id" element={<ProtectedRoute><PropertyDetailPage /></ProtectedRoute>} />
        <Route path="/post-property" element={<ProtectedRoute><PostPropertyPage /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><UserDashboard /></ProtectedRoute>} />
        <Route path="/saved" element={<ProtectedRoute><SavedPage /></ProtectedRoute>} />
      </Route>
      <Route path="/auth" element={
        <>
          <AuthPage />
          <Toaster />
        </>
      } />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
