import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Mail, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import api from "@/utils/api";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter email and password");
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post("/admin/login", { email, password });
      if (data.success) {
        toast.success("Login successful");
        await refreshUser(); // Update auth context state
        navigate("/admin/dashboard");
      }
    } catch (err) {
      toast.error(err.response?.data?.error || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-elevated p-8 border border-border">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold font-display tracking-tight text-gray-900">
            JKPlot <span className="text-primary">Admin</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-2 uppercase tracking-widest font-semibold">
            Secure Portal
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@jkplot.com"
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                required
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-gray-900 hover:bg-black text-white rounded-xl text-base font-semibold transition-all mt-4"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Sign In to Dashboard"}
          </Button>
        </form>

        <button 
          onClick={() => navigate('/')} 
          className="mt-8 flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-gray-900 w-full font-medium transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Website
        </button>
      </div>
    </div>
  );
}
