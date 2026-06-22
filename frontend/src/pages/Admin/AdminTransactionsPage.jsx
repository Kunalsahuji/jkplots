import { useEffect, useState } from "react";
import { CreditCard, Search, Loader2, CheckCircle2, XCircle, Clock } from "lucide-react";
import api from "@/utils/api";
import { toast } from "sonner";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

export default function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {}
  });

  const fetchTransactions = async () => {
    try {
      const { data } = await api.get("/transactions/admin");
      if (data.success) {
        setTransactions(data.data);
      }
    } catch (err) {
      toast.error("Failed to load transactions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleUpdateStatus = (id, newStatus, currentStatus) => {
    if (currentStatus === "Success") {
      toast.error("Cannot modify a successful transaction.");
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: `Mark as ${newStatus}?`,
      message: newStatus === "Success" 
        ? "This will permanently mark this payment as successful and instantly unlock the subscription or promotion benefits for the user. Are you sure?"
        : "Are you sure you want to reject this payment transaction?",
      onConfirm: async () => {
        try {
          const { data } = await api.put(`/transactions/admin/${id}`, { status: newStatus });
          if (data.success) {
            toast.success(`Transaction marked as ${newStatus}`);
            fetchTransactions();
          }
        } catch (err) {
          toast.error(err.response?.data?.error || "Failed to update status");
        }
      }
    });
  };

  const filteredTransactions = transactions.filter((t) => {
    const dealerName = t.dealer?.name || "";
    const dealerPhone = t.dealer?.phone || "";
    const planName = t.subscriptionPlan?.name || t.promotionPlan?.name || "";
    const razorpayId = t.razorpayOrderId || "";

    const matchesSearch = 
      dealerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dealerPhone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      planName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      razorpayId.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || t.status.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8 text-slate-800 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-emerald-600 shrink-0" />
            Billing & Transactions
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Audit all subscription and promotion payments. Approve offline payments manually.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by dealer, phone, plan, or Order ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 hover:bg-slate-100/50 focus:bg-white border-none focus:ring-2 focus:ring-slate-950 rounded-xl transition-all outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-sm bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl px-4 py-2 font-semibold outline-none"
        >
          <option value="all">All Statuses</option>
          <option value="success">Success</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center h-48 space-y-3 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          <p className="text-sm text-slate-500 font-medium">Loading transactions...</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/75 border-b border-slate-100 text-xs uppercase font-bold text-slate-500 tracking-wider">
                <tr>
                  <th className="px-6 py-4">Dealer</th>
                  <th className="px-6 py-4">Item (Plan)</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Method / Ref</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-slate-400 text-sm">
                      No matching transactions found.
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((t) => (
                    <tr key={t._id} className="hover:bg-slate-50/40 transition">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900">{t.dealer?.name || "Unknown"}</span>
                          <span className="text-xs text-slate-500 font-mono">{t.dealer?.phone || "N/A"}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800">
                            {t.itemType}: {t.subscriptionPlan?.name || t.promotionPlan?.name || "Deleted Plan"}
                          </span>
                          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mt-0.5">
                            {new Date(t.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-slate-900">₹{t.amount}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className={`text-xs font-bold ${t.paymentMethod === 'Razorpay' ? 'text-indigo-600' : 'text-emerald-600'}`}>
                            {t.paymentMethod}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono truncate max-w-[150px]">
                            {t.paymentMethod === 'Razorpay' ? t.razorpayOrderId : t.offlineReference || "N/A"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                          t.status === 'Success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                          t.status === 'Pending' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                          'bg-red-50 text-red-700 border border-red-100'
                        }`}>
                          {t.status === 'Success' ? <CheckCircle2 className="w-3.5 h-3.5" /> : 
                           t.status === 'Pending' ? <Clock className="w-3.5 h-3.5" /> : 
                           <XCircle className="w-3.5 h-3.5" />}
                          {t.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {t.status === 'Pending' && t.paymentMethod === 'Offline' && (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleUpdateStatus(t._id, "Success", t.status)}
                              className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 px-3 rounded-lg shadow-sm transition"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(t._id, "Rejected", t.status)}
                              className="text-xs bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 font-bold py-1.5 px-3 rounded-lg border border-red-200 transition"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                        {t.status === 'Success' && (
                          <span className="text-xs text-slate-400 font-medium">Completed</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText="Yes, Proceed"
        isDanger={confirmDialog.title.includes("Reject")}
      />
    </div>
  );
}
