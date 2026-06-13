import { useState, useEffect } from "react";
import { Sparkles, Crown, Loader2, ArrowRight, CheckCircle2 } from "lucide-react";
import api from "@/utils/api";
import { toast } from "sonner";
import { PropertyCard } from "@/components/site/PropertyCard";

// Dynamic script loader for Razorpay
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => {
      resolve(true);
    };
    script.onerror = () => {
      resolve(false);
    };
    document.body.appendChild(script);
  });
};

export default function PromotePropertyTab({ properties, refreshData }) {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    fetchPlans();
  }, []);

  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isModalOpen]);

  const fetchPlans = async () => {
    try {
      const { data } = await api.get("/promotions/plans");
      if (data.success) {
        setPlans(data.data);
      }
    } catch (err) {
      toast.error("Failed to load promotion plans");
    } finally {
      setLoading(false);
    }
  };

  const handleBoostClick = (property) => {
    setSelectedProperty(property);
    setIsModalOpen(true);
  };

  const handlePayment = async (plan) => {
    setProcessingId(plan._id);
    const res = await loadRazorpayScript();

    if (!res) {
      toast.error("Razorpay SDK failed to load. Are you online?");
      setProcessingId(null);
      return;
    }

    try {
      // Create Order
      const { data: orderData } = await api.post("/promotions/order", {
        planId: plan._id,
        propertyId: selectedProperty._id,
      });

      if (!orderData.success) {
        toast.error("Could not create order");
        setProcessingId(null);
        return;
      }

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_8sYbzHWidwe5Zw", // Fallback to provided test key
        amount: orderData.order.amount,
        currency: "INR",
        name: "JKPlot Haven",
        description: `Promotion for ${selectedProperty.title} - ${plan.name}`,
        order_id: orderData.order.id,
        handler: async function (response) {
          try {
            // Verify Payment
            const verifyRes = await api.post("/promotions/verify", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              transactionId: orderData.transactionId,
            });

            if (verifyRes.data.success) {
              toast.success("Property promoted successfully! 🚀");
              setIsModalOpen(false);
              if (refreshData) refreshData();
            }
          } catch (err) {
            toast.error(err.response?.data?.error || "Payment verification failed");
          }
        },
        prefill: {
          name: "JKPlot User",
          email: "user@jkplot.com",
          contact: "9999999999",
        },
        theme: {
          color: "#0f172a",
        },
        modal: {
          ondismiss: function() {
            setProcessingId(null);
          }
        }
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.on('payment.failed', function (response){
          toast.error("Payment failed. Please try again.");
          setProcessingId(null);
      });
      paymentObject.open();

    } catch (err) {
      toast.error(err.response?.data?.error || "Something went wrong");
      setProcessingId(null);
    }
  };

  const promotedProperties = properties.filter(
    p => p.isFeatured && new Date(p.featuredUntil) > new Date()
  );
  
  const normalProperties = properties.filter(
    p => !p.isFeatured || new Date(p.featuredUntil) <= new Date()
  );

  return (
    <div className="space-y-10">
      {/* Promoted Properties Section */}
      {promotedProperties.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <Crown className="text-yellow-500 h-5 w-5" />
            <h2 className="text-xl font-bold font-display">Active Promotions</h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {promotedProperties.map((property) => {
              const daysLeft = Math.ceil((new Date(property.featuredUntil) - new Date()) / (1000 * 60 * 60 * 24));
              return (
                <div key={property._id} className="relative group rounded-2xl overflow-hidden shadow-soft border border-yellow-200">
                  <PropertyCard p={property} />
                  <div className="absolute top-3 left-3 bg-gradient-to-r from-yellow-400 to-amber-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-md flex items-center gap-1">
                    <Sparkles size={14} /> Promoted (Expires in {daysLeft} days)
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Unpromoted Properties Section */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 border-b border-border pb-3">
          <h2 className="text-xl font-bold font-display">Wanna boost/promote your property?</h2>
          <p className="text-sm text-muted-foreground hidden sm:block">- Get 10x more views by featuring them</p>
        </div>
        
        {normalProperties.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl p-8 text-center">
            <p className="text-muted-foreground text-sm font-medium">You don't have any normal properties to promote right now.</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {normalProperties.map((property) => (
              <div key={property._id} className="relative flex flex-col h-full">
                <PropertyCard p={property} />
                <button
                  onClick={() => handleBoostClick(property)}
                  className="mt-3 w-full bg-slate-900 hover:bg-slate-800 text-white py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-sm"
                >
                  Boost Property <Sparkles size={16} className="text-yellow-400" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Promotion Plans Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 bg-gray-100 p-2 rounded-full hover:bg-gray-200 transition"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
            
            <div className="p-8">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-display font-bold text-slate-900">Choose a Promotion Plan</h2>
                <p className="text-muted-foreground mt-2">Boost "{selectedProperty?.title}" and get premium visibility.</p>
              </div>

              {loading ? (
                <div className="flex justify-center p-12">
                  <Loader2 className="animate-spin text-primary h-8 w-8" />
                </div>
              ) : plans.length === 0 ? (
                <div className="text-center p-8 bg-gray-50 rounded-2xl">
                  <p className="text-gray-500 font-medium">No plans available right now. Please contact support.</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-3 gap-6">
                  {plans.map((plan) => (
                    <div key={plan._id} className="border-2 border-gray-100 rounded-3xl p-6 hover:border-primary transition-all flex flex-col bg-white hover:shadow-xl relative overflow-hidden group">
                      <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-primary to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      
                      <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                      <div className="mt-4 flex items-baseline text-4xl font-black text-gray-900">
                        ₹{plan.price}
                      </div>
                      <p className="text-sm text-gray-500 font-semibold uppercase tracking-wider mt-1 mb-6">
                        for {plan.durationInDays} days
                      </p>

                      <ul className="space-y-3 mb-8 flex-1">
                        {plan.description && plan.description.length > 0 ? (
                          plan.description.map((desc, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-gray-600 font-medium">
                              <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                              {desc}
                            </li>
                          ))
                        ) : (
                          <li className="flex items-start gap-2 text-sm text-gray-600 font-medium">
                            <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                            Premium placement in search
                          </li>
                        )}
                      </ul>

                      <button
                        onClick={() => handlePayment(plan)}
                        disabled={processingId !== null}
                        className="w-full bg-slate-900 text-white rounded-xl py-3.5 font-bold hover:bg-primary transition-colors flex items-center justify-center gap-2"
                      >
                        {processingId === plan._id ? <Loader2 className="animate-spin h-5 w-5" /> : (
                          <>Choose Plan <ArrowRight size={18} /></>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
