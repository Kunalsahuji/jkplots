import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
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
  FileText
} from "lucide-react";
import { PropertyCard } from "@/components/site/PropertyCard";
import { useAuth } from "@/context/AuthContext";
import api from "@/utils/api";
import { toast } from "sonner";

export default function UserDashboard() {
  const { user, refreshUser } = useAuth();
  const isDealer = user?.role === "dealer";
  const isAdmin = user?.role === "admin";
  const userInitials = user?.name ? user.name.charAt(0).toUpperCase() : "U";

  const [activeTab, setActiveTab] = useState("Overview");
  const [newName, setNewName] = useState(user?.name || "");
  const [updatingProfile, setUpdatingProfile] = useState(false);
  
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

  // Enquiries categorisation
  const receivedEnquiries = enquiries.filter(e => e.dealerPhone === user?.phone);
  const sentEnquiries = enquiries.filter(e => e.buyerPhone === user?.phone);

  const stats = [
    { label: isAdmin ? "System Listings" : "Active listings", value: (isDealer || isAdmin) ? dbProperties.length : "0", icon: Home, trend: "Live status" },
    { label: "Received Enquiries", value: isDealer ? receivedEnquiries.length : "0", icon: MessageSquare, trend: "Prospects" },
    { label: "Sent Enquiries", value: sentEnquiries.length, icon: FileText, trend: "My requests" },
    { label: "Saved Listings", value: savedProperties.length, icon: Heart, trend: "Shortlist" },
  ];

  const tabs = [
    { label: "Overview", icon: BarChart3 },
    ...(isDealer || isAdmin ? [{ label: isAdmin ? "All Listings" : "My Listings", icon: Home }] : []),
    { label: "Enquiries", icon: MessageSquare },
    { label: "Saved", icon: Heart },
    { label: "Notifications", icon: Bell },
    { label: "Subscription", icon: CreditCard },
    { label: "Settings", icon: Settings },
  ];

  return (
    <div className="bg-secondary/30 min-h-screen">
      <div className="container-px mx-auto grid max-w-7xl gap-8 py-8 lg:grid-cols-[240px_1fr]">
        {/* Sidebar */}
        <aside className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-gradient-hero font-bold text-primary-foreground">
                {userInitials}
              </div>
              <div>
                <div className="font-semibold text-sm truncate max-w-[140px]">{user?.name || "User"}</div>
                <div className="text-xs text-muted-foreground capitalize font-medium">
                  {isAdmin ? "System Admin" : isDealer ? "Premium Dealer" : `${user?.role || "user"} Profile`}
                </div>
              </div>
            </div>
          </div>
          <nav className="rounded-2xl border border-border bg-card p-2 space-y-1">
            {tabs.map((t) => (
              <button
                key={t.label}
                onClick={() => setActiveTab(t.label)}
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
        </aside>

        {/* Main */}
        <div className="space-y-6">
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
            {isDealer && (
              <Link
                to="/post-property"
                className="inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all shadow-md hover:scale-[1.02]"
              >
                <Plus className="h-4 w-4" /> Post Property
              </Link>
            )}
          </div>

          {/* Tab 1: Overview */}
          {activeTab === "Overview" && (
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {stats.map((s) => (
                  <div key={s.label} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
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
                  </div>
                ))}
              </div>

              {/* Chart section */}
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="font-display text-lg font-bold">Workspace Activity</h2>
                    <p className="text-xs text-muted-foreground">Listing views & enquiries rate (last 30 days)</p>
                  </div>
                  <select className="rounded-full border border-border bg-background px-3 py-1.5 text-xs outline-none focus:border-primary">
                    <option>30 days</option>
                    <option>7 days</option>
                  </select>
                </div>
                <div className="flex h-48 items-end gap-1.5 pt-4">
                  {Array.from({ length: 30 }).map((_, i) => {
                    const h = 20 + Math.sin(i / 3) * 30 + Math.random() * 40;
                    return (
                      <div
                        key={i}
                        className="flex-1 rounded-t bg-gradient-to-t from-primary to-accent transition-all hover:opacity-85"
                        style={{ height: `${h}%` }}
                        title={`Day ${i+1}: ${Math.round(h * 15)} views`}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: My Listings (Dealer / Admin only) */}
          {(activeTab === "My Listings" || activeTab === "All Listings") && (isDealer || isAdmin) && (
            <div>
              <div className="mb-4">
                <h2 className="font-display text-xl font-bold">
                  {isAdmin ? "All System Listings" : "My Properties"}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">Edit, delete, and view status of properties</p>
              </div>
              {loadingListings ? (
                <div className="h-40 flex items-center justify-center text-sm text-muted-foreground animate-pulse">
                  Loading listings...
                </div>
              ) : dbProperties.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-border bg-card p-12 text-center">
                  <Inbox className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm font-semibold text-foreground">No listings found</p>
                  <p className="text-xs text-muted-foreground mt-1">Start by posting your first property today.</p>
                  {isDealer && (
                    <Link to="/post-property" className="inline-flex items-center gap-1 mt-4 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground">
                      <Plus className="h-3 w-3" /> Post Listing
                    </Link>
                  )}
                </div>
              ) : (
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {dbProperties.map((p) => (
                    <div key={p._id} className="relative group">
                      <PropertyCard p={p} />
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
              )}
            </div>
          )}

          {/* Tab 3: Enquiries (Received and Sent) */}
          {activeTab === "Enquiries" && (
            <div className="space-y-6">
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
                              {receivedEnquiries.map((e) => (
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
                        {sentEnquiries.map((e) => (
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
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab 4: Saved Properties */}
          {activeTab === "Saved" && (
            <div>
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
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {savedProperties.map((p) => (
                    <PropertyCard key={p._id || p.id} p={p} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 5: Notifications */}
          {activeTab === "Notifications" && (
            <div className="space-y-6">
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
                <div className="space-y-3">
                  {notifications.map((n) => (
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
              )}
            </div>
          )}

          {/* Tab 6: Subscription */}
          {activeTab === "Subscription" && (
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-6">
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
            </div>
          )}

          {/* Tab 7: Settings */}
          {activeTab === "Settings" && (
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-6">
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
