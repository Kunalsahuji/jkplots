import React, { useState, useEffect, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Phone, MessageCircle, Star, BadgeCheck, Home, Calendar, ArrowLeft, Loader2, Search, Inbox, AlertCircle } from "lucide-react";
import api from "../../utils/api";
import { PropertyCard } from "@/components/site/PropertyCard";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export default function DealerProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [dealer, setDealer] = useState(null);
  const [loading, setLoading] = useState(true);

  // Catalog Filters & Pagination
  const [catalogSearch, setCatalogSearch] = useState("");
  const [catalogPurpose, setCatalogPurpose] = useState("All");
  const [catalogFeatured, setCatalogFeatured] = useState("All"); // "All", "Featured Only"
  const [catalogSort, setCatalogSort] = useState("Newest");
  const [catalogPage, setCatalogPage] = useState(1);
  const catalogPerPage = 4;

  useEffect(() => {
    const fetchDealerProfile = async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/users/dealers/${id}`);
        if (data.success) {
          setDealer(data.data);
        }
      } catch (err) {
        console.error("Failed to load dealer profile:", err);
        toast.error("Could not load dealer profile");
      } finally {
        setLoading(false);
      }
    };
    fetchDealerProfile();
  }, [id]);

  const requireAuth = (action) => {
    if (!isAuthenticated) {
      toast.error(`Please sign in first to ${action}`);
      navigate(`/auth?redirect=/dealers/${id}`);
      return false;
    }
    return true;
  };

  const handleWhatsApp = async () => {
    if (!requireAuth("contact the agent via WhatsApp")) return;
    if (!dealer) return;
    const cleanPhone = dealer.phone.replace(/\D/g, "");
    const text = encodeURIComponent(`Hi ${dealer.name}, I saw your profile on JKPlot and I am interested in your listings.`);
    window.open(`https://wa.me/${cleanPhone}?text=${text}`, "_blank");
    
    try {
      if (dealer.properties?.[0]) {
        await api.put(`/properties/${dealer.properties[0]._id}/whatsapp-click`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCall = () => {
    if (!requireAuth("call the agent")) return;
    if (!dealer) return;
    window.open(`tel:${dealer.phone}`, "_self");
  };

  // Filter & Sort logic for properties list
  const filteredCatalog = useMemo(() => {
    if (!dealer?.properties) return [];
    let result = dealer.properties.filter(p => {
      // Search Title/City
      const matchSearch = p.title?.toLowerCase().includes(catalogSearch.toLowerCase()) || 
                          p.city?.toLowerCase().includes(catalogSearch.toLowerCase());
      
      // Purpose Filter
      const matchPurpose = catalogPurpose === "All" ? true : p.purpose === catalogPurpose;

      // Featured Filter
      const isFeaturedActive = p.isFeatured && (!p.featuredUntil || new Date(p.featuredUntil) > Date.now());
      const matchFeatured = catalogFeatured === "Featured Only" ? isFeaturedActive : true;

      return matchSearch && matchPurpose && matchFeatured;
    });

    if (catalogSort === "Newest") result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    if (catalogSort === "Oldest") result.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    if (catalogSort === "Price Low to High") result.sort((a, b) => a.price - b.price);
    if (catalogSort === "Price High to Low") result.sort((a, b) => b.price - a.price);

    return result;
  }, [dealer?.properties, catalogSearch, catalogPurpose, catalogFeatured, catalogSort]);

  const paginatedCatalog = useMemo(() => {
    const start = (catalogPage - 1) * catalogPerPage;
    return filteredCatalog.slice(start, start + catalogPerPage);
  }, [filteredCatalog, catalogPage]);

  const totalCatalogPages = Math.ceil(filteredCatalog.length / catalogPerPage);

  useEffect(() => {
    setCatalogPage(1);
  }, [catalogSearch, catalogPurpose, catalogFeatured, catalogSort]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (!dealer) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4">
        <h1 className="text-3xl font-bold text-slate-800 mb-4">Dealer Profile Not Found</h1>
        <p className="text-slate-500 mb-8 text-center max-w-md">The agent or dealer you are searching for does not exist or has been removed.</p>
        <Link to="/dealers" className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors">
          Back to Agents Directory
        </Link>
      </div>
    );
  }

  const initials = dealer.name ? dealer.name.charAt(0).toUpperCase() : "D";
  const isApproved = dealer.kycStatus === "approved";

  return (
    <div className="min-h-screen bg-slate-50/50 pb-24">
      {/* Upper Cover Header */}
      <div className="w-full h-48 bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-400/20 via-transparent to-transparent"></div>
        <div className="absolute top-6 left-6 z-20">
          <Link to="/dealers" className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl text-sm font-semibold transition backdrop-blur-md">
            <ArrowLeft className="h-4 w-4" /> Back to Directory
          </Link>
        </div>
      </div>

      <div className="container-px mx-auto max-w-7xl -mt-24 relative z-10 px-4">
        <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
          {/* Left Column: Sticky Profile Card wrapper */}
          <aside className="w-full">
            <div className="lg:sticky lg:top-[90px] space-y-4">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100/80 flex flex-col items-center text-center space-y-6"
              >
                {/* Avatar / Initials */}
                <div className="relative">
                  <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-400 text-white font-display text-4xl font-extrabold flex items-center justify-center border-4 border-white shadow-md">
                    {initials}
                  </div>
                  {isApproved && (
                    <div className="absolute bottom-1 right-1 bg-white rounded-full p-1 shadow-sm" title="Verified Professional Dealer">
                      <BadgeCheck className="h-6 w-6 text-indigo-600 fill-indigo-50" />
                    </div>
                  )}
                </div>

                {/* Name & Title */}
                <div>
                  <h1 className="text-xl font-bold text-slate-800 flex items-center justify-center gap-1.5">
                    {dealer.name}
                  </h1>
                  <div className="flex items-center justify-center gap-1 mt-1 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    <span>{isApproved ? "Verified Dealer" : "Registered Partner"}</span>
                  </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-2 w-full gap-4 py-4 border-y border-slate-100">
                  <div className="text-center">
                    <div className="text-lg font-bold text-slate-800 flex items-center justify-center gap-1">
                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                      {dealer.ratingScore}
                    </div>
                    <div className="text-[11px] text-slate-400 font-semibold uppercase">Rating Score</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-slate-800 flex items-center justify-center gap-1">
                      <Home className="h-4 w-4 text-indigo-500" />
                      {dealer.totalProperties}
                    </div>
                    <div className="text-[11px] text-slate-400 font-semibold uppercase">Listings</div>
                  </div>
                </div>

                {/* Bio */}
                <div className="text-left w-full">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">About Agent</h3>
                  <p className="text-sm text-slate-600 leading-relaxed font-medium">
                    {dealer.bio}
                  </p>
                </div>

                {/* Rating calculation Info */}
                <div className="bg-slate-50 rounded-xl p-3 text-left text-[11px] text-slate-500 space-y-1 flex gap-2 items-start border border-slate-100">
                  <AlertCircle className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-700">Rating calculation:</span> Average score of reviews submitted by verified buyers on listings owned by this agent.
                  </div>
                </div>

                {/* Contact Actions */}
                <div className="w-full space-y-3 pt-2">
                  <button 
                    onClick={handleWhatsApp}
                    className="w-full py-3 bg-emerald-50 text-emerald-700 font-bold rounded-2xl hover:bg-emerald-100 transition-colors flex items-center justify-center gap-2 text-sm shadow-sm"
                  >
                    <MessageCircle className="h-4 w-4" />
                    WhatsApp Agent
                  </button>
                  <button 
                    onClick={handleCall}
                    className="w-full py-3 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 text-sm shadow-sm"
                  >
                    <Phone className="h-4 w-4" />
                    Call Agent
                  </button>
                </div>
              </motion.div>
            </div>
          </aside>

          {/* Right Column: Catalog Grid */}
          <div className="space-y-6">
            {/* Filter Section */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100/80 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Properties Catalogue</h2>
                  <p className="text-xs text-slate-400 font-semibold mt-0.5 uppercase tracking-wide">
                    Browse active properties listed by {dealer.name}
                  </p>
                </div>
              </div>
              
              <div className="grid gap-3 grid-cols-1 sm:grid-cols-4">
                <div className="relative sm:col-span-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Search properties..." 
                    value={catalogSearch}
                    onChange={(e) => setCatalogSearch(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2 text-xs outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
                <select
                  value={catalogPurpose}
                  onChange={(e) => setCatalogPurpose(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-indigo-500"
                >
                  <option value="All">All Purposes</option>
                  <option value="Buy">Buy</option>
                  <option value="Rent">Rent</option>
                  <option value="Commercial">Commercial</option>
                </select>
                <select
                  value={catalogSort}
                  onChange={(e) => setCatalogSort(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-indigo-500"
                >
                  <option value="Newest">Newest</option>
                  <option value="Oldest">Oldest</option>
                  <option value="Price Low to High">Price: Low to High</option>
                  <option value="Price High to Low">Price: High to Low</option>
                </select>
              </div>

              {/* Featured Properties filter toggle */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-50">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Filter Features:</span>
                <button
                  onClick={() => setCatalogFeatured(prev => prev === "All" ? "Featured Only" : "All")}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition border ${
                    catalogFeatured === "Featured Only"
                      ? "bg-amber-55 bg-amber-50 border-amber-200 text-amber-700"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  Featured Ads Only
                </button>
              </div>
            </div>

            {paginatedCatalog.length > 0 ? (
              <>
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2"
                >
                  {paginatedCatalog.map(property => (
                    <PropertyCard key={property._id} p={property} />
                  ))}
                </motion.div>

                {/* Pagination */}
                {totalCatalogPages > 1 && (
                  <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-6">
                    <p className="text-xs text-slate-400 font-semibold uppercase">
                      Showing {((catalogPage - 1) * catalogPerPage) + 1} to {Math.min(catalogPage * catalogPerPage, filteredCatalog.length)} of {filteredCatalog.length}
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setCatalogPage(p => Math.max(1, p - 1))}
                        disabled={catalogPage === 1}
                        className="h-9 px-4 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition"
                      >
                        Prev
                      </button>
                      <button
                        onClick={() => setCatalogPage(p => Math.min(totalCatalogPages, p + 1))}
                        disabled={catalogPage === totalCatalogPages}
                        className="h-9 px-4 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-slate-200">
                <Inbox className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-slate-700">No properties found</h3>
                <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">Try adjusting your filters or search terms.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
