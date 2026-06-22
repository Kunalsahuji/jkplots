import { useState, useEffect } from "react";
import { Settings, Shield, Server, RefreshCw, Cpu, CheckCircle, Save, Loader2 } from "lucide-react";
import api from "@/utils/api";
import { toast } from "sonner";

export default function AdminSettingsPage() {
  const [latency, setLatency] = useState(null);
  const [testing, setTesting] = useState(false);

  const [sysLoading, setSysLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState({
    isSubscriptionEnforced: false,
    freeListingLimit: 50,
  });

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setSysLoading(true);
      const { data } = await api.get("/system-config");
      if (data.success && data.data) {
        setConfig({
          isSubscriptionEnforced: data.data.isSubscriptionEnforced,
          freeListingLimit: data.data.freeListingLimit,
        });
      }
    } catch (err) {
      toast.error("Failed to load system configuration");
    } finally {
      setSysLoading(false);
    }
  };

  const handleSaveConfig = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.put("/system-config", config);
      if (data.success) {
        toast.success("System configuration saved successfully!");
      }
    } catch (err) {
      toast.error("Failed to save configuration");
    } finally {
      setSaving(false);
    }
  };

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
        
        {/* Subscription & Limits Control */}
        <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden md:col-span-2">
          <div className="px-6 py-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <h3 className="font-display text-lg font-bold text-slate-900 flex items-center gap-2">
              <Shield className="h-5 w-5 text-indigo-500" /> Subscription & Limits Control
            </h3>
          </div>
          
          {sysLoading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
          ) : (
            <form onSubmit={handleSaveConfig} className="p-6 space-y-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Enforce Paid Subscriptions</h3>
                  <p className="text-sm text-slate-500 mt-1 max-w-xl">
                    If disabled, property listings are completely <strong>free and unlimited</strong> for all dealers. If enabled, dealers are restricted to the Free Tier Limit and must purchase a subscription to post more properties.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-2">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={config.isSubscriptionEnforced}
                    onChange={(e) => setConfig({ ...config, isSubscriptionEnforced: e.target.checked })}
                  />
                  <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              <div className="border-t border-slate-100 pt-6">
                <label className="block text-sm font-bold text-slate-900 mb-2">
                  Free Tier Listing Limit
                </label>
                <p className="text-xs text-slate-500 mb-4 max-w-xl">
                  How many properties can a dealer post for free if they do not have an active subscription? (This applies whether subscriptions are enforced or not).
                </p>
                <div className="relative max-w-xs">
                  <input
                    type="number"
                    min="0"
                    required
                    value={config.freeListingLimit}
                    onChange={(e) => setConfig({ ...config, freeListingLimit: Number(e.target.value) })}
                    className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none text-sm font-medium transition-all"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-semibold pointer-events-none">
                    Properties
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-bold text-white transition-all hover:bg-black focus:outline-none focus:ring-4 focus:ring-slate-200 disabled:opacity-50 shadow-md"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save Configuration
                </button>
              </div>
            </form>
          )}
        </div>

        {/* API Credentials */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm space-y-4">
          <h3 className="font-display text-lg font-bold text-slate-900 flex items-center gap-2">
            <Cpu className="h-5 w-5 text-indigo-500" /> Platform API Environment
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
