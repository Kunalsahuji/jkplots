import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Star, BadgeCheck, Home, Search, Loader2, Users, AlertCircle } from "lucide-react";
import api from "../../utils/api";
import { toast } from "sonner";

export default function DealersPage() {
  const [dealers, setDealers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters, sorting, and pagination states
  const [searchQuery, setSearchQuery] = useState("");
  const [filterVerified, setFilterVerified] = useState("All"); // "All", "Verified Only", "Registered Partners"
  const [filterListings, setFilterListings] = useState("All"); // "All", "Has Listings (>0)"
  const [filterFeatured, setFilterFeatured] = useState("All"); // "All", "Has Featured Properties"
  const [sortBy, setSortBy] = useState("Name (A-Z)"); // "Name (A-Z)", "Name (Z-A)", "Most Listings", "Highest Rating"
  const [page, setPage] = useState(1);
  const dealersPerPage = 6;

  useEffect(() => {
    const fetchDealers = async () => {
      try {
        setLoading(true);
        const { data } = await api.get("/users/dealers");
        if (data.success) {
          setDealers(data.data);
        }
      } catch (err) {
        console.error("Failed to load dealers directory:", err);
        toast.error("Could not load dealers directory");
      } finally {
        setLoading(false);
      }
    };
    fetchDealers();
  }, []);

  // Filtering & Sorting computations
  const processedDealers = useMemo(() => {
    let result = dealers.filter(d => {
      // 1. Search Query
      const matchSearch = d.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          d.bio?.toLowerCase().includes(searchQuery.toLowerCase());
      
      // 2. Verification status
      const isApproved = d.kycStatus === "approved";
      let matchVerified = true;
      if (filterVerified === "Verified Only") matchVerified = isApproved;
      else if (filterVerified === "Registered Partners") matchVerified = !isApproved;

      // 3. Listings filter
      let matchListings = true;
      if (filterListings === "Has Listings (>0)") matchListings = (d.totalProperties || 0) > 0;

      // 4. Featured filter
      let matchFeatured = true;
      if (filterFeatured === "Has Featured Properties") matchFeatured = d.hasFeatured === true;

      return matchSearch && matchVerified && matchListings && matchFeatured;
    });

    // Sort computations
    if (sortBy === "Name (A-Z)") {
      result.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    } else if (sortBy === "Name (Z-A)") {
      result.sort((a, b) => (b.name || "").localeCompare(a.name || ""));
    } else if (sortBy === "Most Listings") {
      result.sort((a, b) => (b.totalProperties || 0) - (a.totalProperties || 0));
    } else if (sortBy === "Highest Rating") {
      result.sort((a, b) => parseFloat(b.ratingScore || 0) - parseFloat(a.ratingScore || 0));
    }

    return result;
  }, [dealers, searchQuery, filterVerified, filterListings, filterFeatured, sortBy]);

  // Paginated Dealers
  const paginatedDealers = useMemo(() => {
    const start = (page - 1) * dealersPerPage;
    return processedDealers.slice(start, start + dealersPerPage);
  }, [processedDealers, page]);

  const totalPages = Math.ceil(processedDealers.length / dealersPerPage);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [searchQuery, filterVerified, filterListings, filterFeatured, sortBy]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-24 pt-12">
      <div className="container-px mx-auto max-w-7xl px-4">
        {/* Header Section */}
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-4">
          <h1 className="font-display text-4xl font-extrabold text-slate-800 tracking-tight">
            Verified Property Agents & Dealers
          </h1>
          <p className="text-sm text-slate-500 font-medium leading-relaxed">
            Find and connect with trusted real estate experts in Jammu & Kashmir. Verify credentials, check ratings, and browse catalogs directly.
          </p>
        </div>

        {/* Rating calculation info banner */}
        <div className="max-w-7xl mx-auto mb-6 bg-indigo-50/40 border border-indigo-100/60 rounded-2xl p-4 flex gap-3 items-start text-xs text-indigo-800">
          <AlertCircle className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">How Ratings are Calculated:</span> Agent Ratings are computed as the average score of all reviews left by verified users on properties listed by the respective agent. If a newly registered partner does not have reviews yet, they default to a standard 5.0 rating score.
          </div>
        </div>

        {/* Filters Toolbar */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100/80 mb-10 space-y-4">
          <div className="grid gap-4 grid-cols-1 md:grid-cols-4">
            {/* Search Input */}
            <div className="relative md:col-span-2">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search agents by name or key terms..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 py-2 text-xs outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            {/* Verification Status */}
            <div>
              <select
                value={filterVerified}
                onChange={(e) => setFilterVerified(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-indigo-500"
              >
                <option value="All">All Verification Statuses</option>
                <option value="Verified Only">Verified Only</option>
                <option value="Registered Partners">Registered Partners</option>
              </select>
            </div>

            {/* Sorting Select */}
            <div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-indigo-500"
              >
                <option value="Name (A-Z)">Sort: Name (A-Z)</option>
                <option value="Name (Z-A)">Sort: Name (Z-A)</option>
                <option value="Most Listings">Sort: Most Listings</option>
                <option value="Highest Rating">Sort: Highest Rating</option>
              </select>
            </div>
          </div>

          {/* Secondary Filters row */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-50">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Filter Listings:</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setFilterListings(prev => prev === "All" ? "Has Listings (>0)" : "All")}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition border ${
                    filterListings === "Has Listings (>0)"
                      ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  Has Active Listings
                </button>
                <button
                  onClick={() => setFilterFeatured(prev => prev === "All" ? "Has Featured Properties" : "All")}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition border ${
                    filterFeatured === "Has Featured Properties"
                      ? "bg-amber-55 bg-amber-50 border-amber-200 text-amber-700"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  Has Featured Properties
                </button>
              </div>
            </div>

            {processedDealers.length > 0 && (
              <span className="text-xs text-slate-400 font-semibold uppercase">
                Found {processedDealers.length} {processedDealers.length === 1 ? 'agent' : 'agents'}
              </span>
            )}
          </div>
        </div>

        {/* Dealer Grid */}
        {paginatedDealers.length > 0 ? (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {paginatedDealers.map((dealer, idx) => {
                const initials = dealer.name ? dealer.name.charAt(0).toUpperCase() : "D";
                const isApproved = dealer.kycStatus === "approved";

                return (
                  <motion.div
                    key={dealer.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md hover:border-slate-200 transition duration-300"
                  >
                    <div className="space-y-4">
                      {/* Header Row: Initials & Verification */}
                      <div className="flex items-start justify-between">
                        <div className="relative">
                          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-400 text-white font-display text-2xl font-extrabold flex items-center justify-center border border-slate-100 shadow-sm">
                            {initials}
                          </div>
                          {isApproved && (
                            <div className="absolute bottom-0 right-0 bg-white rounded-full p-0.5 shadow-sm">
                              <BadgeCheck className="h-4 w-4 text-indigo-600 fill-indigo-50" />
                            </div>
                          )}
                        </div>
                        
                        {/* Rating Score */}
                        <div className="flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-xl text-amber-700 font-bold text-xs">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          {dealer.ratingScore}
                        </div>
                      </div>

                      {/* Name & Title */}
                      <div>
                        <h3 className="font-bold text-slate-800 text-base flex items-center gap-1 hover:text-indigo-600 transition-colors">
                          {dealer.name}
                        </h3>
                        <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mt-0.5">
                          {isApproved ? "Verified Dealer" : "Registered Partner"}
                        </p>
                      </div>

                      {/* Truncated Bio */}
                      <p className="text-sm text-slate-500 leading-relaxed line-clamp-3 font-medium min-h-[60px]">
                        {dealer.bio}
                      </p>
                    </div>

                    {/* Listings Count & Profile Link */}
                    <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold uppercase">
                        <Home className="h-4 w-4 text-indigo-500" />
                        <span>{dealer.totalProperties} Listings</span>
                      </div>

                      <Link
                        to={`/dealers/${dealer.id}`}
                        className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl transition duration-300"
                      >
                        View Profile
                      </Link>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-12 flex items-center justify-between border-t border-slate-100 pt-6">
                <p className="text-xs text-slate-400 font-semibold uppercase">
                  Showing {((page - 1) * dealersPerPage) + 1} to {Math.min(page * dealersPerPage, processedDealers.length)} of {processedDealers.length}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="h-9 px-4 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition"
                  >
                    Prev
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="h-9 px-4 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="bg-white rounded-3xl p-16 text-center border border-dashed border-slate-200 max-w-md mx-auto mt-8">
            <Users className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-700">No agents found</h3>
            <p className="text-sm text-slate-400 mt-1">Try adjusting your search criteria or name queries.</p>
          </div>
        )}
      </div>
    </div>
  );
}
