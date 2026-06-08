import { Routes, Route, Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { Header, MobileTabBar } from '@/components/site/Header';
import { Footer } from '@/components/site/Footer';
import { Toaster } from '@/components/ui/sonner';
import { useAuth } from '@/context/AuthContext';

// Page imports
import HomePage from '@/pages/Home/HomePage';
import ExplorePage from '@/pages/Explore/ExplorePage';
import PropertyListPage from '@/pages/Properties/PropertyListPage';
import PropertyDetailPage from '@/pages/Properties/PropertyDetailPage';
import PostPropertyPage from '@/pages/Properties/PostPropertyPage';
import UserDashboard from '@/pages/Dashboard/UserDashboard';
import AuthPage from '@/pages/Auth/AuthPage';
import SavedPage from '@/pages/Saved/SavedPage';

// ─── Skeleton loader shown while session check is in-flight ───────────────────
function PageSkeleton() {
    return (
        <div className="min-h-screen animate-pulse bg-background">
            <div className="h-16 border-b border-border bg-card" />
            <div className="container-px mx-auto max-w-7xl py-12">
                <div className="h-8 w-48 rounded-lg bg-muted" />
                <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="h-64 rounded-2xl bg-muted" />
                    ))}
                </div>
            </div>
        </div>
    );
}

// ─── Protected Route ─────────────────────────────────────────────────────────
// Uses AuthContext instead of localStorage check.
// Shows skeleton while session hydration is in-flight (prevents flicker/redirect).
function ProtectedRoute({ children }) {
    const { isAuthenticated, isLoading } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    // Still checking cookie session — show skeleton, do NOT redirect yet
    if (isLoading) return <PageSkeleton />;

    // Not authenticated — redirect to auth with return path
    if (!isAuthenticated) {
        const redirectPath = `${location.pathname}${location.search}`;
        navigate(`/auth?redirect=${encodeURIComponent(redirectPath)}`, { replace: true });
        return null;
    }

    return children;
}

// ─── App Layout ───────────────────────────────────────────────────────────────
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

// ─── 404 ──────────────────────────────────────────────────────────────────────
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

// ─── Routes ───────────────────────────────────────────────────────────────────
export default function AppRoutes() {
    return (
        <Routes>
            <Route element={<AppLayout />}>
                {/* Public */}
                <Route path="/" element={<HomePage />} />

                {/* Protected — require login */}
                <Route path="/explore" element={<ProtectedRoute><ExplorePage /></ProtectedRoute>} />
                <Route path="/properties" element={<ProtectedRoute><PropertyListPage /></ProtectedRoute>} />
                <Route path="/properties/:id" element={<ProtectedRoute><PropertyDetailPage /></ProtectedRoute>} />
                <Route path="/post-property" element={<ProtectedRoute><PostPropertyPage /></ProtectedRoute>} />
                <Route path="/dashboard" element={<ProtectedRoute><UserDashboard /></ProtectedRoute>} />
                <Route path="/saved" element={<ProtectedRoute><SavedPage /></ProtectedRoute>} />
            </Route>

            {/* Auth page — outside layout (full screen) */}
            <Route
                path="/auth"
                element={
                    <>
                        <AuthPage />
                        <Toaster />
                    </>
                }
            />

            <Route path="*" element={<NotFound />} />
        </Routes>
    );
}
