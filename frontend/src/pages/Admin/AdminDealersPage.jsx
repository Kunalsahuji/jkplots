import { useEffect, useState } from "react";
import { Search, Loader2, CheckCircle2, XCircle, AlertTriangle, ShieldCheck, Eye, X, Home, Mail, Phone, Trash2 } from "lucide-react";
import api from "@/utils/api";
import { toast } from "sonner";

export default function AdminDealersPage() {
  const [dealers, setDealers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [processingId, setProcessingId] = useState(null);

  // Detail Drawer state
  const [selectedDealer, setSelectedDealer] = useState(null);
  const [dealerProperties, setDealerProperties] = useState([]);
  const [dealerEnquiries, setDealerEnquiries] = useState([]);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const fetchDealers = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/users");
      if (data.success) {
        const onlyDealers = data.data.filter((u) => u.role === "dealer");
        setDealers(onlyDealers);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load dealers directory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDealers();
  }, []);

  const handleDeleteDealer = async (dealerId) => {
    if (!window.confirm("Are you sure you want to delete this dealer? All listed properties and callback enquiries will be permanently deleted.")) return;
    try {
      const { data } = await api.delete(`/users/${dealerId}`);
      if (data.success) {
        toast.success(data.message || "Dealer deleted successfully!");
        setDealers(prev => prev.filter(d => d._id !== dealerId));
        if (selectedDealer?._id === dealerId) {
          setSelectedDealer(null);
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete dealer.");
    }
  };

  const handleOpenDetails = async (d) => {
    setSelectedDealer(d);
    setDetailsLoading(true);
    setDealerProperties([]);
    setDealerEnquiries([]);

    try {
      // 1. Fetch properties
      const { data: propData } = await api.get("/properties");
      if (propData.success) {
        const matchingProps = propData.data.filter(
          (p) => p.dealer === d._id || p.contactNumber === d.phone || p.dealerPhone === d.phone
        );
        setDealerProperties(matchingProps);
      }

      // 2. Fetch enquiries
      const { data: enqData } = await api.get("/enquiries");
      if (enqData.success) {
        const matchingEnquiries = enqData.data.filter(
          (e) => e.buyerPhone === d.phone || e.dealerPhone === d.phone
        );
        setDealerEnquiries(matchingEnquiries);
      }
    } catch (err) {
      console.error("Failed to sync dealer details:", err);
      toast.error("Failed to fetch connected portfolio details.");
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleUpdateKYC = async (id, status) => {
    const confirmMsg = `Are you sure you want to set this dealer's KYC status to ${status.toUpperCase()}?`;
    if (!window.confirm(confirmMsg)) return;

    setProcessingId(id);
    try {
      const { data } = await api.put(`/users/${id}`, { kycStatus: status });
      if (data.success) {
        setDealers((prev) =>
          prev.map((d) => (d.id === id || d._id === id ? { ...d, kycStatus: status } : d))
        );
        setSelectedDealer((prev) => (prev?._id === id ? { ...prev, kycStatus: status } : prev));
        toast.success(`Dealer KYC status updated to ${status}!`);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to update KYC status");
    } finally {
      setProcessingId(null);
    }
  };

  const filteredDealers = dealers.filter((d) => {
    const nameMatch = d.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const phoneMatch = d.phone?.includes(searchQuery);
    const panMatch = d.panNumber?.toLowerCase().includes(searchQuery.toLowerCase());
    const statusMatch =
      statusFilter === "all" ||
      (statusFilter === "none" && !d.kycStatus) ||
      d.kycStatus === statusFilter;

    return (nameMatch || phoneMatch || panMatch) && statusMatch;
  });

  return (
    <div className="space-y-8 relative">
      {/* Title */}
      <div>
        <h1 className="font-display text-3xl font-bold text-slate-900 tracking-tight">
          Dealer Management &amp; KYC
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Review, approve, or reject identity documents (PAN) submitted by local real estate dealers.
        </p>
      </div>

      {/* Filters & Actions Panel */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
        <div className="relative w-full md:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, phone, PAN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 hover:bg-slate-100/50 focus:bg-white border-none focus:ring-2 focus:ring-slate-950 rounded-xl transition-all outline-none"
          />
        </div>

        <div className="flex gap-2 w-full md:w-auto overflow-x-auto">
          {["all", "pending", "approved", "rejected", "none"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border ${
                statusFilter === status
                  ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                  : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
              }`}
            >
              {status === "all" ? "All Status" : status === "none" ? "Not Started" : status}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center h-48 space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          <p className="text-sm text-slate-500 font-medium">Fetching verification records...</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/75 border-b border-slate-100 text-xs uppercase font-bold text-slate-500 tracking-wider">
                <tr>
                  <th className="px-6 py-4">Dealer</th>
                  <th className="px-6 py-4">PAN Name</th>
                  <th className="px-6 py-4">PAN Number</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">KYC Operations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredDealers.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-slate-400 text-sm">
                      No matching dealer verification logs found.
                    </td>
                  </tr>
                ) : (
                  filteredDealers.map((d) => {
                    const id = d.id || d._id;
                    return (
                      <tr key={id} className="hover:bg-slate-50/40 transition">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-sm shrink-0">
                              {d.name?.[0]?.toUpperCase() || "D"}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-semibold text-slate-900">{d.name}</span>
                              <span className="text-xs text-slate-400 font-mono">+91 {d.phone}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-800">
                          {d.panName || <span className="text-slate-400 italic font-normal text-xs">Unspecified</span>}
                        </td>
                        <td className="px-6 py-4 font-mono font-semibold text-slate-900">
                          {d.panNumber || <span className="text-slate-400 italic font-normal text-xs">Unspecified</span>}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border ${
                            d.kycStatus === "approved"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                              : d.kycStatus === "rejected"
                              ? "bg-red-50 text-red-700 border-red-100"
                              : d.kycStatus === "pending"
                              ? "bg-amber-50 text-amber-700 border-amber-100"
                              : "bg-slate-50 text-slate-400 border-slate-100"
                          }`}>
                            {d.kycStatus === "approved" && <CheckCircle2 className="h-3 w-3" />}
                            {d.kycStatus === "rejected" && <XCircle className="h-3 w-3" />}
                            {d.kycStatus === "pending" && <AlertTriangle className="h-3 w-3 animate-pulse" />}
                            {d.kycStatus || "none"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenDetails(d)}
                              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-3 text-xs font-semibold transition-all shadow-sm"
                            >
                              <Eye className="h-3.5 w-3.5" /> Details
                            </button>
                            <button
                              onClick={() => handleUpdateKYC(id, "approved")}
                              disabled={processingId === id || d.kycStatus === "approved"}
                              className={`inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-bold transition-all border ${
                                d.kycStatus === "approved"
                                  ? "bg-emerald-100/50 text-emerald-800 border-transparent cursor-not-allowed"
                                  : "bg-white text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                              }`}
                            >
                              <ShieldCheck className="h-3.5 w-3.5" />
                              Approve
                            </button>
                            <button
                              onClick={() => handleDeleteDealer(id)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition-all"
                              title="Delete Dealer"
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

      {/* Slide-over Dealer Drawer (Right Drawer) */}
      {selectedDealer && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity" onClick={() => setSelectedDealer(null)} />
          <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
            <div className="pointer-events-auto w-screen max-w-xl transform bg-white shadow-2xl transition-all flex flex-col h-full border-l border-slate-100">
              
              {/* Drawer Header */}
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-950 font-display">Dealer Verification Detail</h2>
                <button
                  onClick={() => setSelectedDealer(null)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-50 hover:text-slate-700 transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Drawer Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {/* Profile Info Card */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-slate-200 text-slate-700 font-bold text-2xl flex items-center justify-center">
                    {selectedDealer.name?.[0]?.toUpperCase() || "D"}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg leading-tight">{selectedDealer.name || "Unnamed"}</h3>
                    <p className="text-sm font-mono text-slate-500 mt-1 flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5" /> +91 {selectedDealer.phone}
                    </p>
                  </div>
                </div>

                {/* PAN Vetting Details */}
                <div className="space-y-4 border border-slate-150 p-4 rounded-2xl bg-white">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">KYC Document Vetting</h4>
                  
                  <div className="grid grid-cols-2 gap-4 py-2 border-b border-slate-50 text-xs">
                    <div>
                      <span className="text-slate-500 block font-medium">PAN Card Holder Name</span>
                      <span className="font-bold text-slate-900 text-sm mt-1 block">
                        {selectedDealer.panName || "N/A"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block font-medium">PAN Number</span>
                      <span className="font-mono font-bold text-slate-900 text-sm mt-1 block">
                        {selectedDealer.panNumber || "N/A"}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4 items-center justify-between pt-2">
                    <div>
                      <span className="text-xs text-slate-500 font-medium">Verification Action</span>
                      <div className="flex items-center gap-2 mt-1.5">
                        <button
                          onClick={() => handleUpdateKYC(selectedDealer._id, "approved")}
                          disabled={processingId === selectedDealer._id || selectedDealer.kycStatus === "approved"}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase border transition ${
                            selectedDealer.kycStatus === "approved"
                              ? "bg-emerald-50 text-emerald-700 border-transparent cursor-not-allowed"
                              : "bg-white text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                          }`}
                        >
                          Approve KYC
                        </button>
                        <button
                          onClick={() => handleUpdateKYC(selectedDealer._id, "rejected")}
                          disabled={processingId === selectedDealer._id || selectedDealer.kycStatus === "rejected"}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase border transition ${
                            selectedDealer.kycStatus === "rejected"
                              ? "bg-red-50 text-red-700 border-transparent cursor-not-allowed"
                              : "bg-white text-red-600 border-red-200 hover:bg-red-50"
                          }`}
                        >
                          Reject KYC
                        </button>
                      </div>
                    </div>

                    <div>
                      <span className="text-xs text-slate-500 font-medium">Danger Zone</span>
                      <div className="mt-1.5">
                        <button
                          onClick={() => handleDeleteDealer(selectedDealer._id)}
                          className="w-full px-4 py-1.5 rounded-lg text-xs font-bold uppercase border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 transition-all flex items-center justify-center gap-1.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete Account
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Connections Data (Properties & Enquiries) */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-display">Inventory &amp; Received Leads</h4>

                  {detailsLoading ? (
                    <div className="flex flex-col items-center justify-center py-12 space-y-2 text-slate-400">
                      <Loader2 className="w-6 h-6 animate-spin" />
                      <span className="text-xs">Fetching portfolio and leads...</span>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      
                      {/* Properties */}
                      <div className="space-y-3">
                        <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                          <Home className="h-4 w-4 text-slate-400" />
                          Listed Properties ({dealerProperties.length})
                        </span>

                        {dealerProperties.length === 0 ? (
                          <p className="text-xs text-slate-400 bg-slate-50 p-4 rounded-xl text-center">
                            No property listings found for this dealer.
                          </p>
                        ) : (
                          <div className="grid gap-2 max-h-48 overflow-y-auto pr-1">
                            {dealerProperties.map((p) => (
                              <div key={p._id || p.id} className="p-3 bg-slate-50/50 rounded-xl border border-slate-100 flex justify-between items-center text-xs">
                                <div className="flex flex-col min-w-0">
                                  <span className="font-semibold text-slate-800 truncate">{p.title}</span>
                                  <span className="text-[10px] text-slate-400 mt-0.5">{p.locality}, {p.city}</span>
                                </div>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                                  p.verified ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"
                                }`}>
                                  {p.verified ? "Verified" : "Pending"}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Enquiries */}
                      <div className="space-y-3">
                        <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                          <Mail className="h-4 w-4 text-slate-400" />
                          Received Customer Leads ({dealerEnquiries.length})
                        </span>

                        {dealerEnquiries.length === 0 ? (
                          <p className="text-xs text-slate-400 bg-slate-50 p-4 rounded-xl text-center">
                            No callback logs found for this dealer.
                          </p>
                        ) : (
                          <div className="grid gap-2 max-h-48 overflow-y-auto pr-1">
                            {dealerEnquiries.map((e) => (
                              <div key={e._id} className="p-3 bg-slate-50/50 rounded-xl border border-slate-100 text-xs space-y-1">
                                <div className="flex justify-between items-center font-semibold text-slate-800">
                                  <span>From: {e.buyerName}</span>
                                  <span className={`text-[10px] rounded px-1.5 py-0.5 font-bold ${
                                    e.status === "Closed" ? "bg-slate-100 text-slate-400" : "bg-amber-50 text-amber-700"
                                  }`}>
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
                  )}
                </div>

              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
