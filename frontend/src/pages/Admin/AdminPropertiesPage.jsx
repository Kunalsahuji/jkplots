import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Home, Search, Loader2, CheckCircle2, Star, Pencil, Trash2, SlidersHorizontal } from "lucide-react";
import api from "@/utils/api";
import { toast } from "sonner";

const formatPrice = (val) => {
  if (!val) return "₹—";
  if (typeof val === "string") return val;
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(1)} L`;
  return `₹${val.toLocaleString()}`;
};

export default function AdminPropertiesPage() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [cityFilter, setCityFilter] = useState("all");
  const [verificationFilter, setVerificationFilter] = useState("all");
  const [featuredFilter, setFeaturedFilter] = useState("all");
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/properties");
      if (data.success) {
        setProperties(data.data);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load property inventory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  const handleDeleteProperty = async (id) => {
    if (!window.confirm("Are you sure you want to delete this property listing?")) return;
    setActionLoadingId(id);
    try {
      const { data } = await api.delete(`/properties/${id}`);
      if (data.success) {
        setProperties((prev) => prev.filter((p) => p._id !== id));
        toast.success("Listing deleted successfully!");
      }
    } catch (err) {
      toast.error("Failed to delete property.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const toggleVerifyProperty = async (prop) => {
    setActionLoadingId(prop._id);
    try {
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
    } finally {
      setActionLoadingId(null);
    }
  };

  const toggleFeaturedProperty = async (prop) => {
    setActionLoadingId(prop._id);
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
    } finally {
      setActionLoadingId(null);
    }
  };

  const uniqueCities = ["all", ...new Set(properties.map((p) => p.city).filter(Boolean))];

  const filteredProperties = properties.filter((p) => {
    const query = searchQuery.toLowerCase();
    const titleMatch = p.title?.toLowerCase().includes(query);
    const localityMatch = p.locality?.toLowerCase().includes(query);
    const cityMatch = p.city?.toLowerCase().includes(query);
    const textMatch = titleMatch || localityMatch || cityMatch;

    const filterCity = cityFilter === "all" || p.city === cityFilter;
    const filterVerify =
      verificationFilter === "all" ||
      (verificationFilter === "verified" && p.verified) ||
      (verificationFilter === "unverified" && !p.verified);
    const filterFeatured =
      featuredFilter === "all" ||
      (featuredFilter === "featured" && p.featured) ||
      (featuredFilter === "regular" && !p.featured);

    return textMatch && filterCity && filterVerify && filterFeatured;
  });

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-slate-900 tracking-tight">
            Property Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Moderate, approve, feature, and edit real estate listings across Jammu &amp; Kashmir.
          </p>
        </div>
        <Link
          to="/post-property"
          className="inline-flex items-center gap-2 rounded-xl bg-slate-900 hover:bg-black text-white px-5 py-2.5 text-sm font-semibold shadow-md transition-all"
        >
          <Home className="h-4 w-4" /> Add Listing
        </Link>
      </div>

      {/* Filters and Controls */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by title, city, locality..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 hover:bg-slate-100/50 focus:bg-white border-none focus:ring-2 focus:ring-slate-950 rounded-xl transition-all outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <SlidersHorizontal className="h-4 w-4 text-slate-400 mr-1 hidden sm:inline" />
            
            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 outline-none"
            >
              {uniqueCities.map((city) => (
                <option key={city} value={city}>
                  {city === "all" ? "All Cities" : city}
                </option>
              ))}
            </select>

            <select
              value={verificationFilter}
              onChange={(e) => setVerificationFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 outline-none"
            >
              <option value="all">All Verification</option>
              <option value="verified">Verified Only</option>
              <option value="unverified">Unverified Only</option>
            </select>

            <select
              value={featuredFilter}
              onChange={(e) => setFeaturedFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 outline-none"
            >
              <option value="all">All Ads</option>
              <option value="featured">Featured Only</option>
              <option value="regular">Regular Listings</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Grid/Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center h-48 space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          <p className="text-sm text-slate-500 font-medium animate-pulse">Syncing inventories...</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/75 border-b border-slate-100 text-xs uppercase font-bold text-slate-500 tracking-wider">
                <tr>
                  <th className="px-6 py-4">Property details</th>
                  <th className="px-6 py-4">City / Locality</th>
                  <th className="px-6 py-4">Asking Price</th>
                  <th className="px-6 py-4">Dealer Contact</th>
                  <th className="px-6 py-4 text-right">Moderation Operations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredProperties.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-slate-400 text-sm">
                      No property listings match current search parameters.
                    </td>
                  </tr>
                ) : (
                  filteredProperties.map((p) => {
                    const id = p._id || p.id;
                    return (
                      <tr key={id} className="hover:bg-slate-50/40 transition">
                        <td className="px-6 py-4 font-semibold text-slate-900">
                          <div className="flex flex-col">
                            <span>{p.title}</span>
                            <span className="text-xs text-slate-400 font-normal mt-0.5">
                              {p.type} · For {p.purpose}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-500 font-medium">
                          {p.locality}, {p.city}
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-900">
                          {formatPrice(p.price)}
                        </td>
                        <td className="px-6 py-4 text-slate-500 font-mono text-xs">
                          {p.contactNumber || p.dealerPhone || "N/A"}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => toggleVerifyProperty(p)}
                              disabled={actionLoadingId === id}
                              className={`inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-bold transition-all border ${
                                p.verified
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                              }`}
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              {p.verified ? "Verified" : "Verify"}
                            </button>
                            <button
                              onClick={() => toggleFeaturedProperty(p)}
                              disabled={actionLoadingId === id}
                              className={`inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-bold transition-all border ${
                                p.featured
                                  ? "bg-amber-50 text-amber-700 border-amber-200"
                                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                              }`}
                            >
                              <Star className="h-3.5 w-3.5" />
                              {p.featured ? "Featured" : "Feature"}
                            </button>
                            <Link
                              to={`/edit-property/${id}`}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-all"
                              title="Edit Listing"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Link>
                            <button
                              onClick={() => handleDeleteProperty(id)}
                              disabled={actionLoadingId === id}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-100 bg-red-50/50 text-red-600 hover:bg-red-50 hover:text-red-700 transition-all"
                              title="Delete Listing"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
