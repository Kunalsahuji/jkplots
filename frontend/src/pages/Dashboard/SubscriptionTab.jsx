import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Check, Loader2, CreditCard } from "lucide-react";
import api from "@/utils/api";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

export default function SubscriptionTab() {
  const { user } = useAuth();
  const [plans, setPlans] = useState([]);
  const [mySub, setMySub] = useState(null);
  const [usage, setUsage] = useState({ used: 0, limit: 1, remaining: 1 });
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [plansRes, mySubRes] = await Promise.all([
        api.get("/subscription-plans/active"),
        api.get("/subscription-plans/my-subscription")
      ]);
      
      if (plansRes.data.success) {
        setPlans(plansRes.data.data);
      }
      
      if (mySubRes.data.success) {
        setMySub(mySubRes.data.data.activeSubscription);
        setUsage(mySubRes.data.data.usage);
      }
    } catch (err) {
      toast.error("Failed to load subscription details");
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (plan) => {
    try {
      setProcessingId(plan._id);
      
      const { data } = await api.post("/subscription-plans/create-order", { planId: plan._id });
      
      if (data.isFree) {
        toast.success(data.message);
        fetchData();
        return;
      }

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_YourKeyHere",
        amount: data.amount,
        currency: data.currency,
        name: "JKPLOT Premium",
        description: `Subscription: ${plan.name}`,
        order_id: data.orderId,
        handler: async function (response) {
          try {
            const verifyRes = await api.post("/subscription-plans/verify-payment", {
              ...response,
              planId: plan._id
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
      toast.error(err.response?.data?.message || "Failed to initiate payment");
    } finally {
      setProcessingId(null);
    }
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
                <span className="font-semibold">{usage.used} / {usage.limit >= 999999 ? 'Unlimited' : usage.limit}</span>
              </div>
              <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${usage.limit >= 999999 ? 'bg-primary' : usagePercent >= 100 ? 'bg-destructive' : usagePercent >= 80 ? 'bg-amber-500' : 'bg-primary'}`} 
                  style={{ width: `${usage.limit >= 999999 ? 100 : usagePercent}%` }} 
                />
              </div>
              <div className="flex justify-between text-xs pt-1">
                <span>Remaining Credits</span>
                <span className={`font-semibold ${usage.limit >= 999999 ? 'text-emerald-600' : usage.remaining === 0 ? 'text-destructive' : 'text-emerald-600'}`}>
                  {usage.limit >= 999999 ? 'Unlimited' : usage.remaining}
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

                <button
                  onClick={() => handleSubscribe(plan)}
                  disabled={isCurrent || processingId === plan._id}
                  className={`w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all ${
                    isCurrent 
                      ? 'bg-secondary text-muted-foreground cursor-not-allowed'
                      : plan.isPopular
                        ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-md'
                        : 'bg-slate-900 text-white hover:bg-slate-800 shadow-md'
                  }`}
                >
                  {processingId === plan._id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : isCurrent ? (
                    "Active Plan"
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4" /> Subscribe Now
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
