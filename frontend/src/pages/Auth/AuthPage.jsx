import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Home, Phone, ArrowRight, ArrowLeft, Lock, User } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AuthPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(1);
  const [isDealer, setIsDealer] = useState(false);
  const [error, setError] = useState("");

  const handleSendOtp = (e) => {
    e.preventDefault();
    if (!phone || phone.length < 10) return;

    setError("");
    // Simulate sending OTP, transition to step 2
    setStep(2);
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) return;

    if (otp !== "123456") {
      setError("Incorrect OTP! Please use 123456.");
      return;
    }

    try {
      setError("");
      const response = await fetch("http://localhost:5000/api/users/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          phone,
          name: name || (isDealer ? "Verified Dealer" : "Verified User"),
          role: isDealer ? "dealer" : "user"
        })
      });

      const resData = await response.json();
      if (resData.success) {
        localStorage.setItem("user", JSON.stringify(resData.data));

        // Redirect to requested URL, or fallback to homepage
        const redirectUrl = searchParams.get("redirect") || "/";
        navigate(redirectUrl);
      } else {
        setError(resData.error || "Authentication failed.");
      }
    } catch (err) {
      setError("Connection to backend server failed.");
    }
  };

  return (
    <div className="container-px mx-auto grid min-h-screen max-w-7xl gap-8 py-12 lg:grid-cols-2 lg:items-center">
      <div className="hidden rounded-3xl bg-gradient-hero p-12 text-primary-foreground lg:block">
        <Link to="/" className="inline-block transition-transform hover:scale-105">
          <Home className="h-10 w-10 text-accent" />
        </Link>
        <h2 className="mt-6 font-display text-4xl font-bold leading-tight">
          Welcome to J&K's<br />property home.
        </h2>
        <p className="mt-4 max-w-md text-background/80">
          Save favorite listings, get instant alerts, chat with verified dealers — all in one place.
        </p>
        <ul className="mt-8 space-y-3 text-sm">
          {["Verified dealer network", "Instant WhatsApp connect", "Smart price alerts", "Save and compare"].map((f) => (
            <li key={f} className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" /> {f}
            </li>
          ))}
        </ul>
      </div>

      <div className="mx-auto w-full max-w-md">
        <div className="mb-4 text-left">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground transition hover:text-primary">
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </Link>
        </div>
        <div className="rounded-3xl border border-border bg-card p-8 shadow-card">
          <h1 className="font-display text-2xl font-bold">Sign in to JKPLOT</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {step === 1 ? "Continue to your account" : `OTP sent to +91 ${phone}`}
          </p>

          {error && (
            <div className="mt-4 rounded-xl bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive text-center font-medium">
              {error}
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleSendOtp} className="mt-6 space-y-3">
              <label className="flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-3 focus-within:border-primary">
                <User className="h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="flex-1 bg-transparent text-sm outline-none"
                  placeholder="Full Name"
                  required
                />
              </label>
              <label className="flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-3 focus-within:border-primary">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">+91</span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  className="flex-1 bg-transparent text-sm outline-none"
                  placeholder="Mobile number"
                  required
                />
              </label>
              <div className="flex items-center gap-2 py-1">
                <input
                  type="checkbox"
                  id="isDealer"
                  checked={isDealer}
                  onChange={(e) => setIsDealer(e.target.checked)}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary accent-primary"
                />
                <label htmlFor="isDealer" className="text-sm font-medium text-muted-foreground cursor-pointer select-none">
                  Are you joining as a Dealer / Agent?
                </label>
              </div>
              <Button type="submit" className="w-full gap-2 rounded-xl bg-primary py-6" disabled={phone.length < 10}>
                Continue <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="mt-6 space-y-4">
              <div className="space-y-1">
                <div className="flex justify-between items-center px-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Enter OTP</label>
                  <button type="button" onClick={() => setStep(1)} className="text-xs font-bold text-primary hover:underline">Change Number</button>
                </div>
                <label className="flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-3 focus-within:border-primary">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    className="flex-1 bg-transparent text-sm outline-none text-center tracking-[0.4em] font-bold"
                    placeholder="000000"
                    required
                  />
                </label>
              </div>
              <Button type="submit" className="w-full gap-2 rounded-xl bg-primary py-6" disabled={otp.length !== 6}>
                Verify &amp; Continue <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
          )}

          <p className="mt-6 text-center text-xs text-muted-foreground">
            By continuing you agree to our{" "}
            <Link to="/" className="text-primary hover:underline">
              Terms
            </Link>{" "}
            &amp;{" "}
            <Link to="/" className="text-primary hover:underline">
              Privacy
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
