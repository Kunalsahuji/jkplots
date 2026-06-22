import { useEffect, useState } from "react";
import { Search, Loader2, AlertTriangle, Trash2, Eye, CheckCircle2, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, ArrowUpDown, RefreshCcw } from "lucide-react";
import api from "@/utils/api";
import { toast } from "sonner";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

export default function AdminFraudPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [reasonFilter, setReasonFilter] = useState("all");

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

  const [resolutionModal, setResolutionModal] = useState({
    isOpen: false,
    reportId: null,
    currentStatus: "Pending",
    status: "Reviewed",
    adminResponse: ""
  });

  const fetchReports = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/reports/admin");
      if (data.success) {
        setReports(data.data);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load fraud reports log");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, reasonFilter]);

  const handleStatusPillClick = (report) => {
    setResolutionModal({
      isOpen: true,
      reportId: report._id,
      currentStatus: report.status,
      status: report.status === "Pending" ? "Reviewed" : report.status,
      adminResponse: report.adminResponse || ""
    });
  };

  const handleResolutionSubmit = async (e) => {
    e.preventDefault();
    const { reportId, status, adminResponse } = resolutionModal;
    try {
      const { data } = await api.put(`/reports/admin/${reportId}`, {
        status,
        adminResponse: adminResponse.trim()
      });
      if (data.success) {
        toast.success("Resolution updated successfully!");
        setReports(prev => prev.map(r => r._id === reportId ? { ...r, status, adminResponse } : r));
        setResolutionModal(prev => ({ ...prev, isOpen: false }));
      }
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to update resolution details");
    }
  };

  const handleDeleteReportClick = (id) => {
    setConfirmDialog({
      isOpen: true,
      title: "Remove Report Log",
      message: "Are you sure you want to permanently delete this report entry? The property listing itself will NOT be deleted.",
      onConfirm: () => handleDeleteReport(id)
    });
  };

  const handleDeleteReport = async (id) => {
    try {
      const { data } = await api.delete(`/reports/admin/${id}`);
      if (data.success) {
        toast.success("Report log deleted");
        setReports(prev => prev.filter(r => r._id !== id));
      }
    } catch (err) {
      toast.error("Failed to delete report log");
    }
  };

  const handleDeletePropertyClick = (propertyId, reportId) => {
    setConfirmDialog({
      isOpen: true,
      title: "Delete Fraudulent Listing",
      message: "WARNING: This will permanently delete this property listing from the system. This action cannot be undone.",
      onConfirm: () => handleDeleteProperty(propertyId, reportId)
    });
  };

  const handleDeleteProperty = async (propertyId, reportId) => {
    try {
      const { data } = await api.delete(`/properties/${propertyId}`);
      if (data.success) {
        toast.success("Fraudulent listing deleted successfully!");
        // Remove or update reports associated with this deleted property from UI
        setReports(prev => prev.filter(r => r.property?._id !== propertyId));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete fraudulent listing.");
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

  const sortedReports = [...reports].sort((a, b) => {
    let valA = a[sortField];
    let valB = b[sortField];

    if (sortField === "property") {
      valA = a.property?.title || "";
      valB = b.property?.title || "";
    } else if (sortField === "reporter") {
      valA = a.reportedBy?.name || a.reporterPhone || "";
      valB = b.reportedBy?.name || b.reporterPhone || "";
    }

    if (valA === undefined || valA === null) valA = "";
    if (valB === undefined || valB === null) valB = "";

    if (typeof valA === "string") valA = valA.toLowerCase();
    if (typeof valB === "string") valB = valB.toLowerCase();

    if (valA < valB) return sortDirection === "asc" ? -1 : 1;
    if (valA > valB) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  const filteredReports = sortedReports.filter((r) => {
    const propertyTitle = r.property?.title || "";
    const dealerPhone = r.property?.dealerPhone || "";
    const description = r.description || "";
    const reporterName = r.reportedBy?.name || "";
    const reporterPhone = r.reporterPhone || "";

    const matchesSearch = 
      propertyTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dealerPhone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reporterName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reporterPhone.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || r.status === statusFilter;
    const matchesReason = reasonFilter === "all" || r.reason === reasonFilter;

    return matchesSearch && matchesStatus && matchesReason;
  });

  const totalPages = Math.ceil(filteredReports.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredReports.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <div className="space-y-8 text-slate-800 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-red-500 shrink-0" />
            Fraud Detection Logs
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Monitor and resolve user reports concerning fraudulent, spammy, or inaccurate listing details.
          </p>
        </div>
        <button
          onClick={fetchReports}
          className="p-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl transition text-slate-600 shadow-sm"
          title="Refresh List"
        >
          <RefreshCcw size={16} />
        </button>
      </div>

      {/* Filters and search */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="relative w-full md:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search listings, dealers, or reporters..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 hover:bg-slate-100/50 focus:bg-white border-none focus:ring-2 focus:ring-slate-950 rounded-xl transition-all outline-none"
          />
        </div>

        <div className="flex flex-wrap gap-3 w-full md:w-auto items-center">
          {/* Status filter dropdown */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-400 uppercase">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl px-2.5 py-1.5 font-bold outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Reviewed">Reviewed</option>
              <option value="Dismissed">Dismissed</option>
            </select>
          </div>

          {/* Reason filter dropdown */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-400 uppercase">Reason:</span>
            <select
              value={reasonFilter}
              onChange={(e) => setReasonFilter(e.target.value)}
              className="text-xs bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl px-2.5 py-1.5 font-bold outline-none"
            >
              <option value="all">All Reasons</option>
              <option value="Fraud/Scam">Fraud/Scam</option>
              <option value="Incorrect Details">Incorrect Details</option>
              <option value="Duplicate Listing">Duplicate Listing</option>
              <option value="Sold/Unavailable">Sold/Unavailable</option>
              <option value="Spam/Other">Spam/Other</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center h-48 space-y-3 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          <p className="text-sm text-slate-500 font-medium">Fetching complaint list...</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/75 border-b border-slate-100 text-xs uppercase font-bold text-slate-500 tracking-wider">
                <tr>
                  <th 
                    className="px-6 py-4 cursor-pointer hover:bg-slate-100/80 transition group select-none"
                    onClick={() => handleSort("property")}
                  >
                    <div className="flex items-center gap-1.5">
                      Flagged Listing
                      {sortField === "property" ? (
                        sortDirection === "asc" ? <ChevronUp className="h-3.5 w-3.5 text-slate-900" /> : <ChevronDown className="h-3.5 w-3.5 text-slate-900" />
                      ) : (
                        <ArrowUpDown className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-600 transition" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-4 cursor-pointer hover:bg-slate-100/80 transition group select-none w-44"
                    onClick={() => handleSort("reason")}
                  >
                    <div className="flex items-center gap-1.5">
                      Reason
                      {sortField === "reason" ? (
                        sortDirection === "asc" ? <ChevronUp className="h-3.5 w-3.5 text-slate-900" /> : <ChevronDown className="h-3.5 w-3.5 text-slate-900" />
                      ) : (
                        <ArrowUpDown className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-600 transition" />
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-4 select-none max-w-xs">Detailed Description</th>
                  <th 
                    className="px-6 py-4 cursor-pointer hover:bg-slate-100/80 transition group select-none w-44"
                    onClick={() => handleSort("reporter")}
                  >
                    <div className="flex items-center gap-1.5">
                      Reporter Info
                      {sortField === "reporter" ? (
                        sortDirection === "asc" ? <ChevronUp className="h-3.5 w-3.5 text-slate-900" /> : <ChevronDown className="h-3.5 w-3.5 text-slate-900" />
                      ) : (
                        <ArrowUpDown className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-600 transition" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-4 cursor-pointer hover:bg-slate-100/80 transition group select-none w-32"
                    onClick={() => handleSort("status")}
                  >
                    <div className="flex items-center gap-1.5">
                      Status
                      {sortField === "status" ? (
                        sortDirection === "asc" ? <ChevronUp className="h-3.5 w-3.5 text-slate-900" /> : <ChevronDown className="h-3.5 w-3.5 text-slate-900" />
                      ) : (
                        <ArrowUpDown className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-600 transition" />
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-4 text-right select-none w-32">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {currentItems.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-slate-400 text-sm">
                      No matching fraud logs or complaints found.
                    </td>
                  </tr>
                ) : (
                  currentItems.map((r) => (
                    <tr key={r._id} className="hover:bg-slate-50/40 transition">
                      <td className="px-6 py-4">
                        {r.property ? (
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-900 line-clamp-1">{r.property.title}</span>
                            <span className="text-xs text-slate-400">City: {r.property.city || "N/A"}</span>
                            <span className="text-xs text-slate-500 font-medium">Dealer Phone: {r.property.dealerPhone || "N/A"}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-red-500 font-semibold bg-red-50 px-2 py-1 rounded-md">Property Deleted</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          r.reason === 'Fraud/Scam' ? 'bg-red-50 text-red-700 border border-red-100' :
                          r.reason === 'Incorrect Details' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                          r.reason === 'Duplicate Listing' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {r.reason}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600 max-w-xs md:max-w-md break-words">
                        <div>{r.description}</div>
                        {r.adminResponse && (
                          <div className="mt-2 text-xs bg-slate-50 border border-slate-100 p-2 rounded-lg text-slate-500 font-medium">
                            <span className="font-bold text-slate-700 block mb-0.5 text-[10px] uppercase tracking-wider">Admin Response:</span>
                            {r.adminResponse}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-800">{r.reportedBy?.name || "Guest Reporter"}</span>
                          <span className="text-xs text-slate-400 font-mono">{r.reporterPhone || "N/A"}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleStatusPillClick(r)}
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold transition border cursor-pointer ${
                            r.status === 'Pending' ? "bg-red-50 text-red-700 border-red-100 hover:bg-red-100/75" :
                            r.status === 'Reviewed' ? "bg-indigo-50 text-indigo-700 border-indigo-100 hover:bg-indigo-100/75" :
                            "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
                          }`}
                        >
                          {r.status}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {r.property && (
                            <>
                              <a
                                href={`/properties/${r.property._id}`}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                                title="View Live Page"
                              >
                                <Eye size={15} />
                              </a>
                              <button
                                onClick={() => handleDeletePropertyClick(r.property._id, r._id)}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                title="Delete Listing Permanently"
                              >
                                <CheckCircle2 size={15} />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleDeleteReportClick(r._id)}
                            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
                            title="Delete Report Entry"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
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
                  {Math.min(indexOfLastItem, filteredReports.length)}
                </span>{" "}
                of <span className="font-semibold text-slate-900">{filteredReports.length}</span> entries
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

      {/* Resolution & Response Modal */}
      {resolutionModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white rounded-2xl border border-slate-150 p-6 shadow-2xl relative space-y-4 text-slate-800">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-indigo-600 animate-pulse" />
              Resolve Fraud Report
            </h3>
            <p className="text-xs text-slate-500">
              Provide an official response or actions taken. The reporter will be able to view this on their profile dashboard.
            </p>
            <form onSubmit={handleResolutionSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Set Resolution Status</label>
                <select
                  value={resolutionModal.status}
                  onChange={(e) => setResolutionModal(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-slate-950 font-semibold"
                >
                  {resolutionModal.currentStatus === "Pending" ? (
                    <>
                      <option value="Pending" disabled>Pending (Select Reviewed or Dismissed)</option>
                      <option value="Reviewed">Reviewed (Mark as validated issue/resolved)</option>
                      <option value="Dismissed">Dismissed (Mark as invalid/spam complaint)</option>
                    </>
                  ) : (
                    <>
                      <option value="Reviewed">Reviewed (Mark as validated issue/resolved)</option>
                      <option value="Dismissed">Dismissed (Mark as invalid/spam complaint)</option>
                    </>
                  )}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Admin Official Response / Comments</label>
                <textarea
                  placeholder="Explain actions taken (e.g. 'Listing verified, dealer warned' or 'Listing has been permanently removed')"
                  rows={4}
                  value={resolutionModal.adminResponse}
                  onChange={(e) => setResolutionModal(prev => ({ ...prev, adminResponse: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-slate-950 font-medium"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setResolutionModal(prev => ({ ...prev, isOpen: false }))}
                  className="rounded-xl px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-5 py-2 text-sm font-semibold transition shadow-sm"
                >
                  Save Resolution
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
