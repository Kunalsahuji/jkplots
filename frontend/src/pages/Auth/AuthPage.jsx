import { Link } from "react-router-dom";
import { Home, Mail, Phone, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function AuthPage() {
  const [mode, setMode] = useState("phone");

  return (
    <div className="container-px mx-auto grid min-h-[80vh] max-w-7xl gap-8 py-12 lg:grid-cols-2 lg:items-center">
      <div className="hidden rounded-3xl bg-gradient-hero p-12 text-primary-foreground lg:block">
        <Home className="h-10 w-10 text-accent" />
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
        <div className="rounded-3xl border border-border bg-card p-8 shadow-card">
          <h1 className="font-display text-2xl font-bold">Sign in to JKPLOT</h1>
          <p className="mt-1 text-sm text-muted-foreground">Continue to your account</p>

          <div className="mt-6 flex rounded-full bg-secondary p-1">
            {["phone", "email"].map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 rounded-full py-2 text-sm font-medium capitalize transition ${
                  mode === m ? "bg-background shadow-soft" : "text-muted-foreground"
                }`}
              >
                {m === "phone" ? "Phone OTP" : "Email"}
              </button>
            ))}
          </div>

          <form onSubmit={(e) => e.preventDefault()} className="mt-6 space-y-3">
            {mode === "phone" ? (
              <label className="flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-3 focus-within:border-primary">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">+91</span>
                <input className="flex-1 bg-transparent text-sm outline-none" placeholder="Mobile number" />
              </label>
            ) : (
              <label className="flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-3 focus-within:border-primary">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <input className="flex-1 bg-transparent text-sm outline-none" placeholder="you@email.com" />
              </label>
            )}
            <Button className="w-full gap-2 rounded-xl bg-primary py-6">
              Continue <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> or continue with <span className="h-px flex-1 bg-border" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button className="rounded-xl border border-border py-3 text-sm font-medium hover:bg-secondary">
              Google
            </button>
            <button className="rounded-xl border border-border py-3 text-sm font-medium hover:bg-secondary">
              Apple
            </button>
          </div>

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
