import { useEffect, useState } from "react";
import { Search, Loader2, CheckCircle2, XCircle, AlertTriangle, ShieldCheck } from "lucide-react";
import api from "@/utils/api";
import { toast } from "sonner";

export default function AdminDealersPage() {
  const [dealers, setDealers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [processingId, setProcessingId] = useState(null);

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
    <div className="space-y-8">
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
                              onClick={() => handleUpdateKYC(id, "rejected")}
                              disabled={processingId === id || d.kycStatus === "rejected"}
                              className={`inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-bold transition-all border ${
                                d.kycStatus === "rejected"
                                  ? "bg-red-100/50 text-red-800 border-transparent cursor-not-allowed"
                                  : "bg-white text-red-600 border-red-200 hover:bg-red-50"
                              }`}
                            >
                              <XCircle className="h-3.5 w-3.5" />
                              Reject
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
