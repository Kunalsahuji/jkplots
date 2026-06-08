import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Home, Heart, Bell, BarChart3, CreditCard, Settings, Plus, Eye, MessageSquare, TrendingUp, Trash2, Pencil } from "lucide-react";
import { PropertyCard } from "@/components/site/PropertyCard";
import { useAuth } from "@/context/AuthContext";
import api from "@/utils/api";
import { toast } from "sonner";

export default function UserDashboard() {
  const { user } = useAuth();
  const isDealer = user?.role === "dealer";
  const isAdmin = user?.role === "admin";
  const userInitials = user?.name ? user.name.charAt(0).toUpperCase() : "U";

  const [dbProperties, setDbProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchListings = async () => {
      setLoading(true);
      try {
        const { data } = await api.get("/properties");
        if (data.success) {
          if (isAdmin) {
            setDbProperties(data.data);
          } else if (isDealer) {
            setDbProperties(data.data.filter(p => p.dealerPhone === user?.phone));
          }
        }
      } catch (err) {
        console.error("Failed to load dashboard listings:", err);
      } finally {
        setLoading(false);
      }
    };
    if (isAdmin || isDealer) {
      fetchListings();
    } else {
      setLoading(false);
    }
  }, [user, isAdmin, isDealer]);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this listing?")) return;
    try {
      const { data } = await api.delete(`/properties/${id}`);
      if (data.success) {
        setDbProperties(prev => prev.filter(p => p._id !== id));
        toast.success("Property deleted successfully!");
      }
    } catch (err) {
      toast.error("Failed to delete listing.");
    }
  };

  const stats = [
    { label: isAdmin ? "System Listings" : "Active listings", value: (isDealer || isAdmin) ? dbProperties.length : "0", icon: Home, trend: "+0 this week" },
    { label: "Total views", value: (isDealer || isAdmin) ? "12,480" : "0", icon: Eye, trend: "+0%" },
    { label: "Enquiries", value: (isDealer || isAdmin) ? "86" : "0", icon: MessageSquare, trend: "+0 today" },
    { label: "Saved by users", value: (isDealer || isAdmin) ? "243" : "0", icon: Heart, trend: "+0%" },
  ];

  const tabs = [
    { label: "Overview", icon: BarChart3 },
    { label: isAdmin ? "All Listings" : "My Listings", icon: Home },
    { label: "Saved", icon: Heart },
    { label: "Notifications", icon: Bell },
    { label: "Subscription", icon: CreditCard },
    { label: "Settings", icon: Settings },
  ];

  return (
    <div className="bg-secondary/30">
      <div className="container-px mx-auto grid max-w-7xl gap-8 py-8 lg:grid-cols-[240px_1fr]">
        {/* Sidebar */}
        <aside>
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-gradient-hero font-bold text-primary-foreground">
                {userInitials}
              </div>
              <div>
                <div className="font-semibold">{user?.name || "User"}</div>
                <div className="text-xs text-muted-foreground capitalize">
                  {isAdmin ? "System Admin" : isDealer ? "Premium Dealer" : `${user?.role || "user"} Profile`}
                </div>
              </div>
            </div>
          </div>
          <nav className="mt-3 rounded-2xl border border-border bg-card p-2">
            {tabs.map((t, i) => (
              <button
                key={t.label}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  i === 0
                    ? "bg-primary text-primary-foreground"
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
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="font-display text-3xl font-bold">
                Welcome back, {user?.name?.split(' ')[0] || "User"} 👋
              </h1>
              <p className="text-muted-foreground">
                {isAdmin ? "Manage system properties and moderate listings" : "Here's how your properties are performing"}
              </p>
            </div>
            {isDealer && (
              <Link
                to="/post-property"
                className="inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
              >
                <Plus className="h-4 w-4" /> Post Property
              </Link>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="rounded-2xl border border-border bg-card p-5">
                <div className="flex items-center justify-between">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary-soft text-primary">
                    <s.icon className="h-5 w-5" />
                  </div>
                  <span className="flex items-center gap-1 text-xs font-medium text-success">
                    <TrendingUp className="h-3 w-3" /> {s.trend}
                  </span>
                </div>
                <div className="mt-4 font-display text-3xl font-bold">{s.value}</div>
                <div className="text-sm text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="font-display text-xl font-bold">Views in last 30 days</h2>
              <select className="rounded-full border border-border bg-background px-3 py-1.5 text-xs">
                <option>30 days</option>
                <option>7 days</option>
              </select>
            </div>
            <div className="flex h-48 items-end gap-1.5">
              {Array.from({ length: 30 }).map((_, i) => {
                const h = 20 + Math.sin(i / 3) * 30 + Math.random() * 40;
                return (
                  <div
                    key={i}
                    className="flex-1 rounded-t bg-gradient-to-t from-primary to-accent"
                    style={{ height: `${h}%` }}
                  />
                );
              })}
            </div>
          </div>

          {(isDealer || isAdmin) && (
            <div>
              <h2 className="mb-4 font-display text-xl font-bold">
                {isAdmin ? "System listings moderation" : "My listings"}
              </h2>
              {loading ? (
                <div className="h-20 flex items-center justify-center text-sm text-muted-foreground animate-pulse">
                  Loading listings...
                </div>
              ) : dbProperties.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
                  No properties found.
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
                          onClick={() => handleDelete(p._id)}
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
        </div>
      </div>
    </div>
  );
}
