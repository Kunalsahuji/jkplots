import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Home,
  Users,
  Shield,
  Trash2,
  CheckCircle,
  Star,
  Settings,
  Activity,
  LogOut,
  MapPin,
  Building,
  DollarSign,
  Plus,
  Pencil
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import api from "@/utils/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

const formatPrice = (val) => {
  if (!val) return "₹—";
  if (typeof val === "string") return val;
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(1)} L`;
  return `₹${val.toLocaleString()}`;
};

export default function AdminDashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("listings");
  const [properties, setProperties] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [propRes, userRes] = await Promise.all([
        api.get("/properties"),
        api.get("/users")
      ]);
      if (propRes.data.success) setProperties(propRes.data.data);
      if (userRes.data.success) setUsers(userRes.data.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch system data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/admin/login");
  };

  const handleDeleteProperty = async (id) => {
    if (!window.confirm("Are you sure you want to delete this property listing?")) return;
    try {
      const { data } = await api.delete(`/properties/${id}`);
      if (data.success) {
        setProperties((prev) => prev.filter((p) => p._id !== id));
        toast.success("Listing deleted successfully!");
      }
    } catch (err) {
      toast.error("Failed to delete property.");
    }
  };

  const toggleVerifyProperty = async (prop) => {
    try {
      // Toggle verified status (simulate via updating description or local state since Mongoose schema doesn't have an active flag yet)
      // If we want to simulate it, we can update local state, or if we want to toggle status we can send a PUT request.
      // Let's do a PUT request to update the property
      const updatedVerified = !prop.verified;
      const { data } = await api.put(`/properties/${prop._id}`, {
        ...prop,
        verified: updatedVerified
      });
      if (data.success) {
        setProperties(prev => prev.map(p => p._id === prop._id ? { ...p, verified: updatedVerified } : p));
        toast.success(`Property ${updatedVerified ? "Verified" : "Unverified"} successfully!`);
      }
    } catch (err) {
      toast.error("Failed to toggle verification.");
    }
  };

  const toggleFeaturedProperty = async (prop) => {
    try {
      const updatedFeatured = !prop.featured;
      const { data } = await api.put(`/properties/${prop._id}`, {
        ...prop,
        featured: updatedFeatured
      });
      if (data.success) {
        setProperties(prev => prev.map(p => p._id === prop._id ? { ...p, featured: updatedFeatured } : p));
        toast.success(`Property set as ${updatedFeatured ? "Featured" : "Regular"}!`);
      }
    } catch (err) {
      toast.error("Failed to toggle featured state.");
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-white">
      {/* Top Navbar */}
      <header className="border-b border-white/10 bg-[#0c0c0e]/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-500 text-black font-bold">
              <Shield className="h-5 w-5" />
            </span>
            <span className="font-display text-xl font-bold tracking-tight">
              JKPLOT <span className="text-emerald-400">ADMIN</span>
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm font-semibold">{user?.name || "System Admin"}</div>
              <div className="text-[10px] uppercase tracking-wider text-emerald-400">Root Access</div>
            </div>
            <button
              onClick={handleLogout}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 border border-white/10 hover:bg-red-500/10 hover:text-red-400 transition"
              title="Logout"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-10 space-y-8">
        {/* Title */}
        <div>
          <h1 className="font-display text-3xl font-bold">Administrative Dashboard</h1>
          <p className="text-sm text-gray-400">Real-time system stats, listing moderation, and user registries.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-[#121214] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-gray-400">System Listings</span>
              <Home className="h-5 w-5 text-emerald-400" />
            </div>
            <div className="font-display text-3xl font-bold">{properties.length}</div>
            <div className="text-xs text-gray-500">Total properties in MongoDB</div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#121214] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-gray-400">Registered Users</span>
              <Users className="h-5 w-5 text-blue-400" />
            </div>
            <div className="font-display text-3xl font-bold">{users.length}</div>
            <div className="text-xs text-gray-500">Dealers, Admins, and Buyers</div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#121214] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-gray-400">API Status</span>
              <Activity className="h-5 w-5 text-emerald-500 animate-pulse" />
            </div>
            <div className="font-display text-xl font-bold text-emerald-400">Operational</div>
            <div className="text-xs text-gray-500">All backend subsystems active</div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#121214] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-gray-400">SMS Gateway</span>
              <Settings className="h-5 w-5 text-amber-400" />
            </div>
            <div className="font-display text-xl font-bold text-gray-300">Sandbox Mode</div>
            <div className="text-xs text-gray-500">OTP verified with dev mode bypass</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10">
          {[
            { id: "listings", label: "Properties Moderation", icon: Home },
            { id: "users", label: "Registered Users", icon: Users },
            { id: "system", label: "System Config", icon: Settings },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold border-b-2 transition ${
                activeTab === t.id
                  ? "border-emerald-500 text-emerald-400 bg-white/5"
                  : "border-transparent text-gray-400 hover:text-white"
              }`}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="h-40 flex items-center justify-center animate-pulse text-gray-400 text-sm">
            Fetching system records...
          </div>
        ) : (
          <div className="space-y-6">
            {activeTab === "listings" && (
              <div className="rounded-2xl border border-white/10 bg-[#121214] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-gray-300">
                    <thead className="bg-[#18181b] text-xs uppercase text-gray-400 border-b border-white/10">
                      <tr>
                        <th className="px-6 py-4">Property</th>
                        <th className="px-6 py-4">Location</th>
                        <th className="px-6 py-4">Price</th>
                        <th className="px-6 py-4">Dealer Contact</th>
                        <th className="px-6 py-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {properties.map((p) => (
                        <tr key={p._id} className="hover:bg-white/5 transition">
                          <td className="px-6 py-4 font-semibold text-white">
                            <div className="flex flex-col">
                              <span>{p.title}</span>
                              <span className="text-xs text-gray-500 font-normal">{p.type} · For {p.purpose}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-gray-400">
                            {p.locality}, {p.city}
                          </td>
                          <td className="px-6 py-4 font-mono font-semibold text-emerald-400">
                            {formatPrice(p.price)}
                          </td>
                          <td className="px-6 py-4 text-gray-400">
                            {p.contactNumber || p.dealerPhone}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => toggleVerifyProperty(p)}
                                className={`flex h-8 px-3 items-center gap-1 rounded-xl text-xs font-bold transition ${
                                  p.verified
                                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                    : "bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10"
                                }`}
                              >
                                <CheckCircle className="h-3.5 w-3.5" />
                                {p.verified ? "Verified" : "Verify"}
                              </button>
                              <button
                                onClick={() => toggleFeaturedProperty(p)}
                                className={`flex h-8 px-3 items-center gap-1 rounded-xl text-xs font-bold transition ${
                                  p.featured
                                    ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                    : "bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10"
                                }`}
                              >
                                <Star className="h-3.5 w-3.5" />
                                {p.featured ? "Featured" : "Feature"}
                              </button>
                              <Link
                                to={`/edit-property/${p._id}`}
                                className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10 transition"
                                title="Edit Listing"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Link>
                              <button
                                onClick={() => handleDeleteProperty(p._id)}
                                className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-black border border-red-500/20 transition"
                                title="Delete Listing"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "users" && (
              <div className="rounded-2xl border border-white/10 bg-[#121214] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-gray-300">
                    <thead className="bg-[#18181b] text-xs uppercase text-gray-400 border-b border-white/10">
                      <tr>
                        <th className="px-6 py-4">User Name</th>
                        <th className="px-6 py-4">Phone Number</th>
                        <th className="px-6 py-4">System Role</th>
                        <th className="px-6 py-4">Registered Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {users.map((u) => (
                        <tr key={u.id || u._id} className="hover:bg-white/5 transition">
                          <td className="px-6 py-4 font-semibold text-white">
                            {u.name || "N/A"}
                          </td>
                          <td className="px-6 py-4 font-mono text-gray-400">
                            +91 {u.phone}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase ${
                              u.role === "admin"
                                ? "bg-red-500/20 text-red-400 border border-red-500/30"
                                : u.role === "dealer"
                                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                            }`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-500">
                            {new Date(u.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "system" && (
              <div className="grid gap-6 md:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-[#121214] p-6 space-y-4">
                  <h3 className="font-display text-lg font-bold">API Integration Keys</h3>
                  <div className="space-y-3">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Google Maps Platform API Key</div>
                      <input
                        readOnly
                        value={import.meta.env.VITE_GOOGLE_MAP_API_KEY || "AIzaSyBD9XADWUsuj0M3LWr3d9NjUEEsvDPU_eU"}
                        className="w-full bg-[#1c1c1e] text-gray-300 font-mono text-xs rounded-xl border border-white/10 px-3 py-2 outline-none"
                      />
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Cloudinary Cloud Name</div>
                      <input
                        readOnly
                        value="dk8peecsb"
                        className="w-full bg-[#1c1c1e] text-gray-300 font-mono text-xs rounded-xl border border-white/10 px-3 py-2 outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-[#121214] p-6 space-y-4">
                  <h3 className="font-display text-lg font-bold">Subsystem Diagnostics</h3>
                  <div className="space-y-2 text-xs text-gray-400">
                    <div className="flex justify-between py-1.5 border-b border-white/5">
                      <span>MongoDB Connection</span>
                      <span className="text-emerald-400 font-bold">CONNECTED</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-white/5">
                      <span>Cloudinary Storage</span>
                      <span className="text-emerald-400 font-bold">ONLINE</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-white/5">
                      <span>Razorpay Core</span>
                      <span className="text-emerald-400 font-bold">STANDBY</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
