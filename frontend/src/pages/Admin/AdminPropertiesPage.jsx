import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Home, Search, Loader2, CheckCircle2, Star, Pencil, Trash2, SlidersHorizontal, Eye, X, Mail, Phone, Video, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, ArrowUpDown } from "lucide-react";
import api from "@/utils/api";
import { toast } from "sonner";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

const formatPrice = (val) => {
  if (!val) return "₹—";
  if (typeof val === "string") return val;
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(1)} L`;
  return `₹${val.toLocaleString()}`;
};

const getEmbedVideoUrl = (url) => {
  if (!url) return null;
  // YouTube match
  const ytMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
  if (ytMatch && ytMatch[1]) {
    return `https://www.youtube.com/embed/${ytMatch[1]}`;
  }
  // Vimeo match
  const vimeoMatch = url.match(/(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/i);
  if (vimeoMatch && vimeoMatch[1]) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  }
  return null;
};

export default function AdminPropertiesPage() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [cityFilter, setCityFilter] = useState("all");
  const [verificationFilter, setVerificationFilter] = useState("all");
  const [featuredFilter, setFeaturedFilter] = useState("all");
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Pagination & Sorting states
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState("createdAt");
  const [sortDirection, setSortDirection] = useState("desc");
  const itemsPerPage = 10;

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {}
  });

  // Property Details Drawer state
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [propertyEnquiries, setPropertyEnquiries] = useState([]);
  const [detailsLoading, setDetailsLoading] = useState(false);

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

  const handleOpenDetails = async (prop) => {
    setSelectedProperty(prop);
    setActivePhotoIndex(0);
    setDetailsLoading(true);
    setPropertyEnquiries([]);

    try {
      const { data } = await api.get("/enquiries");
      if (data.success) {
        // Match either by property ID or exact title
        const matchingEnquiries = data.data.filter(
          (e) => e.property === prop._id || e.propertyTitle === prop.title
        );
        setPropertyEnquiries(matchingEnquiries);
      }
    } catch (err) {
      console.error("Failed to sync property enquiries:", err);
      toast.error("Failed to sync leads for this property.");
    } finally {
      setDetailsLoading(false);
    }
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
    setActionLoadingId(id);
    try {
      const { data } = await api.delete(`/properties/${id}`);
      if (data.success) {
        setProperties((prev) => prev.filter((p) => p._id !== id));
        if (selectedProperty?._id === id) {
          setSelectedProperty(null);
        }
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
      const { data } = await api.put(`/properties/${prop._id}/verify`);
      if (data.success) {
        setProperties(prev => prev.map(p => p._id === prop._id ? { ...p, verified: updatedVerified } : p));
        setSelectedProperty(prev => (prev?._id === prop._id ? { ...prev, verified: updatedVerified } : prev));
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
      const { data } = await api.put(`/properties/${prop._id}/feature`);
      if (data.success) {
        setProperties(prev => prev.map(p => p._id === prop._id ? { ...p, featured: updatedFeatured } : p));
        setSelectedProperty(prev => (prev?._id === prop._id ? { ...prev, featured: updatedFeatured } : prev));
        toast.success(`Property set as ${updatedFeatured ? "Featured" : "Regular"}!`);
      }
    } catch (err) {
      toast.error("Failed to toggle featured state.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const uniqueCities = ["all", ...new Set(properties.map((p) => p.city).filter(Boolean))];

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, cityFilter, verificationFilter, featuredFilter]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const sortedProperties = [...properties].sort((a, b) => {
    let valA = a[sortField];
    let valB = b[sortField];

    if (valA === undefined || valA === null) valA = "";
    if (valB === undefined || valB === null) valB = "";

    if (typeof valA === "string") valA = valA.toLowerCase();
    if (typeof valB === "string") valB = valB.toLowerCase();

    if (valA < valB) return sortDirection === "asc" ? -1 : 1;
    if (valA > valB) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  const filteredProperties = sortedProperties.filter((p) => {
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

  const totalPages = Math.ceil(filteredProperties.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredProperties.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <div className="space-y-8 relative">
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
          to="/admin/properties/create"
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
                  <th 
                    className="px-6 py-4 cursor-pointer hover:bg-slate-100/80 transition group select-none"
                    onClick={() => handleSort("title")}
                  >
                    <div className="flex items-center gap-1.5">
                      Property details
                      {sortField === "title" ? (
                        sortDirection === "asc" ? <ChevronUp className="h-3.5 w-3.5 text-slate-900" /> : <ChevronDown className="h-3.5 w-3.5 text-slate-900" />
                      ) : (
                        <ArrowUpDown className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-600 transition" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-4 cursor-pointer hover:bg-slate-100/80 transition group select-none"
                    onClick={() => handleSort("city")}
                  >
                    <div className="flex items-center gap-1.5">
                      City / Locality
                      {sortField === "city" ? (
                        sortDirection === "asc" ? <ChevronUp className="h-3.5 w-3.5 text-slate-900" /> : <ChevronDown className="h-3.5 w-3.5 text-slate-900" />
                      ) : (
                        <ArrowUpDown className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-600 transition" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-4 cursor-pointer hover:bg-slate-100/80 transition group select-none"
                    onClick={() => handleSort("price")}
                  >
                    <div className="flex items-center gap-1.5">
                      Asking Price
                      {sortField === "price" ? (
                        sortDirection === "asc" ? <ChevronUp className="h-3.5 w-3.5 text-slate-900" /> : <ChevronDown className="h-3.5 w-3.5 text-slate-900" />
                      ) : (
                        <ArrowUpDown className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-600 transition" />
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-4 select-none">Dealer Contact</th>
                  <th className="px-6 py-4 text-right select-none">Moderation Operations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {currentItems.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-slate-400 text-sm">
                      No property listings match current search parameters.
                    </td>
                  </tr>
                ) : (
                  currentItems.map((p) => {
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
                              onClick={() => handleOpenDetails(p)}
                              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-3 text-xs font-semibold transition-all shadow-sm"
                            >
                              <Eye className="h-3.5 w-3.5" /> Details
                            </button>
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
                              to={`/admin/properties/edit/${id}`}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-all"
                              title="Edit Listing"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Link>
                            <button
                              onClick={() => handleDeletePropertyClick(id)}
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

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
              <span className="text-xs text-slate-500">
                Showing <span className="font-semibold text-slate-900">{indexOfFirstItem + 1}</span> to{" "}
                <span className="font-semibold text-slate-900">
                  {Math.min(indexOfLastItem, filteredProperties.length)}
                </span>{" "}
                of <span className="font-semibold text-slate-900">{filteredProperties.length}</span> entries
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="inline-flex h-8 px-3 items-center gap-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
                >
                  <ChevronLeft className="h-3.5 w-3.5" /> Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`inline-flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold transition-all shadow-xs ${
                      currentPage === page
                        ? "bg-slate-900 text-white"
                        : "border border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="inline-flex h-8 px-3 items-center gap-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
                >
                  Next <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Slide-over Property Drawer (Right Drawer) */}
      {selectedProperty && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity" onClick={() => setSelectedProperty(null)} />
          <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
            <div className="pointer-events-auto w-screen max-w-xl transform bg-white shadow-2xl transition-all flex flex-col h-full border-l border-slate-100">
              
              {/* Drawer Header */}
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-950 font-display">Property Specifications</h2>
                <button
                  onClick={() => setSelectedProperty(null)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-50 hover:text-slate-700 transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Drawer Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {/* Images Carousel / Preview */}
                {selectedProperty.photos && selectedProperty.photos.length > 0 ? (
                  <div className="space-y-2">
                    <div className="relative rounded-2xl overflow-hidden aspect-video bg-slate-100 border border-slate-100 group">
                      <img
                        src={selectedProperty.photos[activePhotoIndex]}
                        alt={`${selectedProperty.title} - Image ${activePhotoIndex + 1}`}
                        className="w-full h-full object-cover transition-all duration-300"
                      />
                      
                      {selectedProperty.photos.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActivePhotoIndex(prev => (prev === 0 ? selectedProperty.photos.length - 1 : prev - 1));
                          }}
                          className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-900/60 hover:bg-slate-900/80 text-white flex items-center justify-center transition opacity-0 group-hover:opacity-100 font-bold text-sm"
                        >
                          &larr;
                        </button>
                      )}
                      
                      {selectedProperty.photos.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActivePhotoIndex(prev => (prev === selectedProperty.photos.length - 1 ? 0 : prev + 1));
                          }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-900/60 hover:bg-slate-900/80 text-white flex items-center justify-center transition opacity-0 group-hover:opacity-100 font-bold text-sm"
                        >
                          &rarr;
                        </button>
                      )}

                      <div className="absolute bottom-3 right-3 bg-slate-900/75 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-1 rounded-lg">
                        {activePhotoIndex + 1} / {selectedProperty.photos.length} Photos
                      </div>
                    </div>

                    {selectedProperty.photos.length > 1 && (
                      <div className="flex gap-2 overflow-x-auto pb-1 max-w-full">
                        {selectedProperty.photos.map((photo, index) => (
                          <button
                            type="button"
                            key={index}
                            onClick={() => setActivePhotoIndex(index)}
                            className={`w-16 h-12 rounded-lg overflow-hidden border-2 shrink-0 transition ${
                              index === activePhotoIndex ? "border-slate-900 scale-95" : "border-transparent opacity-60 hover:opacity-100"
                            }`}
                          >
                            <img src={photo} className="w-full h-full object-cover" alt="" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="rounded-2xl aspect-video bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 text-xs font-semibold">
                    No Images Loaded
                  </div>
                )}

                {/* Brief & Price */}
                <div>
                  <h3 className="text-xl font-bold text-slate-900 leading-tight">{selectedProperty.title}</h3>
                  <div className="mt-2 flex flex-wrap gap-2 items-center justify-between">
                    <span className="text-2xl font-black text-slate-950">{formatPrice(selectedProperty.price)}</span>
                    <span className="text-xs px-2.5 py-1 bg-slate-100 text-slate-700 font-bold uppercase rounded-lg">
                      {selectedProperty.type} · For {selectedProperty.purpose}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-2 font-mono">{selectedProperty.locality}, {selectedProperty.city}</p>
                </div>

                {/* Quick Moderation Toggles */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150 flex items-center justify-between gap-4">
                  <div className="text-xs">
                    <span className="font-bold text-slate-800 block">Status Actions</span>
                    <span className="text-slate-400 mt-0.5 block">Toggle verification &amp; homepage highlights</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleVerifyProperty(selectedProperty)}
                      className={`h-8 px-3 rounded-lg text-xs font-bold border transition ${
                        selectedProperty.verified
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {selectedProperty.verified ? "Verified" : "Verify"}
                    </button>
                    <button
                      onClick={() => toggleFeaturedProperty(selectedProperty)}
                      className={`h-8 px-3 rounded-lg text-xs font-bold border transition ${
                        selectedProperty.featured
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {selectedProperty.featured ? "Featured" : "Feature"}
                    </button>
                  </div>
                </div>

                {/* Detailed Specifications */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Specifications Grid</h4>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100 text-xs">
                      <span className="text-slate-400 block mb-0.5">Area Size</span>
                      <span className="font-bold text-slate-800">{selectedProperty.area} sq.ft</span>
                    </div>
                    <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100 text-xs">
                      <span className="text-slate-400 block mb-0.5">Bedrooms</span>
                      <span className="font-bold text-slate-800">{selectedProperty.bedrooms || 0} BHK</span>
                    </div>
                    <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100 text-xs">
                      <span className="text-slate-400 block mb-0.5">Bathrooms</span>
                      <span className="font-bold text-slate-800">{selectedProperty.bathrooms || 0} Bath</span>
                    </div>
                    <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100 text-xs">
                      <span className="text-slate-400 block mb-0.5">Parking</span>
                      <span className="font-bold text-slate-800">{selectedProperty.parking || "None"}</span>
                    </div>
                    <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100 text-xs">
                      <span className="text-slate-400 block mb-0.5">Furnishing</span>
                      <span className="font-bold text-slate-800">{selectedProperty.furnishing || "Unfurnished"}</span>
                    </div>
                    <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100 text-xs">
                      <span className="text-slate-400 block mb-0.5">Balconies</span>
                      <span className="font-bold text-slate-800">{selectedProperty.balconies || 0} Balc.</span>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Listing Description</h4>
                  <p className="text-xs text-slate-600 leading-relaxed bg-slate-50/20 p-3 rounded-xl border border-slate-100">
                    {selectedProperty.description || "No description provided."}
                  </p>
                </div>

                {/* Contact info */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Dealer Contact Information</h4>
                  <div className="flex flex-col gap-1 text-xs">
                    <span className="text-slate-700 font-medium flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-slate-400" /> +91 {selectedProperty.contactNumber || selectedProperty.dealerPhone || "N/A"}
                    </span>
                  </div>
                </div>

                {/* Video Tour */}
                {selectedProperty.video && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Video className="w-3.5 h-3.5 text-slate-400" /> Walkthrough Video
                    </h4>
                    {getEmbedVideoUrl(selectedProperty.video) ? (
                      <div className="relative rounded-2xl overflow-hidden aspect-video border border-slate-100 bg-slate-900">
                        <iframe
                          src={getEmbedVideoUrl(selectedProperty.video)}
                          title="Walkthrough Video"
                          className="w-full h-full border-none"
                          allowFullScreen
                        />
                      </div>
                    ) : (
                      <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-2">
                        <video
                          src={selectedProperty.video}
                          controls
                          className="w-full rounded-xl aspect-video bg-black"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                        <a
                          href={selectedProperty.video}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex w-full items-center justify-center gap-2 text-xs font-semibold text-slate-900 bg-white hover:bg-slate-100 px-4 py-2.5 rounded-xl border border-slate-200 transition"
                        >
                          Watch Walkthrough Video in New Tab
                        </a>
                      </div>
                    )}
                  </div>
                )}

                {/* Leads Table */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Callback Leads for this Property ({propertyEnquiries.length})</h4>
                  {detailsLoading ? (
                    <div className="flex items-center justify-center py-6 text-slate-400 text-xs">
                      <Loader2 className="w-5 h-5 animate-spin mr-2" /> Syncing enquiries...
                    </div>
                  ) : propertyEnquiries.length === 0 ? (
                    <p className="text-xs text-slate-400 bg-slate-50 p-4 rounded-xl text-center">
                      No callback enquiries submitted yet for this listing.
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {propertyEnquiries.map((e) => (
                        <div key={e._id} className="p-3 bg-slate-50/50 rounded-xl border border-slate-100 text-xs space-y-1">
                          <div className="flex justify-between items-center font-semibold text-slate-800">
                            <span>From: {e.buyerName} ({e.buyerPhone})</span>
                            <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">
                              {e.status || "Pending"}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 italic">"{e.message}"</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

            </div>
          </div>
        </div>
      )}

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
