import { Routes, Route, Outlet, Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Header, MobileTabBar } from '@/components/site/Header';
import { Footer } from '@/components/site/Footer';
import { Toaster } from '@/components/ui/sonner';
import { useAuth } from '@/context/AuthContext';
import { lazy, Suspense, useEffect } from 'react';

function ScrollToTop() {
  const { pathname, search } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname, search]);
  return null;
}

// Skeletons
import { 
  PropertyGridSkeleton, 
  PropertyDetailSkeleton, 
  DashboardSkeleton 
} from '@/components/site/Skeletons';

// Page imports using React.lazy
const HomePage = lazy(() => import('@/pages/Home/HomePage'));
const ExplorePage = lazy(() => import('@/pages/Explore/ExplorePage'));
const PropertyListPage = lazy(() => import('@/pages/Properties/PropertyListPage'));
const PropertyDetailPage = lazy(() => import('@/pages/Properties/PropertyDetailPage'));
const PostPropertyPage = lazy(() => import('@/pages/Properties/PostPropertyPage'));
const UserDashboard = lazy(() => import('@/pages/Dashboard/UserDashboard'));
const AuthPage = lazy(() => import('@/pages/Auth/AuthPage'));
const SavedPage = lazy(() => import('@/pages/Saved/SavedPage'));
const AdminLogin = lazy(() => import('@/pages/Admin/AdminLogin'));
const AdminLayout = lazy(() => import('@/pages/Admin/AdminLayout'));
const AdminDashboard = lazy(() => import('@/pages/Admin/AdminDashboardPage'));
const AdminUsersPage = lazy(() => import('@/pages/Admin/AdminUsersPage'));
const AdminDealersPage = lazy(() => import('@/pages/Admin/AdminDealersPage'));
const AdminPropertiesPage = lazy(() => import('@/pages/Admin/AdminPropertiesPage'));
const AdminEnquiriesPage = lazy(() => import('@/pages/Admin/AdminEnquiriesPage'));
const PromotionPlansAdmin = lazy(() => import('@/pages/Admin/PromotionPlansAdmin'));
const AdminSubscriptionsPage = lazy(() => import('@/pages/Admin/AdminSubscriptionsPage'));
const AdminCitiesPage = lazy(() => import('@/pages/Admin/AdminCitiesPage'));
const AdminReviewsPage = lazy(() => import('@/pages/Admin/AdminReviewsPage'));
const AdminLegalPage = lazy(() => import('@/pages/Admin/AdminLegalPage'));
const AdminBannersPage = lazy(() => import('@/pages/Admin/AdminBannersPage'));
const AdminFraudPage = lazy(() => import('@/pages/Admin/AdminFraudPage'));
const AdminTransactionsPage = lazy(() => import('@/pages/Admin/AdminTransactionsPage'));
const AdminBlogsPage = lazy(() => import('@/pages/Admin/AdminBlogsPage'));
const PropertyReviewsPage = lazy(() => import('@/pages/Properties/PropertyReviewsPage'));
const AdminSettingsPage = lazy(() => import('@/pages/Admin/AdminSettingsPage'));
const EditPropertyPage = lazy(() => import('@/pages/Properties/EditPropertyPage'));
const ReviewsPage = lazy(() => import('@/pages/Reviews/ReviewsPage'));
const AboutPage = lazy(() => import('@/pages/Static/AboutPage'));
const ContactPage = lazy(() => import('@/pages/Static/ContactPage'));
const PrivacyPage = lazy(() => import('@/pages/Static/PrivacyPage'));
const TermsPage = lazy(() => import('@/pages/Static/TermsPage'));
const BlogListPage = lazy(() => import('@/pages/Static/BlogListPage'));
const BlogDetailsPage = lazy(() => import('@/pages/Static/BlogDetailsPage'));
const DealersPage = lazy(() => import('@/pages/Static/DealersPage'));
const DealerProfilePage = lazy(() => import('@/pages/Static/DealerProfilePage'));
const HelpPage = lazy(() => import('@/pages/Static/HelpPage'));
const ReportPage = lazy(() => import('@/pages/Static/ReportPage'));

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

    // Still checking cookie session — show skeleton, do NOT redirect yet
    if (isLoading) return <PageSkeleton />;

    // Not authenticated — redirect to auth with return path
    if (!isAuthenticated) {
        const redirectPath = `${location.pathname}${location.search}`;
        return <Navigate to={`/auth?redirect=${encodeURIComponent(redirectPath)}`} replace />;
    }

    return children;
}

