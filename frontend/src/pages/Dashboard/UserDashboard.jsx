import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  Heart,
  Bell,
  BarChart3,
  CreditCard,
  Settings,
  Plus,
  Eye,
  MessageSquare,
  TrendingUp,
  Trash2,
  Pencil,
  Phone,
  CheckCircle2,
  Inbox,
  User,
  Check,
  X,
  FileText,
  Menu,
  LogOut,
  Search
} from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { PropertyCard } from "@/components/site/PropertyCard";
import { useAuth } from "@/context/AuthContext";
import api from "@/utils/api";
import { toast } from "sonner";
import PromotePropertyTab from "./PromotePropertyTab";
import KycSection from "./KycSection";

export default function UserDashboard() {
  const { user, refreshUser, logout } = useAuth();
  const { tab } = useParams();
  const navigate = useNavigate();
  
  const isDealer = user?.role === "dealer";
  const isAdmin = user?.role === "admin";
  const userInitials = user?.name ? user.name.charAt(0).toUpperCase() : "U";

  // Determine initial tab from URL or default to "Overview"
  const getTabLabelFromSlug = (slug) => {
    if (!slug) return "Overview";
    const slugMap = {
      overview: "Overview",
      listings: isAdmin ? "All Listings" : "My Listings",
      promote: "Promote Property",
      enquiries: "Enquiries",
      saved: "Saved",
      notifications: "Notifications",
      subscription: "Subscription",
      settings: "Settings"
    };
    return slugMap[slug] || "Overview";
  };

  const [activeTab, setActiveTab] = useState(getTabLabelFromSlug(tab));
  const [newName, setNewName] = useState(user?.name || "");
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [chartDays, setChartDays] = useState(30);

  // Listing Pagination & Filters
  const [listingSearch, setListingSearch] = useState("");
  const [listingStatus, setListingStatus] = useState("All");
  const [listingPurpose, setListingPurpose] = useState("All");
  const [listingSort, setListingSort] = useState("Newest");
  const [listingPage, setListingPage] = useState(1);
  const listingsPerPage = 6;
  
  // Enquiries, Saved, Notifications Pagination
  const [receivedPage, setReceivedPage] = useState(1);
  const [sentPage, setSentPage] = useState(1);
  const [savedPage, setSavedPage] = useState(1);
  const [notificationPage, setNotificationPage] = useState(1);
  const itemsPerPage = 6;
  
  // Keep activeTab in sync with URL
  useEffect(() => {
    setActiveTab(getTabLabelFromSlug(tab));
  }, [tab, isAdmin]);

  // Handle Tab change
  const handleTabChange = (t) => {
    setActiveTab(t.label);
    navigate(`/dashboard/${t.path}`);
  };

  // Keep input in sync with loaded profile
  useEffect(() => {
    if (user?.name) {
      setNewName(user.name);
    }
  }, [user]);

  // Data states
  const [dbProperties, setDbProperties] = useState([]);
  const [allProperties, setAllProperties] = useState([]);
  const [enquiries, setEnquiries] = useState([]);
  const [notifications, setNotifications] = useState([]);
  
  // Loading states
  const [loadingListings, setLoadingListings] = useState(true);
  const [loadingEnquiries, setLoadingEnquiries] = useState(true);
  const [loadingNotifications, setLoadingNotifications] = useState(true);

  // Fetch properties (both for dealer's listings and general use)
  useEffect(() => {
    const fetchProperties = async () => {
      setLoadingListings(true);
      try {
        const { data } = await api.get("/properties");
        if (data.success) {
          setAllProperties(data.data);
          if (isAdmin) {
            setDbProperties(data.data);
          } else if (isDealer) {
            setDbProperties(data.data.filter(p => p.dealerPhone === user?.phone));
          }
        }
      } catch (err) {
        console.error("Failed to load dashboard listings:", err);
      } finally {
        setLoadingListings(false);
      }
    };
    fetchProperties();
  }, [user, isAdmin, isDealer]);

  // Fetch enquiries
  const fetchEnquiries = async () => {
    setLoadingEnquiries(true);
    try {
      const { data } = await api.get("/enquiries");
      if (data.success) {
        setEnquiries(data.data);
      }
    } catch (err) {
      console.error("Failed to load enquiries:", err);
    } finally {
      setLoadingEnquiries(false);
    }
  };

  // Fetch notifications
  const fetchNotifications = async () => {
    setLoadingNotifications(true);
    try {
      const { data } = await api.get("/notifications");
      if (data.success) {
        setNotifications(data.data);
      }
    } catch (err) {
      console.error("Failed to load notifications:", err);
    } finally {
      setLoadingNotifications(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchEnquiries();
      fetchNotifications();
    }
  }, [user]);

  // Handle Enquiry Status Update
  const handleUpdateEnquiryStatus = async (id, status) => {
    try {
      const { data } = await api.put(`/enquiries/${id}`, { status });
      if (data.success) {
        toast.success(`Enquiry marked as ${status}`);
        fetchEnquiries();
      }
    } catch (err) {
      toast.error("Failed to update status.");
    }
  };

  // Handle Mark All Notifications as Read
  const handleMarkAllNotificationsRead = async () => {
    try {
      const { data } = await api.put("/notifications/read-all");
      if (data.success) {
        toast.success("All notifications marked as read");
        fetchNotifications();
      }
    } catch (err) {
      toast.error("Failed to update notifications.");
    }
  };

  // Handle Delete Notification
  const handleDeleteNotification = async (id) => {
    try {
      const { data } = await api.delete(`/notifications/${id}`);
      if (data.success) {
        setNotifications(prev => prev.filter(n => n._id !== id));
        toast.success("Notification removed");
      }
    } catch (err) {
      toast.error("Failed to delete notification.");
    }
  };

  // Handle Property Delete
  const handleDeleteProperty = async (id) => {
    if (!window.confirm("Are you sure you want to delete this listing?")) return;
    try {
      const { data } = await api.delete(`/properties/${id}`);
      if (data.success) {
        setDbProperties(prev => prev.filter(p => p._id !== id));
        setAllProperties(prev => prev.filter(p => p._id !== id));
        toast.success("Property deleted successfully!");
      }
    } catch (err) {
      toast.error("Failed to delete listing.");
    }
  };

  // Filter saved properties
  const savedProperties = allProperties.filter(p =>
    user?.savedProperties?.some(savedId => (savedId?._id || savedId) === p._id)
  );

  // Dashboard Listings Filtering & Pagination
  const filteredListings = useMemo(() => {
    let result = dbProperties.filter(p => {
      const matchSearch = p.title?.toLowerCase().includes(listingSearch.toLowerCase()) || p.city?.toLowerCase().includes(listingSearch.toLowerCase());
      const matchStatus = listingStatus === "All" ? true : listingStatus === "Verified" ? p.verified : !p.verified;
      const matchPurpose = listingPurpose === "All" ? true : p.purpose === listingPurpose;
      return matchSearch && matchStatus && matchPurpose;
    });

    if (listingSort === "Newest") result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    if (listingSort === "Oldest") result.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    if (listingSort === "Price Low to High") result.sort((a, b) => a.price - b.price);
    if (listingSort === "Price High to Low") result.sort((a, b) => b.price - a.price);

    return result;
  }, [dbProperties, listingSearch, listingStatus, listingPurpose, listingSort]);

  const paginatedListings = useMemo(() => {
    const start = (listingPage - 1) * listingsPerPage;
    return filteredListings.slice(start, start + listingsPerPage);
  }, [filteredListings, listingPage]);
  const totalListingPages = Math.ceil(filteredListings.length / listingsPerPage);

  useEffect(() => {
    setListingPage(1);
  }, [listingSearch, listingStatus, listingPurpose, listingSort]);

  // Pagination helpers
  const getPaginated = (arr, page, limit) => arr.slice((page - 1) * limit, page * limit);
  const getTotalPages = (totalItems, limit) => Math.ceil(totalItems / limit);

  // Enquiries categorisation
  const receivedEnquiries = enquiries.filter(e => e.dealerPhone === user?.phone);
  const sentEnquiries = enquiries.filter(e => e.buyerPhone === user?.phone);

  const paginatedReceived = getPaginated(receivedEnquiries, receivedPage, itemsPerPage);
  const paginatedSent = getPaginated(sentEnquiries, sentPage, itemsPerPage);
  const paginatedSaved = getPaginated(savedProperties, savedPage, itemsPerPage);
  const paginatedNotifs = getPaginated(notifications, notificationPage, itemsPerPage);

  const renderPagination = (page, setPage, totalItems) => {
    const totalPages = getTotalPages(totalItems, itemsPerPage);
    if (totalPages <= 1) return null;
    return (
      <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
        <p className="text-xs text-muted-foreground">
          Showing {((page - 1) * itemsPerPage) + 1} to {Math.min(page * itemsPerPage, totalItems)} of {totalItems}
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="h-8 rounded-full border border-border px-3 text-xs font-medium hover:bg-secondary disabled:opacity-50"
          >
            Prev
          </button>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="h-8 rounded-full border border-border px-3 text-xs font-medium hover:bg-secondary disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    );
  };

  const chartData = useMemo(() => {
    const data = [];
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    const relevantEnquiries = isAdmin ? enquiries : (isDealer ? receivedEnquiries : sentEnquiries);

    for (let i = chartDays - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateString = d.toLocaleDateString();
      const dayEnquiries = relevantEnquiries.filter(e => new Date(e.createdAt).toLocaleDateString() === dateString).length;
      data.push({ date: dateString, enquiries: dayEnquiries });
    }

    const maxVal = Math.max(...data.map(d => d.enquiries), 1);
    return data.map(d => ({ ...d, heightPercentage: Math.max((d.enquiries / maxVal) * 100, 2) }));
  }, [chartDays, enquiries, receivedEnquiries, sentEnquiries, isAdmin, isDealer]);

  const stats = [
    { label: isAdmin ? "System Listings" : "Active listings", value: (isDealer || isAdmin) ? dbProperties.length : "0", icon: Home, trend: "Live status", tab: isAdmin ? "All Listings" : "My Listings" },
    { label: "Received Enquiries", value: isDealer ? receivedEnquiries.length : "0", icon: MessageSquare, trend: "Prospects", tab: "Enquiries" },
    { label: "Sent Enquiries", value: sentEnquiries.length, icon: FileText, trend: "My requests", tab: "Enquiries" },
    { label: "Saved Listings", value: savedProperties.length, icon: Heart, trend: "Shortlist", tab: "Saved" },
  ];

  const tabs = [
    { label: "Overview", path: "overview", icon: BarChart3 },
    ...(isDealer || isAdmin ? [{ label: isAdmin ? "All Listings" : "My Listings", path: "listings", icon: Home }] : []),
    ...(isDealer ? [{ label: "Promote Property", path: "promote", icon: TrendingUp }] : []),
    { label: "Enquiries", path: "enquiries", icon: MessageSquare },
    { label: "Saved", path: "saved", icon: Heart },
    { label: "Notifications", path: "notifications", icon: Bell },
    { label: "Subscription", path: "subscription", icon: CreditCard },
    { label: "Settings", path: "settings", icon: Settings },
  ];

  return (
    <div className="bg-secondary/30 min-h-screen">
      <div className="container-px mx-auto grid max-w-7xl gap-8 py-8 lg:grid-cols-[240px_1fr]">
        {/* Sidebar */}
        <aside className="space-y-4 lg:sticky lg:top-24 lg:h-max">
          <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-gradient-hero font-bold text-primary-foreground shrink-0">
                {userInitials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-sm truncate">{user?.name || "User"}</div>
                <div className="text-xs text-muted-foreground capitalize font-medium">
                  {isAdmin ? "System Admin" : isDealer ? "Premium Dealer" : `${user?.role || "user"} Profile`}
                </div>
              </div>
            </div>
          </div>

          {/* Desktop Navigation Menu (hidden on mobile, visible on lg) */}
          <nav className="hidden lg:block rounded-2xl border border-border bg-card p-2 space-y-1">
            {tabs.map((t) => (
              <button
                key={t.label}
                onClick={() => handleTabChange(t)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  activeTab === t.label
                    ? "bg-primary text-primary-foreground shadow-sm font-semibold"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <t.icon className="h-4 w-4" /> {t.label}
              </button>
            ))}
          </nav>

          {/* Mobile Navigation Selector (visible on mobile, hidden on lg) */}
          <div className="lg:hidden relative">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex w-full items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3 text-sm font-semibold text-foreground shadow-sm hover:bg-secondary/40 transition-all active:scale-[0.99]"
            >
              <div className="flex items-center gap-2.5">
                {(() => {
                  const activeItem = tabs.find(t => t.label === activeTab) || tabs[0];
                  const Icon = activeItem.icon;
                  return (
                    <>
                      <Icon className="h-4 w-4 text-primary" />
                      <span>{activeItem.label}</span>
                    </>
                  );
                })()}
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <span className="text-xs font-normal">Menu</span>
                <Menu className="h-4 w-4" />
              </div>
            </button>

            {/* Dropdown Options List */}
            {mobileMenuOpen && (
              <>
                {/* Backdrop overlay to close when clicking outside */}
                <div className="fixed inset-0 z-20" onClick={() => setMobileMenuOpen(false)} />
                
                <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-30 rounded-2xl border border-border bg-card p-2 shadow-lg animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="space-y-0.5 max-h-[60vh] overflow-y-auto">
                    {tabs.map((t) => {
                      const Icon = t.icon;
                      return (
                        <button
                          key={t.label}
                          onClick={() => {
                            handleTabChange(t);
                            setMobileMenuOpen(false);
                          }}
                          className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition ${
                            activeTab === t.label
                              ? "bg-primary-soft text-primary font-semibold"
                              : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                          }`}
                        >
                          <Icon className="h-4 w-4 shrink-0" />
                          <span>{t.label}</span>
                        </button>
                      );
                    })}
                    <button
                      onClick={async () => {
                        setMobileMenuOpen(false);
                        await logout();
                        navigate("/", { replace: true });
                      }}
                      className="flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium text-destructive hover:bg-destructive/10 transition mt-1 pt-3 border-t border-border"
                    >
                      <LogOut className="h-4 w-4 shrink-0" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </aside>

          {/* Main */}
          <div className="space-y-6 min-w-0">
            {/* Header row */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="font-display text-3xl font-bold">
                  Welcome back, {user?.name?.split(' ')[0] || "User"} 👋
                </h1>
                <p className="text-muted-foreground text-sm mt-0.5">
                  {isAdmin ? "Moderate system listings and user enquiries" : "Manage your real estate listings, callbacks, and notification center"}
                </p>
              </div>
            </div>
            
            <AnimatePresence mode="wait">

          {/* Tab 1: Overview */}
          {activeTab === "Overview" && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Stats Grid */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {stats.map((s) => (
                  <button
                    key={s.label}
                    onClick={() => {
                      const targetTab = tabs.find(t => t.label === s.tab);
                      if (targetTab) handleTabChange(targetTab);
                    }}
                    className="rounded-2xl border border-border bg-card p-5 shadow-sm text-left transition hover:border-primary hover:shadow-md active:scale-95"
                  >
                    <div className="flex items-center justify-between">
                      <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary-soft text-primary">
                        <s.icon className="h-5 w-5" />
                      </div>
                      <span className="text-xs font-semibold text-muted-foreground px-2 py-0.5 bg-secondary rounded-full">
                        {s.trend}
                      </span>
                    </div>
                    <div className="mt-4 font-display text-3xl font-bold">{s.value}</div>
                    <div className="text-sm text-muted-foreground mt-0.5">{s.label}</div>
                  </button>
                ))}
              </div>

              {/* Chart section */}
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="font-display text-lg font-bold">Workspace Activity</h2>
                    <p className="text-xs text-muted-foreground">Property enquiries timeline (last {chartDays} days)</p>
                  </div>
                  <select 
                    value={chartDays}
                    onChange={(e) => setChartDays(Number(e.target.value))}
                    className="rounded-full border border-border bg-background px-3 py-1.5 text-xs outline-none focus:border-primary"
                  >
                    <option value={30}>30 days</option>
                    <option value={7}>7 days</option>
                  </select>
                </div>
                <div className="flex h-48 items-end gap-1.5 pt-4">
                  {chartData.map((d, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-t bg-gradient-to-t from-primary to-accent transition-all hover:opacity-85"
                      style={{ height: `${d.heightPercentage}%` }}
                      title={`${d.date}: ${d.enquiries} enquiries`}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Tab 2: My Listings (Dealer / Admin only) */}
          {(activeTab === "My Listings" || activeTab === "All Listings") && (isDealer || isAdmin) && (
            <motion.div
              key="listings"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="font-display text-xl font-bold">
                    {isAdmin ? "All System Listings" : "My Properties"}
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Edit, delete, and view status of properties</p>
                </div>
                {dbProperties.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 mt-3 sm:mt-0">
                    <div className="relative flex-1 min-w-[150px]">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <input 
                        type="text" 
                        placeholder="Search properties..." 
                        value={listingSearch}
                        onChange={(e) => setListingSearch(e.target.value)}
                        className="w-full rounded-full border border-border bg-background py-1.5 pl-9 pr-4 text-xs outline-none focus:border-primary"
                      />
                    </div>
                    <select 
                      value={listingStatus} 
                      onChange={(e) => setListingStatus(e.target.value)}
                      className="rounded-full border border-border bg-background px-3 py-1.5 text-xs outline-none focus:border-primary"
                    >
                      <option value="All">All Status</option>
                      <option value="Verified">Verified</option>
                      <option value="Unverified">Pending</option>
                    </select>
                    <select 
                      value={listingPurpose} 
                      onChange={(e) => setListingPurpose(e.target.value)}
                      className="rounded-full border border-border bg-background px-3 py-1.5 text-xs outline-none focus:border-primary"
                    >
                      <option value="All">All Purposes</option>
                      <option value="Buy">Buy</option>
                      <option value="Rent">Rent</option>
                      <option value="Commercial">Commercial</option>
                    </select>
                    <select 
                      value={listingSort} 
                      onChange={(e) => setListingSort(e.target.value)}
                      className="rounded-full border border-border bg-background px-3 py-1.5 text-xs outline-none focus:border-primary"
                    >
                      <option value="Newest">Newest</option>
                      <option value="Oldest">Oldest</option>
                      <option value="Price Low to High">Price: Low to High</option>
                      <option value="Price High to Low">Price: High to Low</option>
                    </select>
                  </div>
                )}
              </div>
              {loadingListings ? (
                <div className="h-40 flex items-center justify-center text-sm text-muted-foreground animate-pulse">
                  Loading listings...
                </div>
              ) : filteredListings.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-border bg-card p-12 text-center">
                  <Inbox className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm font-semibold text-foreground">No matching listings</p>
                  <p className="text-xs text-muted-foreground mt-1">Try adjusting your filters or search.</p>
                  <button onClick={() => {setListingSearch(""); setListingStatus("All"); setListingPurpose("All"); setListingSort("Newest");}} className="mt-4 text-xs font-semibold text-primary hover:underline">Reset Filters</button>
                </div>
              ) : (
                <>
                  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {paginatedListings.map((p) => (
                      <div key={p._id} className="relative group flex flex-col h-full">
                        <div className="flex-1 flex flex-col">
                          <PropertyCard p={p} />
                        </div>
                        <div className="absolute right-3 bottom-3 z-10 flex gap-2">
                          <Link
                            to={`/edit-property/${p._id}`}
                            className="flex h-9 w-9 items-center justify-center rounded-xl bg-card text-foreground border border-border shadow-soft transition hover:bg-secondary hover:scale-105"
                            title="Edit listing"
                          >
                            <Pencil className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => handleDeleteProperty(p._id)}
                            className="flex h-9 w-9 items-center justify-center rounded-xl bg-destructive text-destructive-foreground shadow-soft transition hover:bg-destructive/90 hover:scale-105"
                            title="Delete listing"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {totalListingPages > 1 && (
                    <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
                      <p className="text-xs text-muted-foreground">
                        Showing {((listingPage - 1) * listingsPerPage) + 1} to {Math.min(listingPage * listingsPerPage, filteredListings.length)} of {filteredListings.length}
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setListingPage(p => Math.max(1, p - 1))}
                          disabled={listingPage === 1}
                          className="h-8 rounded-full border border-border px-3 text-xs font-medium hover:bg-secondary disabled:opacity-50"
                        >
                          Prev
                        </button>
                        <button
                          onClick={() => setListingPage(p => Math.min(totalListingPages, p + 1))}
                          disabled={listingPage === totalListingPages}
                          className="h-8 rounded-full border border-border px-3 text-xs font-medium hover:bg-secondary disabled:opacity-50"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          )}

          {/* Tab 3: Promote Property (Dealer only) */}
          {activeTab === "Promote Property" && isDealer && (
            <motion.div
              key="promote"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <PromotePropertyTab properties={dbProperties} refreshData={refreshUser} />
            </motion.div>
          )}

          {/* Tab 4: Enquiries (Received and Sent) */}
          {activeTab === "Enquiries" && (
            <motion.div
              key="enquiries"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div>
                <h2 className="font-display text-xl font-bold">Callback & Property Enquiries</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Manage messages, status tracking, and callbacks</p>
              </div>

              {loadingEnquiries ? (
                <div className="h-40 flex items-center justify-center text-sm text-muted-foreground animate-pulse">
                  Loading enquiries...
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Received Enquiries (Only for Dealers) */}
                  {isDealer && (
                    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                      <h3 className="font-display text-lg font-bold mb-4 flex items-center gap-2">
                        <Inbox className="h-5 w-5 text-primary" /> Received Callback Requests
                      </h3>
                      {receivedEnquiries.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-4 text-center">No callback requests received yet.</p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse text-sm">
                            <thead>
                              <tr className="border-b border-border text-muted-foreground font-semibold">
                                <th className="pb-3 pr-4">Property</th>
                                <th className="pb-3 px-4">Prospect / Buyer</th>
                                <th className="pb-3 px-4">Message</th>
                                <th className="pb-3 px-4">Status</th>
                                <th className="pb-3 pl-4 text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {paginatedReceived.map((e) => (
                                <tr key={e._id} className="border-b border-secondary hover:bg-secondary/20 transition-colors">
                                  <td className="py-4 pr-4 font-semibold">
                                    {e.property ? (
                                      <Link to={`/properties/${e.property._id || e.property.id}`} className="hover:text-primary transition-colors">
                                        {e.property.title}
                                      </Link>
                                    ) : (
                                      <span className="text-muted-foreground italic">Deleted Listing</span>
                                    )}
                                  </td>
                                  <td className="py-4 px-4">
                                    <div className="font-semibold">{e.buyerName}</div>
                                    <div className="text-xs text-muted-foreground">{e.buyerPhone}</div>
                                  </td>
                                  <td className="py-4 px-4 text-muted-foreground max-w-xs truncate" title={e.message}>
                                    {e.message}
                                  </td>
                                  <td className="py-4 px-4">
                                    <select
                                      value={e.status}
                                      onChange={(el) => handleUpdateEnquiryStatus(e._id, el.target.value)}
                                      className={`rounded-full px-3 py-1 text-xs font-semibold outline-none border border-transparent ${
                                        e.status === 'Closed'
                                          ? 'bg-secondary text-muted-foreground'
                                          : e.status === 'Contacted'
                                          ? 'bg-success-soft text-success border-success/20'
                                          : 'bg-primary-soft text-primary border-primary/20'
                                      }`}
                                    >
                                      <option value="Pending">Pending</option>
                                      <option value="Contacted">Contacted</option>
                                      <option value="Closed">Closed</option>
                                    </select>
                                  </td>
                                  <td className="py-4 pl-4 text-right">
                                    <a
                                      href={`tel:${e.buyerPhone}`}
                                      className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-primary-soft text-primary hover:bg-primary hover:text-primary-foreground transition-all"
                                      title="Call Buyer"
                                    >
                                      <Phone className="h-4 w-4" />
                                    </a>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                      {renderPagination(receivedPage, setReceivedPage, receivedEnquiries.length)}
                    </div>
                  )}

                  {/* Sent Enquiries */}
                  <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                    <h3 className="font-display text-lg font-bold mb-4 flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" /> My Sent Callbacks / Enquiries
                    </h3>
                    {sentEnquiries.length === 0 ? (
                      <div className="py-8 text-center text-sm text-muted-foreground">
                        You have not sent any property callbacks yet.
                        <div className="mt-3">
                          <Link to="/properties" className="inline-flex rounded-xl bg-primary/10 text-primary hover:bg-primary/20 px-4 py-2 text-xs font-semibold">
                            Browse Properties
                          </Link>
                        </div>
                      </div>
                    ) : (
                      <div className="grid gap-4 sm:grid-cols-2">
                        {paginatedSent.map((e) => (
                          <div key={e._id} className="rounded-xl border border-border bg-secondary/35 p-4 space-y-3">
                            <div className="flex justify-between items-start gap-2">
                              <div>
                                <h4 className="font-semibold text-sm line-clamp-1">
                                  {e.property ? (
                                    <Link to={`/properties/${e.property._id || e.property.id}`} className="hover:text-primary transition-colors">
                                      {e.property.title}
                                    </Link>
                                  ) : (
                                    <span className="text-muted-foreground italic">Deleted Listing</span>
                                  )}
                                </h4>
                                <p className="text-xs text-muted-foreground mt-0.5">Dealer Contact: {e.dealerPhone}</p>
                              </div>
                              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold border ${
                                e.status === 'Closed'
                                  ? 'bg-secondary text-muted-foreground border-border'
                                  : e.status === 'Contacted'
                                  ? 'bg-success-soft text-success border-success/20'
                                  : 'bg-primary-soft text-primary border-primary/20'
                              }`}>
                                {e.status}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground bg-card p-3 rounded-lg border border-border italic">
                              "{e.message}"
                            </p>
                            <div className="flex justify-between items-center text-xs text-muted-foreground">
                              <span>Sent: {new Date(e.createdAt).toLocaleDateString()}</span>
                              <a href={`tel:${e.dealerPhone}`} className="inline-flex items-center gap-1 text-primary hover:underline font-semibold">
                                <Phone className="h-3 w-3" /> Call Dealer
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {renderPagination(sentPage, setSentPage, sentEnquiries.length)}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Tab 5: Saved Properties */}
          {activeTab === "Saved" && (
            <motion.div
              key="saved"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-4">
                <h2 className="font-display text-xl font-bold">Saved Properties</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Your shortlisted properties</p>
              </div>
              {savedProperties.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-border bg-card p-12 text-center">
                  <Heart className="h-10 w-10 mx-auto text-destructive mb-3" />
                  <p className="text-sm font-semibold text-foreground">Your shortlist is empty</p>
                  <p className="text-xs text-muted-foreground mt-1">Tap the heart icon on properties page to save them here.</p>
                  <Link to="/properties" className="inline-flex items-center gap-1 mt-4 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground">
                    Browse Properties
                  </Link>
                </div>
              ) : (
                <>
                  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {paginatedSaved.map((p) => (
                      <PropertyCard key={p._id || p.id} p={p} />
                    ))}
                  </div>
                  {renderPagination(savedPage, setSavedPage, savedProperties.length)}
                </>
              )}
            </motion.div>
          )}

          {/* Tab 5: Notifications */}
          {activeTab === "Notifications" && (
            <motion.div
              key="notifications"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-xl font-bold">Notification Center</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Stay updated with activities and callbacks</p>
                </div>
                {notifications.length > 0 && (
                  <button
                    onClick={handleMarkAllNotificationsRead}
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-semibold"
                  >
                    <Check className="h-3.5 w-3.5" /> Mark all as read
                  </button>
                )}
              </div>

              {loadingNotifications ? (
                <div className="h-40 flex items-center justify-center text-sm text-muted-foreground animate-pulse">
                  Loading notifications...
                </div>
              ) : notifications.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-border bg-card p-12 text-center">
                  <Bell className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm font-semibold text-foreground">No notifications</p>
                  <p className="text-xs text-muted-foreground mt-1">We will alert you here when callbacks are requested.</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    {paginatedNotifs.map((n) => (
                      <div
                        key={n._id}
                        className={`flex gap-3 rounded-2xl border p-4 shadow-sm transition-colors ${
                          n.read
                            ? 'border-border bg-card/75 opacity-75'
                            : 'border-primary/20 bg-primary-soft/30'
                        }`}
                      >
                        <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${
                          n.read ? 'bg-secondary text-muted-foreground' : 'bg-primary text-primary-foreground'
                        }`}>
                          <Bell className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3">
                            <h4 className={`text-sm font-semibold truncate ${n.read ? 'text-foreground/85' : 'text-foreground'}`}>
                              {n.title}
                            </h4>
                            <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                              {new Date(n.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                            {n.message}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeleteNotification(n._id)}
                          className="text-muted-foreground hover:text-destructive transition-colors"
                          title="Remove Notification"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  {renderPagination(notificationPage, setNotificationPage, notifications.length)}
                </>
              )}
            </motion.div>
          )}

          {/* Tab 6: Subscription */}
          {activeTab === "Subscription" && (
            <motion.div
              key="subscription"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-6"
            >
              <div>
                <h2 className="font-display text-xl font-bold">Premium Subscription</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Manage billing details and system membership limits</p>
              </div>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="rounded-xl border border-primary/20 bg-primary-soft/20 p-5 space-y-3">
                  <div className="text-xs uppercase tracking-wider text-primary font-bold">Current Plan</div>
                  <div className="font-display text-2xl font-bold">Dealer Pro Partner</div>
                  <p className="text-xs text-muted-foreground">Enjoy unlimited listings, priority customer callback requests, and top placement search sorting features.</p>
                  <div className="flex justify-between text-xs font-semibold pt-4">
                    <span>Status: Active</span>
                    <span>Expires: 31 Dec 2026</span>
                  </div>
                </div>
                <div className="rounded-xl border border-border bg-secondary/20 p-5 space-y-3">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Usage Summary</div>
                  <div className="space-y-2 pt-2">
                    <div className="flex justify-between text-xs">
                      <span>Listings Published</span>
                      <span className="font-semibold">{dbProperties.length} / Unlimited</span>
                    </div>
                    <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                      <div className="bg-primary h-full rounded-full" style={{ width: '45%' }} />
                    </div>
                    <div className="flex justify-between text-xs pt-1">
                      <span>SMS OTP Credits</span>
                      <span className="font-semibold">500 / 500</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Tab 7: Settings */}
          {activeTab === "Settings" && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-6"
            >
              <div>
                <h2 className="font-display text-xl font-bold">Account Settings</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Manage user preferences and contact numbers</p>
              </div>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!newName || newName.trim().length < 2) {
                    toast.error("Name must be at least 2 characters");
                    return;
                  }
                  setUpdatingProfile(true);
                  try {
                    const { data } = await api.put("/users/me", { name: newName });
                    if (data.success) {
                      toast.success("Profile updated successfully!");
                      await refreshUser();
                    }
                  } catch (err) {
                    toast.error(err.response?.data?.error || "Failed to update profile");
                  } finally {
                    setUpdatingProfile(false);
                  }
                }}
                className="space-y-4 max-w-md"
              >
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Full Name</label>
                  <input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Enter full name"
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Mobile Number</label>
                  <input
                    disabled
                    value={user?.phone || ""}
                    className="w-full rounded-xl border border-border bg-muted/50 px-4 py-2.5 text-sm outline-none cursor-not-allowed"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Profile Role</label>
                  <input
                    disabled
                    value={user?.role || ""}
                    className="w-full rounded-xl border border-border bg-muted/50 px-4 py-2.5 text-sm outline-none cursor-not-allowed capitalize"
                  />
                </div>
                <button
                  type="submit"
                  disabled={updatingProfile}
                  className="rounded-full bg-primary text-primary-foreground px-6 py-2.5 text-xs font-semibold shadow-md hover:bg-primary/95 transition-all disabled:opacity-50"
                >
                  {updatingProfile ? "Saving..." : "Save Settings"}
                </button>
              </form>

              {isDealer && <KycSection />}
            </motion.div>
          )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
