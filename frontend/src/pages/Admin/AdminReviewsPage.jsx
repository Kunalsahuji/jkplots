import { useEffect, useState } from "react";
import { Search, Loader2, Star, Trash2, Check, X, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, ArrowUpDown, MessageSquare } from "lucide-react";
import api from "@/utils/api";
import { toast } from "sonner";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all"); // 'all', 'property', 'platform'

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

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/reviews/admin");
      if (data.success) {
        setReviews(data.data);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load reviews list");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, ratingFilter, typeFilter]);

  const handleToggleApproval = async (review) => {
    try {
      const { data } = await api.put(`/reviews/admin/${review._id}/approve`);
      if (data.success) {
        toast.success(`Review visibility set to ${!review.isApproved ? "Approved" : "Hidden"}`);
        setReviews(prev => prev.map(r => r._id === review._id ? { ...r, isApproved: !review.isApproved } : r));
      }
    } catch (err) {
      toast.error("Failed to update review status");
    }
  };

  const handleDeleteClick = (id) => {
    setConfirmDialog({
      isOpen: true,
      title: "Remove Feedback",
      message: "Are you sure you want to permanently delete this user feedback/review from the system?",
      onConfirm: () => handleDelete(id)
    });
  };

  const handleDelete = async (id) => {
    try {
      const { data } = await api.delete(`/reviews/admin/${id}`);
      if (data.success) {
        toast.success("Review deleted successfully!");
        setReviews(prev => prev.filter(r => r._id !== id));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete review.");
    }
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const sortedReviews = [...reviews].sort((a, b) => {
    let valA = a[sortField];
    let valB = b[sortField];

    if (sortField === "user") {
      valA = a.user?.name || "";
      valB = b.user?.name || "";
    } else if (sortField === "property") {
      valA = a.property?.title || "";
      valB = b.property?.title || "";
    }

    if (valA === undefined || valA === null) valA = "";
    if (valB === undefined || valB === null) valB = "";

    if (typeof valA === "string") valA = valA.toLowerCase();
    if (typeof valB === "string") valB = valB.toLowerCase();

    if (valA < valB) return sortDirection === "asc" ? -1 : 1;
    if (valA > valB) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  const filteredReviews = sortedReviews.filter((r) => {
    const userMatch = r.user?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const commentMatch = r.comment?.toLowerCase().includes(searchQuery.toLowerCase());
    const propertyMatch = r.property?.title?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSearch = userMatch || commentMatch || propertyMatch;

    const matchesRating =
      ratingFilter === "all" ||
      r.rating === parseInt(ratingFilter, 10);

    const matchesType =
      typeFilter === "all" ||
      (typeFilter === "property" && r.property) ||
      (typeFilter === "platform" && !r.property);

    return matchesSearch && matchesRating && matchesType;
  });

  const totalPages = Math.ceil(filteredReviews.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredReviews.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <div className="space-y-8 relative text-slate-800">
      {/* Title */}
      <div>
        <h1 className="font-display text-3xl font-bold text-slate-900 tracking-tight">
          Feedback & Reviews Moderation
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Monitor user ratings, reviews on listings, and general platform feedback.
        </p>
      </div>

      {/* Filters and search */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="relative w-full md:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search reviews or users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 hover:bg-slate-100/50 focus:bg-white border-none focus:ring-2 focus:ring-slate-950 rounded-xl transition-all outline-none"
          />
        </div>

        <div className="flex flex-wrap gap-3 w-full md:w-auto items-center">
          {/* Rating filter dropdown */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-400 uppercase">Rating:</span>
            <select
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
              className="text-xs bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl px-2.5 py-1.5 font-bold outline-none"
            >
              <option value="all">All Stars</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>
          </div>

          {/* Context filter dropdown */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-400 uppercase">Context:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="text-xs bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl px-2.5 py-1.5 font-bold outline-none"
            >
              <option value="all">All Types</option>
              <option value="property">Listing Reviews</option>
              <option value="platform">Platform Feedback</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center h-48 space-y-3 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          <p className="text-sm text-slate-500 font-medium">Fetching feedback feed...</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/75 border-b border-slate-100 text-xs uppercase font-bold text-slate-500 tracking-wider">
                <tr>
                  <th 
                    className="px-6 py-4 cursor-pointer hover:bg-slate-100/80 transition group select-none"
                    onClick={() => handleSort("user")}
                  >
                    <div className="flex items-center gap-1.5">
                      User Details
                      {sortField === "user" ? (
                        sortDirection === "asc" ? <ChevronUp className="h-3.5 w-3.5 text-slate-900" /> : <ChevronDown className="h-3.5 w-3.5 text-slate-900" />
                      ) : (
                        <ArrowUpDown className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-600 transition" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-4 cursor-pointer hover:bg-slate-100/80 transition group select-none"
                    onClick={() => handleSort("property")}
                  >
                    <div className="flex items-center gap-1.5">
                      Context / Property
                      {sortField === "property" ? (
                        sortDirection === "asc" ? <ChevronUp className="h-3.5 w-3.5 text-slate-900" /> : <ChevronDown className="h-3.5 w-3.5 text-slate-900" />
                      ) : (
                        <ArrowUpDown className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-600 transition" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-4 cursor-pointer hover:bg-slate-100/80 transition group select-none w-32"
                    onClick={() => handleSort("rating")}
                  >
                    <div className="flex items-center gap-1.5">
                      Rating
                      {sortField === "rating" ? (
                        sortDirection === "asc" ? <ChevronUp className="h-3.5 w-3.5 text-slate-900" /> : <ChevronDown className="h-3.5 w-3.5 text-slate-900" />
                      ) : (
                        <ArrowUpDown className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-600 transition" />
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-4 select-none">Review Comment</th>
                  <th 
                    className="px-6 py-4 cursor-pointer hover:bg-slate-100/80 transition group select-none"
                    onClick={() => handleSort("isApproved")}
                  >
                    <div className="flex items-center gap-1.5">
                      Status
                      {sortField === "isApproved" ? (
                        sortDirection === "asc" ? <ChevronUp className="h-3.5 w-3.5 text-slate-900" /> : <ChevronDown className="h-3.5 w-3.5 text-slate-900" />
                      ) : (
                        <ArrowUpDown className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-600 transition" />
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-4 text-right select-none">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {currentItems.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-slate-400 text-sm">
                      No matching reviews or feedback logged.
                    </td>
                  </tr>
                ) : (
                  currentItems.map((r) => (
                    <tr key={r._id} className="hover:bg-slate-50/40 transition">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-900">{r.user?.name || "Anonymous User"}</span>
                          <span className="text-xs text-slate-400 font-mono">{r.user?.phone || r.user?.email || "N/A"}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {r.property ? (
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-800 text-xs line-clamp-1">{r.property.title}</span>
                            <span className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider">Listing Review</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-slate-400 text-xs">
                            <MessageSquare className="h-3.5 w-3.5" />
                            <span>General Feedback</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-0.5 text-amber-500">
                          {Array.from({ length: r.rating }).map((_, idx) => (
                            <Star key={idx} className="h-3.5 w-3.5 fill-amber-500" />
                          ))}
                          {Array.from({ length: 5 - r.rating }).map((_, idx) => (
                            <Star key={idx} className="h-3.5 w-3.5 text-slate-200" />
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600 max-w-xs md:max-w-md break-words">
                        {r.comment}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleToggleApproval(r)}
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold transition border cursor-pointer ${
                            r.isApproved
                              ? "bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100/75"
                              : "bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-100/75"
                          }`}
                        >
                          {r.isApproved ? "Approved" : "Hidden"}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDeleteClick(r._id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Delete Feedback"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))
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
                  {Math.min(indexOfLastItem, filteredReviews.length)}
                </span>{" "}
                of <span className="font-semibold text-slate-900">{filteredReviews.length}</span> entries
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
