import { useState } from "react";
import { BadgeCheck, Loader2, AlertCircle, CheckCircle2, ShieldCheck, ShieldAlert } from "lucide-react";
import api from "@/utils/api";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

export default function KycSection() {
  const { user, refreshUser } = useAuth();
  
  const [panNumber, setPanNumber] = useState(user?.panNumber || "");
  const [panName, setPanName] = useState(user?.panName || "");
  const [otp, setOtp] = useState("");
  
  const [step, setStep] = useState("form"); // "form", "otp"
  const [loading, setLoading] = useState(false);

  // Status mapping
  const kycStatus = user?.kycStatus || "unverified";

  const handleInitiate = async (e) => {
    e.preventDefault();
    if (!panNumber || !panName) {
      toast.error("Please provide both PAN Number and Name");
      return;
    }
    
    // Basic PAN format validation
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (!panRegex.test(panNumber.toUpperCase())) {
      toast.error("Invalid PAN Card format");
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post("/users/kyc/initiate", {
        panNumber: panNumber.toUpperCase(),
        panName,
      });
      if (data.success) {
        toast.success(data.message);
        setStep("otp");
        await refreshUser();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to initiate KYC");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!otp || otp.length < 6) {
      toast.error("Please enter a valid 6-digit OTP");
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post("/users/kyc/verify", { otp });
      if (data.success) {
        toast.success(data.message);
        setStep("form");
        await refreshUser();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to verify OTP");
    } finally {
      setLoading(false);
    }
  };

  if (kycStatus === "approved") {
    return (
      <div className="rounded-2xl relative overflow-hidden bg-gradient-to-br from-green-500/10 via-emerald-500/5 to-teal-500/10 border border-green-500/20 p-5 sm:p-8 flex flex-col sm:flex-row items-start gap-4 mt-6 shadow-sm">
        <div className="absolute -right-10 -top-10 opacity-[0.07]">
          <ShieldCheck className="h-48 w-48 text-green-600" />
        </div>
        <div className="relative z-10 bg-gradient-to-br from-green-400 to-emerald-600 text-white p-3 rounded-2xl shadow-md shrink-0">
          <ShieldCheck className="h-8 w-8" />
        </div>
        <div className="relative z-10 min-w-0">
          <h3 className="font-bold text-lg sm:text-2xl text-green-900 flex flex-wrap items-center gap-2">
            Verified Premium Dealer <BadgeCheck className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 shrink-0" />
          </h3>
          <p className="text-xs sm:text-sm text-green-800 mt-2 leading-relaxed max-w-xl">
            Congratulations! Your identity has been verified. All your listed properties now automatically feature the <strong>Verified Badge</strong>, building 10x more trust with prospective buyers and giving your listings premium visibility.
          </p>
          <div className="mt-5 inline-flex flex-wrap items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-white/60 backdrop-blur-sm rounded-lg border border-green-500/20 shadow-sm">
            <span className="text-[10px] sm:text-xs uppercase tracking-wider font-bold text-green-900/60">Verified PAN:</span>
            <span className="text-xs sm:text-sm font-black tracking-widest text-green-900">{user?.panNumber?.replace(/.(?=.{4})/g, '•')}</span>
          </div>
        </div>
      </div>
    );
  }

  if (kycStatus === "pending" && step === "form") {
    return (
      <div className="rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-5 sm:p-6 flex flex-col sm:flex-row items-start gap-4 mt-6 shadow-sm">
        <div className="bg-gradient-to-br from-amber-400 to-orange-500 text-white p-3 rounded-2xl shadow-md shrink-0">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
        <div className="min-w-0">
          <h3 className="font-bold text-lg sm:text-xl text-amber-900">Verification Pending</h3>
          <p className="text-xs sm:text-sm text-amber-800 mt-1 max-w-lg">
            Your KYC details are currently under review. If you haven't verified the OTP yet, you need to complete that step first to proceed.
          </p>
          <button 
            onClick={() => { setStep("otp"); setPanNumber(user?.panNumber); setPanName(user?.panName); }}
            className="mt-4 px-4 py-2 bg-white rounded-lg border border-amber-200 text-xs sm:text-sm font-bold text-amber-800 shadow-sm hover:bg-amber-50 transition-colors"
          >
            I have an OTP to verify
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-sm mt-6">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h3 className="font-display text-lg font-bold flex items-center gap-2">
            Dealer KYC Verification <BadgeCheck className="h-5 w-5 text-primary" />
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Verify your identity to get the "Verified Property" badge on all your listings.
          </p>
        </div>
        {kycStatus === "rejected" && (
          <span className="bg-destructive/10 text-destructive text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
            <AlertCircle className="h-3 w-3" /> Rejected
          </span>
        )}
      </div>

      {step === "form" ? (
        <form onSubmit={handleInitiate} className="space-y-4 max-w-md">
          {kycStatus === "rejected" && (
            <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-4 flex items-start gap-3 mb-2">
              <ShieldAlert className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-destructive text-sm">Verification Rejected</h4>
                <p className="text-xs text-destructive/80 mt-1 font-medium">
                  Your previous KYC attempt was rejected. The PAN details provided did not match official records. Please double-check your documents and try again.
                </p>
              </div>
            </div>
          )}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">PAN Card Number</label>
            <input
              value={panNumber}
              onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
              placeholder="ABCDE1234F"
              maxLength={10}
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary uppercase placeholder:normal-case"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Name on PAN</label>
            <input
              value={panName}
              onChange={(e) => setPanName(e.target.value)}
              placeholder="As printed on PAN card"
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Registered Mobile (For OTP)</label>
            <input
              disabled
              value={user?.phone || ""}
              className="w-full rounded-xl border border-border bg-muted/50 px-4 py-2.5 text-sm outline-none cursor-not-allowed text-muted-foreground font-medium"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 text-white rounded-xl py-2.5 font-bold hover:bg-primary transition-colors flex items-center justify-center gap-2 shadow-sm text-sm"
          >
            {loading ? <Loader2 className="animate-spin h-4 w-4" /> : "Send OTP to Verify"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerify} className="space-y-4 max-w-md bg-secondary/30 p-5 rounded-2xl border border-border">
          <div className="text-center mb-2">
            <CheckCircle2 className="h-10 w-10 text-success mx-auto mb-2 opacity-80" />
            <h4 className="font-bold">Enter Verification Code</h4>
            <p className="text-xs text-muted-foreground mt-1">
              We've sent a 6-digit OTP to {user?.phone}
            </p>
            <p className="text-[10px] text-muted-foreground mt-1 bg-yellow-100 text-yellow-800 p-1 rounded inline-block">
              (Use test OTP: 123456)
            </p>
          </div>
          
          <div className="space-y-1">
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              placeholder="• • • • • •"
              maxLength={6}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-center tracking-[0.5em] font-bold text-lg outline-none focus:border-primary"
              required
            />
          </div>
          
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setStep("form")}
              disabled={loading}
              className="flex-1 bg-white border border-border text-foreground rounded-xl py-2.5 font-bold hover:bg-secondary transition-colors text-sm"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-[2] bg-primary text-white rounded-xl py-2.5 font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 shadow-sm text-sm"
            >
              {loading ? <Loader2 className="animate-spin h-4 w-4" /> : "Verify & Approve"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
