import { useEffect, useState } from "react";
import { Search, Loader2, MessageSquare, Phone, User, Calendar, CheckCircle2, Eye, X, Home, Trash2 } from "lucide-react";
import api from "@/utils/api";
import { toast } from "sonner";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

export default function AdminEnquiriesPage() {
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [updatingId, setUpdatingId] = useState(null);

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {}
  });

  // Enquiry Details Drawer state
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);

  const fetchEnquiries = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/enquiries");
      if (data.success) {
        setEnquiries(data.data);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load property callback enquiries");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnquiries();
  }, []);

  const handleDeleteEnquiryClick = (id) => {
    setConfirmDialog({
      isOpen: true,
      title: "Delete Enquiry Listing",
      message: "Are you sure you want to delete this enquiry listing?",
      onConfirm: () => handleDeleteEnquiry(id)
    });
  };

  const handleDeleteEnquiry = async (id) => {
    try {
      const { data } = await api.delete(`/enquiries/${id}`);
      if (data.success) {
        toast.success(data.message || "Enquiry deleted successfully!");
        setEnquiries(prev => prev.filter(e => e._id !== id));
        if (selectedEnquiry?._id === id) {
          setSelectedEnquiry(null);
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete enquiry.");
    }
  };

  const handleUpdateStatus = async (id, status) => {
    setUpdatingId(id);
    try {
      const { data } = await api.put(`/enquiries/${id}`, { status });
      if (data.success) {
        setEnquiries((prev) =>
          prev.map((e) => (e._id === id ? { ...e, status } : e))
        );
        setSelectedEnquiry((prev) => (prev?._id === id ? { ...prev, status } : prev));
        toast.success(`Enquiry status updated to ${status}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to update enquiry status");
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredEnquiries = enquiries.filter((e) => {
    const buyerMatch = e.buyerName?.toLowerCase().includes(searchQuery.toLowerCase());
    const phoneMatch = e.buyerPhone?.includes(searchQuery);
    const propertyMatch = e.property?.title?.toLowerCase().includes(searchQuery.toLowerCase());
    const textMatch = buyerMatch || phoneMatch || propertyMatch;

    const filterStatus = statusFilter === "all" || e.status === statusFilter;

    return textMatch && filterStatus;
  });

  return (
    <div className="space-y-8 relative">
      {/* Title */}
      <div>
        <h1 className="font-display text-3xl font-bold text-slate-900 tracking-tight">
          Callback Enquiries
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Monitor property callback leads and communication logs between prospective buyers and dealers.
        </p>
      </div>

      {/* Filters & Actions Panel */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
        <div className="relative w-full md:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by buyer, phone, property..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 hover:bg-slate-100/50 focus:bg-white border-none focus:ring-2 focus:ring-slate-950 rounded-xl transition-all outline-none"
          />
        </div>

        <div className="flex gap-2 w-full md:w-auto overflow-x-auto">
          {["all", "Pending", "Contacted", "Closed"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border ${
                statusFilter === status
                  ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                  : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
              }`}
            >
              {status === "all" ? "All Status" : status}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center h-48 space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          <p className="text-sm text-slate-500 font-medium">Fetching enquiries...</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/75 border-b border-slate-100 text-xs uppercase font-bold text-slate-500 tracking-wider">
                <tr>
                  <th className="px-6 py-4">Prospective Buyer</th>
                  <th className="px-6 py-4">Property Reference</th>
                  <th className="px-6 py-4">Dealer Contact</th>
                  <th className="px-6 py-4">Message</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredEnquiries.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-slate-400 text-sm">
                      No matching callback enquiries found.
                    </td>
                  </tr>
                ) : (
                  filteredEnquiries.map((e) => (
                    <tr key={e._id || e.id} className="hover:bg-slate-50/40 transition">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-900 flex items-center gap-1">
                            <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            {e.buyerName}
                          </span>
                          <span className="text-xs text-slate-400 mt-0.5 font-mono">
                            {e.buyerPhone}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {e.property ? (
                          <div className="flex flex-col max-w-xs">
                            <span className="font-semibold text-slate-900 truncate">
                              {e.property.title}
                            </span>
                            <span className="text-xs text-slate-400 truncate">
                              {e.property.locality}, {e.property.city}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-xs">Property Removed</span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-500">
                        {e.dealerPhone || "N/A"}
                      </td>
                      <td className="px-6 py-4 text-slate-500 text-xs max-w-xs truncate" title={e.message}>
                        {e.message || "I'm interested in this property."}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold border ${
                          e.status === "Closed"
                            ? "bg-slate-50 text-slate-400 border-slate-200"
                            : e.status === "Contacted"
                            ? "bg-blue-50 text-blue-700 border-blue-100"
                            : "bg-amber-50 text-amber-700 border-amber-100"
                        }`}>
                          {e.status || "Pending"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedEnquiry(e)}
                            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-2.5 text-xs font-semibold transition-all shadow-sm"
                          >
                            <Eye className="h-3.5 w-3.5" /> Details
                          </button>
                          <select
                            value={e.status || "Pending"}
                            disabled={updatingId === e._id}
                            onChange={(evt) => handleUpdateStatus(e._id, evt.target.value)}
                            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-600 outline-none"
                          >
                            <option value="Pending">Pending</option>
                            <option value="Contacted">Contacted</option>
                            <option value="Closed">Closed</option>
                          </select>
                          <button
                            onClick={() => handleDeleteEnquiryClick(e._id)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition-all"
                            title="Delete Enquiry Log"
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
        </div>
      )}

      {/* Slide-over Enquiry Drawer (Right Drawer) */}
      {selectedEnquiry && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity" onClick={() => setSelectedEnquiry(null)} />
          <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
            <div className="pointer-events-auto w-screen max-w-md transform bg-white shadow-2xl transition-all flex flex-col h-full border-l border-slate-100">
              
              {/* Drawer Header */}
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-950 font-display">Callback Enquiry Detail</h2>
                <button
                  onClick={() => setSelectedEnquiry(null)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-50 hover:text-slate-700 transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Drawer Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {/* Status Selection Card */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150 flex items-center justify-between gap-4">
                  <div className="text-xs">
                    <span className="font-bold text-slate-800 block">Enquiry Status</span>
                    <span className="text-slate-400 mt-0.5 block">Toggle tracking lifecycle status</span>
                  </div>
                  <div>
                    <select
                      value={selectedEnquiry.status || "Pending"}
                      disabled={updatingId === selectedEnquiry._id}
                      onChange={(evt) => handleUpdateStatus(selectedEnquiry._id, evt.target.value)}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 outline-none shadow-sm focus:ring-2 focus:ring-slate-950 transition"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Contacted">Contacted</option>
                      <option value="Closed">Closed</option>
                    </select>
                  </div>
                </div>

                {/* Buyer Details */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Prospective Buyer Details</h4>
                  <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 space-y-2">
                    <div className="text-xs">
                      <span className="text-slate-400 block mb-0.5">Full Name</span>
                      <span className="font-bold text-slate-800 text-sm">{selectedEnquiry.buyerName}</span>
                    </div>
                    <div className="text-xs">
                      <span className="text-slate-400 block mb-0.5">Phone Number</span>
                      <span className="font-mono font-bold text-slate-800 text-sm">{selectedEnquiry.buyerPhone}</span>
                    </div>
                  </div>
                </div>

                {/* Property Connection */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Property Reference Details</h4>
                  {selectedEnquiry.property ? (
                    <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 space-y-2">
                      <div className="text-xs">
                        <span className="text-slate-400 block mb-0.5">Property Title</span>
                        <span className="font-bold text-slate-800 text-sm leading-tight block">{selectedEnquiry.property.title}</span>
                      </div>
                      <div className="text-xs">
                        <span className="text-slate-400 block mb-0.5">Location</span>
                        <span className="font-medium text-slate-600 block">{selectedEnquiry.property.locality}, {selectedEnquiry.property.city}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 bg-slate-50 p-4 rounded-xl text-center italic">
                      Referenced property has been removed.
                    </p>
                  )}
                </div>

                {/* Dealer Contact info */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Assigned Dealer</h4>
                  <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 text-xs">
                    <span className="text-slate-400 block mb-0.5">Dealer Contact Phone</span>
                    <span className="font-mono font-bold text-slate-800 text-sm">{selectedEnquiry.dealerPhone || "N/A"}</span>
                  </div>
                </div>

                {/* Message Content */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Callback Message Sent</h4>
                  <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 text-xs text-slate-700 leading-relaxed font-serif italic">
                    "{selectedEnquiry.message || "I am interested in this listing. Please call me back with more details."}"
                  </div>
                </div>

                {/* Danger Zone */}
                <div className="space-y-3 pt-4 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-red-500 uppercase tracking-wider">Danger Zone</h4>
                  <button
                    onClick={() => handleDeleteEnquiryClick(selectedEnquiry._id)}
                    className="w-full px-4 py-2 border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 font-bold text-xs uppercase rounded-xl transition flex items-center justify-center gap-1.5"
                  >
                    <Trash2 className="h-4 w-4" /> Delete Enquiry Log
                  </button>
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
