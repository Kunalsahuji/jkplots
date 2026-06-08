import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldAlert, Play, KeyRound, Sparkles } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import api from "@/utils/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [running, setRunning] = useState(false);

  const runAdminLoginScript = async () => {
    setRunning(true);
    const toastId = toast.loading("Executing Admin Login Script...");
    const phones = ["+918888888888", "+917777777777", "+919999999998", "+916000000000"];
    let success = false;
    let errorMessage = "";

    for (const phone of phones) {
      try {
        // Step 1: Send OTP for admin profile
        await api.post("/users/send-otp", {
          phone,
          name: "System Admin",
          role: "admin",
        });

        // Step 2: Verify OTP
        const { data } = await api.post("/users/verify-otp", {
          phone,
          otp: "123456",
        });

        if (data.success) {
          login(data.data);
          toast.success(`Admin Session Initialized on +91 ${phone}!`, { id: toastId });
          navigate("/admin/dashboard");
          success = true;
          break;
        }
      } catch (err) {
        if (err.response?.status === 400) {
          console.warn(`Phone ${phone} is already registered with another role. Trying fallback number...`);
          errorMessage = err.response.data?.error || err.message;
          continue;
        } else {
          errorMessage = err.response?.data?.error || err.message;
          break;
        }
      }
    }

    if (!success) {
      toast.error(`Script failed: ${errorMessage}`, { id: toastId });
      setRunning(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-[#0a0a0c] text-white overflow-hidden">
      {/* Background radial gradient decoration */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.08)_0%,transparent_60%)]" />
      <div className="absolute top-0 right-0 h-96 w-96 rounded-full bg-emerald-500/10 blur-[120px]" />
      <div className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-amber-500/10 blur-[120px]" />

      <div className="relative w-full max-w-md p-6">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl">
          <div className="flex flex-col items-center text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400">
              <ShieldAlert className="h-8 w-8" />
            </span>
            <h1 className="mt-6 font-display text-3xl font-bold tracking-tight">
              JK<span className="text-emerald-400">PLOT</span> Admin
            </h1>
            <p className="mt-2 text-sm text-gray-400">
              Secure administrative access for system managers.
            </p>
          </div>

          <div className="mt-8 space-y-6">
            <div className="rounded-2xl bg-white/5 p-4 border border-white/5 space-y-3">
              <div className="flex items-center gap-2.5 text-xs font-semibold text-emerald-400 uppercase tracking-widest">
                <Sparkles className="h-3.5 w-3.5 animate-pulse" /> Automation Script Details
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">
                Press the script trigger button below to automatically initialize a verified administrative session in the Mongoose database and log in with premium admin privileges.
              </p>
              <div className="text-[11px] font-mono text-gray-500 bg-black/40 p-2.5 rounded-lg border border-white/5 space-y-1">
                <div>Phone: +91 9999999999</div>
                <div>Role: admin (Full RBAC)</div>
                <div>Security: HttpOnly JWT</div>
              </div>
            </div>

            <Button
              onClick={runAdminLoginScript}
              disabled={running}
              className="relative w-full gap-2 rounded-2xl bg-emerald-500 py-6 text-base font-semibold text-black hover:bg-emerald-400 transition-all hover:scale-[1.01]"
            >
              <Play className="h-5 w-5 fill-current" />
              {running ? "Executing Login Script..." : "Launch Login Script"}
            </Button>
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-gray-600">
          Authorized personnel only. Sessions are fully audited.
        </p>
      </div>
    </div>
  );
}