// ─── Admin Protected Route ───────────────────────────────────────────────────
function AdminProtectedRoute({ children }) {
    const { user, isAuthenticated, isLoading } = useAuth();

    if (isLoading) return <PageSkeleton />;

    if (!isAuthenticated || (user?.role !== 'admin' && user?.role !== 'superadmin')) {
        return <Navigate to="/admin/login" replace />;
    }

    return children;
}

// ─── App Layout ───────────────────────────────────────────────────────────────
function AppLayout() {
    return (
        <div className="flex min-h-screen flex-col pb-20 lg:pb-0">
            <ScrollToTop />
            <Header />
            <main className="flex-1">
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
        <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 py-16 text-center">
            <h1 className="font-display text-9xl font-bold text-primary/20">404</h1>
            <h2 className="mt-4 font-display text-3xl font-bold text-foreground">Page not found</h2>
            <p className="mt-2 text-muted-foreground max-w-md mx-auto">
                Sorry, the page you are looking for doesn't exist or has been moved.
            </p>
            <Link
                to="/"
                className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
            >
                Back to Homepage
            </Link>
        </div>
    );
}

// ─── Routes ───────────────────────────────────────────────────────────────────
export default function AppRoutes() {
    return (
        <Routes>
            <Route element={<AppLayout />}>
                {/* Public */}
                <Route path="/" element={
                    <Suspense fallback={<PageSkeleton />}><HomePage /></Suspense>
                } />
                <Route path="/reviews" element={
                    <Suspense fallback={<PageSkeleton />}><ReviewsPage /></Suspense>
                } />
                <Route path="/properties" element={
                    <Suspense fallback={
                        <div className="container-px mx-auto max-w-7xl py-12 space-y-6">
                            <div className="h-8 w-48 rounded bg-muted animate-pulse" />
                            <PropertyGridSkeleton count={8} />
                        </div>
                    }>
                        <PropertyListPage />
                    </Suspense>
                } />
                <Route path="/properties/:id" element={
                    <Suspense fallback={<PropertyDetailSkeleton />}><PropertyDetailPage /></Suspense>
                } />
                <Route path="/properties/:id/reviews" element={
                    <Suspense fallback={<PageSkeleton />}><PropertyReviewsPage /></Suspense>
                } />
                <Route path="/about" element={
                    <Suspense fallback={<PageSkeleton />}><AboutPage /></Suspense>
                } />
                <Route path="/contact" element={
                    <Suspense fallback={<PageSkeleton />}><ContactPage /></Suspense>
                } />
                <Route path="/privacy" element={
                    <Suspense fallback={<PageSkeleton />}><PrivacyPage /></Suspense>
                } />
                <Route path="/terms" element={
                    <Suspense fallback={<PageSkeleton />}><TermsPage /></Suspense>
                } />
                <Route path="/blog" element={
                    <Suspense fallback={<PageSkeleton />}><BlogListPage /></Suspense>
                } />
                <Route path="/blog/:slug" element={
                    <Suspense fallback={<PageSkeleton />}><BlogDetailsPage /></Suspense>
                } />
                <Route path="/dealers" element={
                    <Suspense fallback={<PageSkeleton />}><DealersPage /></Suspense>
                } />
                <Route path="/dealers/:id" element={
                    <Suspense fallback={<PageSkeleton />}><DealerProfilePage /></Suspense>
                } />
                <Route path="/help" element={
                    <Suspense fallback={<PageSkeleton />}><HelpPage /></Suspense>
                } />
                <Route path="/report" element={
                    <Suspense fallback={<PageSkeleton />}><ReportPage /></Suspense>
                } />

                {/* 404 Page inside Layout */}
                <Route path="*" element={<NotFound />} />

                {/* Protected — require login */}
                <Route path="/explore" element={
                    <ProtectedRoute>
                        <Suspense fallback={<PageSkeleton />}><ExplorePage /></Suspense>
                    </ProtectedRoute>
                } />
                <Route path="/post-property" element={
                    <ProtectedRoute>
                        <Suspense fallback={<PageSkeleton />}><PostPropertyPage /></Suspense>
                    </ProtectedRoute>
                } />
                <Route path="/edit-property/:id" element={
                    <ProtectedRoute>
                        <Suspense fallback={<PageSkeleton />}><EditPropertyPage /></Suspense>
                    </ProtectedRoute>
                } />
                <Route path="/dashboard" element={
                    <ProtectedRoute>
                        <Suspense fallback={<DashboardSkeleton />}><UserDashboard /></Suspense>
                    </ProtectedRoute>
                } />
                <Route path="/dashboard/:tab" element={
                    <ProtectedRoute>
                        <Suspense fallback={<DashboardSkeleton />}><UserDashboard /></Suspense>
                    </ProtectedRoute>
                } />
                <Route path="/saved" element={
                    <ProtectedRoute>
                        <Suspense fallback={
                            <div className="container-px mx-auto max-w-7xl py-12 space-y-6">
                                <div className="h-8 w-48 rounded bg-muted animate-pulse" />
                                <PropertyGridSkeleton count={4} />
                            </div>
                        }><SavedPage /></Suspense>
                    </ProtectedRoute>
                } />
            </Route>

            {/* Auth page — outside layout (full screen) */}
            <Route
                path="/auth"
                element={
                    <Suspense fallback={<PageSkeleton />}>
                        <AuthPage />
                        <Toaster />
                    </Suspense>
                }
            />

            {/* Admin Portal — outside layout (full screen dark admin design) */}
            <Route path="/admin/login" element={
                <Suspense fallback={<PageSkeleton />}>
                    <AdminLogin />
                    <Toaster />
                </Suspense>
            } />
            
            <Route
                path="/admin"
                element={
                    <AdminProtectedRoute>
                        <Suspense fallback={<PageSkeleton />}>
                            <AdminLayout />
                            <Toaster />
                        </Suspense>
                    </AdminProtectedRoute>
                }
            >
                <Route index element={
                    <Suspense fallback={<PageSkeleton />}><AdminDashboard /></Suspense>
                } />
                <Route path="dashboard" element={
                    <Suspense fallback={<PageSkeleton />}><AdminDashboard /></Suspense>
                } />
                <Route path="users" element={
                    <Suspense fallback={<PageSkeleton />}><AdminUsersPage /></Suspense>
                } />
                <Route path="dealers" element={
                    <Suspense fallback={<PageSkeleton />}><AdminDealersPage /></Suspense>
                } />
                <Route path="properties" element={
                    <Suspense fallback={<PageSkeleton />}><AdminPropertiesPage /></Suspense>
                } />
                <Route path="properties/create" element={
                    <Suspense fallback={<PageSkeleton />}><PostPropertyPage /></Suspense>
                } />
                <Route path="properties/edit/:id" element={
                    <Suspense fallback={<PageSkeleton />}><EditPropertyPage /></Suspense>
                } />
                <Route path="enquiries" element={
                    <Suspense fallback={<PageSkeleton />}><AdminEnquiriesPage /></Suspense>
                } />
                <Route path="promotions" element={
                    <Suspense fallback={<PageSkeleton />}><PromotionPlansAdmin /></Suspense>
                } />
                <Route path="subscriptions" element={
                    <Suspense fallback={<PageSkeleton />}><AdminSubscriptionsPage /></Suspense>
                } />
                <Route path="cities" element={
                    <Suspense fallback={<PageSkeleton />}><AdminCitiesPage /></Suspense>
                } />
                <Route path="banners" element={
                    <Suspense fallback={<PageSkeleton />}><AdminBannersPage /></Suspense>
                } />
                <Route path="fraud" element={
                    <Suspense fallback={<PageSkeleton />}><AdminFraudPage /></Suspense>
                } />
                <Route path="transactions" element={
                    <Suspense fallback={<PageSkeleton />}><AdminTransactionsPage /></Suspense>
                } />
                <Route path="reviews" element={
                    <Suspense fallback={<PageSkeleton />}><AdminReviewsPage /></Suspense>
                } />
                <Route path="legal" element={
                    <Suspense fallback={<PageSkeleton />}><AdminLegalPage /></Suspense>
                } />
                <Route path="settings" element={
                    <Suspense fallback={<PageSkeleton />}><AdminSettingsPage /></Suspense>
                } />
                <Route path="blogs" element={
                    <Suspense fallback={<PageSkeleton />}><AdminBlogsPage /></Suspense>
                } />
            </Route>

        </Routes>
    );
}
