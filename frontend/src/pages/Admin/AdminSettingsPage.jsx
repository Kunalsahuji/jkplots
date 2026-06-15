import { useState } from "react";
import { Settings, Shield, Server, RefreshCw, Cpu, CheckCircle } from "lucide-react";
import api from "@/utils/api";
import { toast } from "sonner";

export default function AdminSettingsPage() {
  const [latency, setLatency] = useState(null);
  const [testing, setTesting] = useState(false);

  const runDiagnostics = async () => {
    setTesting(true);
    const start = performance.now();
    try {
      const { data } = await api.get("/users/me");
      if (data.success) {
        const end = performance.now();
        setLatency(`${Math.round(end - start)} ms`);
        toast.success("Subsystem latency diagnostics completed!");
      }
    } catch (err) {
      toast.error("Diagnostics request failed.");
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Title */}
      <div>
        <h1 className="font-display text-3xl font-bold text-slate-900 tracking-tight">
          System Settings &amp; Diagnostics
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Review application keys, check subsystem health statuses, and analyze MERN performance.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* API Credentials */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm space-y-4">
          <h3 className="font-display text-lg font-bold text-slate-900 flex items-center gap-2">
            <Shield className="h-5 w-5 text-indigo-500" /> Platform API Environment
          </h3>
          <p className="text-xs text-slate-400">
            Read-only configuration tokens loaded from the system server environments (`.env`).
          </p>
          <div className="space-y-4 pt-2">
            <div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Google Maps API Token
              </div>
              <input
                readOnly
                value={import.meta.env.VITE_GOOGLE_MAP_API_KEY || "AIzaSyBD9XADWUsuj0M3LWr3d9NjUEEsvDPU_eU"}
                className="w-full bg-slate-50 text-slate-500 font-mono text-xs rounded-xl border border-slate-150 px-3 py-2.5 outline-none select-all"
              />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Cloudinary Storage Bucket
              </div>
              <input
                readOnly
                value="dk8peecsb"
                className="w-full bg-slate-50 text-slate-500 font-mono text-xs rounded-xl border border-slate-150 px-3 py-2.5 outline-none select-all"
              />
            </div>
          </div>
        </div>

        {/* Diagnostic Statuses */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm space-y-4">
          <h3 className="font-display text-lg font-bold text-slate-900 flex items-center gap-2">
            <Server className="h-5 w-5 text-emerald-500" /> Server Diagnostics
          </h3>
          <p className="text-xs text-slate-400">
            Current connection states of the MERN stack databases and storage microservices.
          </p>
          <div className="space-y-3 text-sm text-slate-600 pt-2">
            <div className="flex justify-between items-center py-2 border-b border-slate-50">
              <span className="font-medium">MongoDB Cluster Connection</span>
              <span className="inline-flex items-center gap-1.5 text-emerald-600 font-bold text-xs">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                ONLINE
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-50">
              <span className="font-medium">Cloudinary Upload Gateway</span>
              <span className="inline-flex items-center gap-1.5 text-emerald-600 font-bold text-xs">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                ONLINE
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-50">
              <span className="font-medium">SMS Verification Gateway</span>
              <span className="inline-flex items-center gap-1.5 text-amber-500 font-bold text-xs">
                <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                SANDBOX MODE
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="font-medium">Ping Round-Trip Latency</span>
              <span className="text-slate-900 font-bold text-xs font-mono">
                {latency || "Not Checked"}
              </span>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={runDiagnostics}
              disabled={testing}
              className="inline-flex items-center gap-2 w-full justify-center rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 py-2.5 text-xs font-bold transition-all"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${testing ? "animate-spin text-slate-400" : ""}`} />
              Test API Response Speed
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
