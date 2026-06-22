import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Check, Loader2, CreditCard, Download } from "lucide-react";
import api from "@/utils/api";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

export default function SubscriptionTab() {
  const { user } = useAuth();
  const [plans, setPlans] = useState([]);
  const [mySub, setMySub] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [usage, setUsage] = useState({ used: 0, limit: 1, remaining: 1 });
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  // Filters & Pagination for Billing History
  const [statusFilter, setStatusFilter] = useState("all");
  const [itemTypeFilter, setItemTypeFilter] = useState("all");
  const [page, setPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [plansRes, mySubRes, txRes] = await Promise.all([
        api.get("/subscription-plans/active"),
        api.get("/subscription-plans/my-subscription"),
        api.get("/transactions/my-transactions")
      ]);
      
      if (plansRes.data.success) {
        setPlans(plansRes.data.data);
      }
      
      if (mySubRes.data.success) {
        setMySub(mySubRes.data.data.activeSubscription);
        setUsage(mySubRes.data.data.usage);
      }

      if (txRes.data.success) {
        setTransactions(txRes.data.data);
      }
    } catch (err) {
      toast.error("Failed to load subscription details");
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (plan, method = 'Razorpay') => {
    try {
      setProcessingId(`${plan._id}-${method}`);
      
      // Use the robust transaction API which tracks offline/online status
      const { data } = await api.post("/transactions", { 
        itemType: 'Subscription',
        subscriptionPlanId: plan._id,
        paymentMethod: method
      });
      
      // Handle free plan assignment if the transaction resolves it immediately
      if (data.razorpayOrder === null && method === 'Offline') {
        toast.success("Offline payment request submitted! Please contact Admin to verify your payment.");
        fetchData();
        return;
      }

      if (data.isFree) {
        toast.success(data.message || "Free plan activated");
        fetchData();
        return;
      }

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_YourKeyHere",
        amount: data.razorpayOrder.amount,
        currency: data.razorpayOrder.currency,
        name: "JKPLOT Premium",
        description: `Subscription: ${plan.name}`,
        order_id: data.razorpayOrder.id,
        handler: async function (response) {
          try {
            const verifyRes = await api.post("/transactions/verify", {
              transactionId: data.data._id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature
            });
            if (verifyRes.data.success) {
              toast.success("Subscription activated successfully!");
              fetchData();
            }
          } catch (err) {
            toast.error(err.response?.data?.message || "Payment verification failed");
          }
        },
        prefill: {
          name: user?.name,
          contact: user?.phone,
        },
        theme: {
          color: "#0f172a",
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function (response) {
        toast.error("Payment failed or was cancelled.");
      });
      rzp.open();
    } catch (err) {
      toast.error(err.response?.data?.message || err.response?.data?.error || "Failed to initiate payment");
    } finally {
      setProcessingId(null);
    }
  };

  const handleDownloadReceipt = (tx) => {
    const itemName = tx.subscriptionPlan?.name || tx.promotionPlan?.name || tx.plan?.name || "Premium Plan";
    const itemType = tx.itemType ? tx.itemType : tx.plan ? "Promotion" : "Subscription";
    const dateStr = new Date(tx.createdAt).toLocaleDateString();
    const amountVal = tx.amount;
    const refId = tx.razorpayPaymentId || tx.razorpayOrderId || tx.offlineReference || tx._id;
    const methodStr = tx.paymentMethod || 'Razorpay';

    const receiptHtml = `
      <html>
        <head>
          <title>Receipt - JKPLOT</title>
          <style>
            body { font-family: 'Inter', sans-serif; color: #1e293b; padding: 40px; max-width: 600px; margin: 0 auto; line-height: 1.5; }
            .header { display: flex; justify-content: space-between; align-items: center; border-b: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px; }
            .logo { font-size: 24px; font-weight: 800; color: #0f172a; }
            .receipt-title { font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #64748b; font-weight: 700; }
            .details { margin-bottom: 30px; }
            .row { display: flex; justify-content: space-between; padding: 10px 0; border-b: 1px solid #f1f5f9; }
            .label { color: #64748b; font-size: 14px; }
            .value { font-weight: 600; font-size: 14px; }
            .total-row { display: flex; justify-content: space-between; margin-top: 20px; padding: 15px 0; border-t: 2px solid #0f172a; border-b: 2px solid #0f172a; font-weight: 800; font-size: 18px; }
            .footer { text-align: center; margin-top: 50px; color: #94a3b8; font-size: 12px; }
            .btn-print { background: #0f172a; color: #fff; border: none; padding: 10px 20px; border-radius: 8px; font-weight: 600; cursor: pointer; margin-top: 20px; display: inline-block; }
            @media print { .btn-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">JKPLOT HAVEN</div>
            <div class="receipt-title">Payment Receipt</div>
          </div>
          <div class="details">
            <div class="row"><span class="label">Date:</span><span class="value">${dateStr}</span></div>
            <div class="row"><span class="label">Receipt No / TX ID:</span><span class="value">${refId}</span></div>
            <div class="row"><span class="label">Customer Name:</span><span class="value">${user?.name || 'JKPlot Dealer'}</span></div>
            <div class="row"><span class="label">Mobile Number:</span><span class="value">${user?.phone || 'N/A'}</span></div>
            <div class="row"><span class="label">Item Purchased:</span><span class="value">${itemType}: ${itemName}</span></div>
            <div class="row"><span class="label">Payment Method:</span><span class="value">${methodStr}</span></div>
            <div class="row"><span class="label">Status:</span><span class="value" style="color: #10b981; text-transform: uppercase;">Success</span></div>
            <div class="total-row"><span>Total Paid</span><span>₹${amountVal}</span></div>
          </div>
          <center>
            <button class="btn-print" onclick="window.print()">Print / Save PDF</button>
          </center>
          <div class="footer">
            Thank you for partnering with JKPLOT. For support, reach out to contact@jkplot.com
          </div>
        </body>
      </html>
    `;

    const win = window.open("", "_blank");
    win.document.write(receiptHtml);
    win.document.close();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const usagePercent = usage.limit > 0 ? Math.min(100, (usage.used / usage.limit) * 100) : 0;

  return (
    <motion.div
      key="subscription"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="space-y-8"
    >
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-6">
        <div>
          <h2 className="font-display text-xl font-bold">Premium Subscription</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Manage billing details and system membership limits</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-primary/20 bg-primary-soft/20 p-5 space-y-3">
            <div className="text-xs uppercase tracking-wider text-primary font-bold">Current Plan</div>
            <div className="font-display text-2xl font-bold">{mySub ? mySub.plan?.name : "Free Trial Mode"}</div>
            <p className="text-xs text-muted-foreground">
              {mySub 
                ? "You are currently enjoying premium features and higher limits." 
                : "Good news! Property listing is currently COMPLETELY FREE! You can post properties up to your current limit. Upgrade if you need more."}
            </p>
            <div className="flex justify-between text-xs font-semibold pt-4">
              <span>Status: {mySub ? "Active" : "None"}</span>
              <span>{mySub ? `Expires: ${new Date(mySub.endDate).toLocaleDateString()}` : "Limits applied"}</span>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-secondary/20 p-5 space-y-3">
            <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Usage Summary</div>
            <div className="space-y-2 pt-2">
              <div className="flex justify-between text-xs">
                <span>Listings Published</span>
                <span className="font-semibold">{usage.used} / {usage.limit}</span>
              </div>
              <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${usagePercent >= 100 ? 'bg-destructive' : usagePercent >= 80 ? 'bg-amber-500' : 'bg-primary'}`} 
                  style={{ width: `${usagePercent}%` }} 
                />
              </div>
              <div className="flex justify-between text-xs pt-1">
                <span>Remaining Credits</span>
                <span className={`font-semibold ${usage.remaining === 0 ? 'text-destructive' : 'text-emerald-600'}`}>
                  {usage.remaining}
                </span>
              </div>
              <div className="flex justify-between text-xs pt-1 border-t border-border mt-2">
                <span>Active Premium Highlights</span>
                <span className="font-semibold text-amber-600">
                  {usage.featuredCount || 0} active
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div>
          <h3 className="font-display text-lg font-bold">Available Plans</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Choose the perfect plan to grow your real estate business</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-6">
          {plans.map(plan => {
            const isCurrent = mySub && mySub.plan?._id === plan._id;
            
            return (
              <div 
                key={plan._id} 
                className={`relative flex flex-col rounded-2xl border p-6 shadow-sm transition-all ${
                  plan.isPopular 
                    ? 'border-primary shadow-primary/10 scale-[1.02]' 
                    : isCurrent 
                      ? 'border-emerald-500 bg-emerald-50/10' 
                      : 'border-border hover:border-muted-foreground/30'
                }`}
              >
                {plan.isPopular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                    Most Popular
                  </span>
                )}
                {isCurrent && (
                  <span className="absolute -top-3 right-4 bg-emerald-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                    Current
                  </span>
                )}
                <div className="mb-4">
                  <h4 className="font-display text-xl font-bold text-foreground">{plan.name}</h4>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-3xl font-bold">₹{plan.price}</span>
                    <span className="text-sm text-muted-foreground">/{plan.durationDays} days</span>
                  </div>
                  <div className="mt-2 inline-block bg-secondary px-2.5 py-1 rounded-md text-xs font-semibold text-foreground/80">
                    Up to {plan.listingLimit} Properties
                  </div>
                </div>
                
                <ul className="flex-1 space-y-3 my-6">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="flex flex-col gap-2">
                  {isCurrent ? (
                    <button
                      disabled
                      className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all bg-secondary text-muted-foreground cursor-not-allowed"
                    >
                      Active Plan
                    </button>
                  ) : plan.price === 0 ? (
                    <button
                      onClick={() => handleSubscribe(plan, 'Razorpay')}
                      disabled={processingId !== null}
                      className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all bg-primary text-primary-foreground hover:bg-primary/90 shadow-md"
                    >
                      {processingId === `${plan._id}-Razorpay` ? <Loader2 className="h-4 w-4 animate-spin" /> : "Activate Free Plan"}
                    </button>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleSubscribe(plan, 'Razorpay')}
                        disabled={processingId !== null}
                        className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all ${
                          plan.isPopular
                            ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-md'
                            : 'bg-slate-900 text-white hover:bg-slate-800 shadow-md'
                        }`}
                      >
                        {processingId === `${plan._id}-Razorpay` ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>Pay Online</>
                        )}
                      </button>
                      <button
                        onClick={() => handleSubscribe(plan, 'Offline')}
                        disabled={processingId !== null}
                        className="flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm"
                      >
                        {processingId === `${plan._id}-Offline` ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>Pay Offline</>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {transactions.length > 0 && (
        <div className="rounded-2xl border border-border bg-card shadow-sm mt-8 overflow-hidden">
          <div className="p-6 border-b border-border flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h3 className="font-display text-lg font-bold">Billing History</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Your past transactions and pending payment requests</p>
            </div>
            <div className="flex gap-2">
              <select
                value={itemTypeFilter}
                onChange={(e) => { setItemTypeFilter(e.target.value); setPage(1); }}
                className="text-xs bg-secondary border border-border rounded-lg px-3 py-1.5 font-semibold outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="all">All Items</option>
                <option value="subscription">Subscriptions</option>
                <option value="promotion">Promotions</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="text-xs bg-secondary border border-border rounded-lg px-3 py-1.5 font-semibold outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="all">All Statuses</option>
                <option value="success">Success</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="border-b border-border text-xs uppercase font-bold text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Item</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Method</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(() => {
                  const filteredTransactions = transactions.filter(t => {
                    const status = (t.status || "").toLowerCase();
                    const matchesStatus = statusFilter === "all" || status === statusFilter.toLowerCase() || (statusFilter === 'pending' && status === 'created');
                    
                    const itemType = t.itemType ? t.itemType : t.plan ? "Promotion" : "Subscription";
                    const matchesItemType = itemTypeFilter === "all" || itemType.toLowerCase() === itemTypeFilter.toLowerCase();
                    
                    return matchesStatus && matchesItemType;
                  });

                  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
                  const paginatedTransactions = filteredTransactions.slice((page - 1) * itemsPerPage, page * itemsPerPage);

                  if (paginatedTransactions.length === 0) {
                    return (
                      <tr>
                        <td colSpan="5" className="px-4 py-8 text-center text-muted-foreground text-sm">
                          No matching transactions found.
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <>
                      {paginatedTransactions.map(t => {
                        const status = (t.status || "").toLowerCase();
                  const isSuccess = status === 'success';
                  const isPending = status === 'pending' || status === 'created';
                  const method = t.paymentMethod || 'Razorpay';
                  const itemType = t.itemType ? t.itemType : t.plan ? "Promotion" : "Subscription";

                  return (
                    <tr key={t._id}>
                      <td className="px-4 py-3 text-slate-600 font-medium">{new Date(t.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3 font-semibold text-slate-800">
                        {itemType}: {t.subscriptionPlan?.name || t.promotionPlan?.name || t.plan?.name || "Deleted Plan"}
                      </td>
                      <td className="px-4 py-3 font-bold">₹{t.amount}</td>
                      <td className="px-4 py-3 text-xs text-slate-500 font-semibold uppercase">{method}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2.5 py-1 rounded-md text-xs font-bold capitalize ${
                          isSuccess ? 'bg-emerald-100 text-emerald-700' :
                          isPending ? 'bg-amber-100 text-amber-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {isSuccess ? (
                          <button
                            onClick={() => handleDownloadReceipt(t)}
                            className="text-xs text-primary font-bold hover:underline flex items-center gap-1.5"
                          >
                            <Download size={14} className="text-primary" /> Receipt
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400 font-medium">-</span>
                        )}
                      </td>
                        </tr>
                      );
                    })}
                    {totalPages > 1 && (
                      <tr>
                        <td colSpan="6" className="px-4 py-3 bg-secondary/30">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground font-medium">Page {page} of {totalPages}</span>
                            <div className="flex gap-2">
                              <button
                                disabled={page === 1}
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                className="px-3 py-1 rounded-md border border-border bg-background text-xs font-semibold hover:bg-secondary disabled:opacity-50 transition"
                              >
                                Previous
                              </button>
                              <button
                                disabled={page === totalPages}
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                className="px-3 py-1 rounded-md border border-border bg-background text-xs font-semibold hover:bg-secondary disabled:opacity-50 transition"
                              >
                                Next
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })()}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </motion.div>
  );
}
