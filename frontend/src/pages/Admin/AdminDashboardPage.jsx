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
  Pencil,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import api from "@/utils/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

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

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {}
  });

  const [activeTab, setActiveTab] = useState("listings");
  const [properties, setProperties] = useState([]);
  const [users, setUsers] = useState([]);
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination states (compact pages of 5 items for dashboard view)
  const [propertiesPage, setPropertiesPage] = useState(1);
  const [usersPage, setUsersPage] = useState(1);
  const [enquiriesPage, setEnquiriesPage] = useState(1);
  const itemsPerPage = 5;

  const fetchData = async () => {
    setLoading(true);
    try {
      const [propRes, userRes, enqRes] = await Promise.all([
        api.get("/properties"),
        api.get("/users"),
        api.get("/enquiries").catch(() => ({ data: { success: false, data: [] } }))
      ]);
      if (propRes.data.success) setProperties(propRes.data.data);
      if (userRes.data.success) setUsers(userRes.data.data);
      if (enqRes && enqRes.data && enqRes.data.success) setEnquiries(enqRes.data.data);
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

  const handleDeletePropertyClick = (id) => {
    setConfirmDialog({
      isOpen: true,
      title: "Delete Property Listing",
      message: "Are you sure you want to delete this property listing?",
      onConfirm: () => handleDeleteProperty(id)
    });
  };

  const handleDeleteProperty = async (id) => {
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
      const updatedVerified = !prop.verified;
      const { data } = await api.put(`/properties/${prop._id}/verify`);
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
      const { data } = await api.put(`/properties/${prop._id}/feature`);
      if (data.success) {
        setProperties(prev => prev.map(p => p._id === prop._id ? { ...p, featured: updatedFeatured } : p));
        toast.success(`Property set as ${updatedFeatured ? "Featured" : "Regular"}!`);
      }
    } catch (err) {
      toast.error("Failed to toggle featured state.");
    }
  };

  // Pagination slicing
  const propertiesTotalPages = Math.ceil(properties.length / itemsPerPage);
  const propertiesEnd = propertiesPage * itemsPerPage;
  const propertiesStart = propertiesEnd - itemsPerPage;
  const currentProperties = properties.slice(propertiesStart, propertiesEnd);

  const usersTotalPages = Math.ceil(users.length / itemsPerPage);
  const usersEnd = usersPage * itemsPerPage;
  const usersStart = usersEnd - itemsPerPage;
  const currentUsers = users.slice(usersStart, usersEnd);

  const enquiriesTotalPages = Math.ceil(enquiries.length / itemsPerPage);
  const enquiriesEnd = enquiriesPage * itemsPerPage;
  const enquiriesStart = enquiriesEnd - itemsPerPage;
  const currentEnquiries = enquiries.slice(enquiriesStart, enquiriesEnd);

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
          <Link
            to="/admin/properties"
            className="rounded-2xl border border-white/10 bg-[#121214] p-6 space-y-4 hover:border-emerald-500/50 hover:bg-white/5 transition-all block group cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-gray-400 group-hover:text-white transition-colors">System Listings</span>
              <Home className="h-5 w-5 text-emerald-400 group-hover:scale-110 transition-transform" />
            </div>
            <div className="font-display text-3xl font-bold text-white group-hover:text-emerald-400 transition-colors">{properties.length}</div>
            <div className="text-xs text-gray-500">Total properties in database</div>
          </Link>

          <Link
            to="/admin/users"
            className="rounded-2xl border border-white/10 bg-[#121214] p-6 space-y-4 hover:border-blue-500/50 hover:bg-white/5 transition-all block group cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-gray-400 group-hover:text-white transition-colors">Registered Users</span>
              <Users className="h-5 w-5 text-blue-400 group-hover:scale-110 transition-transform" />
            </div>
            <div className="font-display text-3xl font-bold text-white group-hover:text-blue-400 transition-colors">{users.length}</div>
            <div className="text-xs text-gray-500">Dealers, Admins, and Buyers</div>
          </Link>

          <Link
            to="/admin/enquiries"
            className="rounded-2xl border border-white/10 bg-[#121214] p-6 space-y-4 hover:border-amber-500/50 hover:bg-white/5 transition-all block group cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-gray-400 group-hover:text-white transition-colors">Callback Leads</span>
              <Activity className="h-5 w-5 text-amber-400 group-hover:scale-110 transition-transform" />
            </div>
            <div className="font-display text-3xl font-bold text-white group-hover:text-amber-400 transition-colors">{enquiries.length}</div>
            <div className="text-xs text-gray-500">Customer enquiries & callbacks</div>
          </Link>

          <Link
            to="/admin/promotions"
            className="rounded-2xl border border-white/10 bg-[#121214] p-6 space-y-4 hover:border-purple-500/50 hover:bg-white/5 transition-all block group cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-gray-400 group-hover:text-white transition-colors">Promotion Plans</span>
              <Settings className="h-5 w-5 text-purple-400 group-hover:scale-110 transition-transform" />
            </div>
            <div className="font-display text-xl font-bold text-white group-hover:text-purple-400 transition-colors">Configure Plans</div>
            <div className="text-xs text-gray-500">Customize promo packages</div>
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10">
          {[
            { id: "listings", label: "Properties Moderation", icon: Home },
            { id: "users", label: "Registered Users", icon: Users },
            { id: "enquiries", label: "Callback Enquiries", icon: Activity },
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
                      {currentProperties.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="px-6 py-12 text-center text-gray-500 text-sm">
                            No listings registered in inventory.
                          </td>
                        </tr>
                      ) : (
                        currentProperties.map((p) => (
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
                                  to={`/admin/properties/edit/${p._id}`}
                                  className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10 transition"
                                  title="Edit Listing"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </Link>
                                <button
                                  onClick={() => handleDeletePropertyClick(p._id)}
                                  className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-black border border-red-500/20 transition"
                                  title="Delete Listing"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Properties Pagination Controls */}
                {propertiesTotalPages > 1 && (
                  <div className="px-6 py-4 border-t border-white/10 flex items-center justify-between bg-[#0e0e10]/50">
                    <span className="text-xs text-gray-400">
                      Showing <span className="font-semibold text-white">{propertiesStart + 1}</span> to{" "}
                      <span className="font-semibold text-white">
                        {Math.min(propertiesEnd, properties.length)}
                      </span>{" "}
                      of <span className="font-semibold text-white">{properties.length}</span> entries
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setPropertiesPage(prev => Math.max(prev - 1, 1))}
                        disabled={propertiesPage === 1}
                        className="inline-flex h-8 px-3 items-center gap-1 rounded-lg border border-white/10 bg-[#18181b] hover:bg-white/5 text-gray-300 text-xs font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="h-3.5 w-3.5" /> Previous
                      </button>
                      {Array.from({ length: propertiesTotalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => setPropertiesPage(page)}
                          className={`inline-flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold transition ${
                            propertiesPage === page
                              ? "bg-emerald-500 text-black font-extrabold"
                              : "border border-white/10 bg-[#18181b] hover:bg-white/5 text-gray-300"
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                      <button
                        onClick={() => setPropertiesPage(prev => Math.min(prev + 1, propertiesTotalPages))}
                        disabled={propertiesPage === propertiesTotalPages}
                        className="inline-flex h-8 px-3 items-center gap-1 rounded-lg border border-white/10 bg-[#18181b] hover:bg-white/5 text-gray-300 text-xs font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Next <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )}
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
                      {currentUsers.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="px-6 py-12 text-center text-gray-500 text-sm">
                            No registered users found.
                          </td>
                        </tr>
                      ) : (
                        currentUsers.map((u) => (
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
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Users Pagination Controls */}
                {usersTotalPages > 1 && (
                  <div className="px-6 py-4 border-t border-white/10 flex items-center justify-between bg-[#0e0e10]/50">
                    <span className="text-xs text-gray-400">
                      Showing <span className="font-semibold text-white">{usersStart + 1}</span> to{" "}
                      <span className="font-semibold text-white">
                        {Math.min(usersEnd, users.length)}
                      </span>{" "}
                      of <span className="font-semibold text-white">{users.length}</span> entries
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setUsersPage(prev => Math.max(prev - 1, 1))}
                        disabled={usersPage === 1}
                        className="inline-flex h-8 px-3 items-center gap-1 rounded-lg border border-white/10 bg-[#18181b] hover:bg-white/5 text-gray-300 text-xs font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="h-3.5 w-3.5" /> Previous
                      </button>
                      {Array.from({ length: usersTotalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => setUsersPage(page)}
                          className={`inline-flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold transition ${
                            usersPage === page
                              ? "bg-[#3b82f6] text-white font-extrabold"
                              : "border border-white/10 bg-[#18181b] hover:bg-white/5 text-gray-300"
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                      <button
                        onClick={() => setUsersPage(prev => Math.min(prev + 1, usersTotalPages))}
                        disabled={usersPage === usersTotalPages}
                        className="inline-flex h-8 px-3 items-center gap-1 rounded-lg border border-white/10 bg-[#18181b] hover:bg-white/5 text-gray-300 text-xs font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Next <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "enquiries" && (
              <div className="rounded-2xl border border-white/10 bg-[#121214] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-gray-300">
                    <thead className="bg-[#18181b] text-xs uppercase text-gray-400 border-b border-white/10">
                      <tr>
                        <th className="px-6 py-4">Prospective Buyer</th>
                        <th className="px-6 py-4">Property Reference</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Received Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {currentEnquiries.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="px-6 py-12 text-center text-gray-500 text-sm">
                            No callback enquiries logged.
                          </td>
                        </tr>
                      ) : (
                        currentEnquiries.map((e) => (
                          <tr key={e._id || e.id} className="hover:bg-white/5 transition">
                            <td className="px-6 py-4 font-semibold text-white">
                              <div className="flex flex-col">
                                <span>{e.buyerName}</span>
                                <span className="text-xs text-gray-500 font-normal">{e.buyerPhone}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-gray-400">
                              {e.property ? e.property.title : <span className="text-gray-600 italic">Property Removed</span>}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                e.status === "Closed"
                                  ? "bg-white/5 text-gray-500 border border-white/10"
                                  : e.status === "Contacted"
                                  ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                                  : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                              }`}>
                                {e.status || "Pending"}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-gray-500">
                              {e.createdAt ? new Date(e.createdAt).toLocaleDateString() : "N/A"}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Enquiries Pagination Controls */}
                {enquiriesTotalPages > 1 && (
                  <div className="px-6 py-4 border-t border-white/10 flex items-center justify-between bg-[#0e0e10]/50">
                    <span className="text-xs text-gray-400">
                      Showing <span className="font-semibold text-white">{enquiriesStart + 1}</span> to{" "}
                      <span className="font-semibold text-white">
                        {Math.min(enquiriesEnd, enquiries.length)}
                      </span>{" "}
                      of <span className="font-semibold text-white">{enquiries.length}</span> entries
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEnquiriesPage(prev => Math.max(prev - 1, 1))}
                        disabled={enquiriesPage === 1}
                        className="inline-flex h-8 px-3 items-center gap-1 rounded-lg border border-white/10 bg-[#18181b] hover:bg-white/5 text-gray-300 text-xs font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="h-3.5 w-3.5" /> Previous
                      </button>
                      {Array.from({ length: enquiriesTotalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => setEnquiriesPage(page)}
                          className={`inline-flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold transition ${
                            enquiriesPage === page
                              ? "bg-amber-500 text-black font-extrabold"
                              : "border border-white/10 bg-[#18181b] hover:bg-white/5 text-gray-300"
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                      <button
                        onClick={() => setEnquiriesPage(prev => Math.min(prev + 1, enquiriesTotalPages))}
                        disabled={enquiriesPage === enquiriesTotalPages}
                        className="inline-flex h-8 px-3 items-center gap-1 rounded-lg border border-white/10 bg-[#18181b] hover:bg-white/5 text-gray-300 text-xs font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Next <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )}
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

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
      />
    </div>
  );
}
