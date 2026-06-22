import { useState, useEffect } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  Building2,
  Home,
  MessageSquare,
  Settings,
  Bell,
  Search,
  LogOut,
  Menu,
  X,
  Star,
  MapPin,
  ThumbsUp,
  FileText,
  CreditCard,
  ImageIcon,
  AlertTriangle
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import api from "@/utils/api";

const MENU_GROUPS = [
  {
    title: "OVERVIEW",
    items: [
      { icon: LayoutDashboard, label: "Dashboard", path: "/admin/dashboard" },
    ],
  },
  {
    title: "MANAGEMENT",
    items: [
      { icon: Users, label: "User Management", path: "/admin/users" },
      { icon: Building2, label: "Dealer Management", path: "/admin/dealers" },
      { icon: Home, label: "Property Management", path: "/admin/properties" },
      { icon: MessageSquare, label: "Enquiries", path: "/admin/enquiries" },
      { icon: MapPin, label: "Cities Management", path: "/admin/cities" },
      { icon: ImageIcon, label: "Banners", path: "/admin/banners" },
      { icon: ThumbsUp, label: "Reviews & Feedbacks", path: "/admin/reviews" },
      { icon: AlertTriangle, label: "Fraud Logs", path: "/admin/fraud" },
    ],
  },
  {
    title: "REVENUE & SYSTEM",
    items: [
      { icon: CreditCard, label: "Subscription Plans", path: "/admin/subscriptions" },
      { icon: Star, label: "Promotion Plans", path: "/admin/promotions" },
      { icon: CreditCard, label: "Transactions Logs", path: "/admin/transactions" },
      { icon: FileText, label: "Legal Pages CMS", path: "/admin/legal" },
      { icon: Settings, label: "Settings", path: "/admin/settings" },
    ],
  },
];

export default function AdminLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();

  useEffect(() => {
    // Basic protection - wait for auth to load
    if (!user) return;
    if (user.role !== "admin" && user.role !== "superadmin") {
      navigate("/");
      toast.error("Unauthorized access");
    }
  }, [user, navigate]);

  const handleLogout = async () => {
    try {
      await api.post("/admin/logout");
      toast.success("Logged out successfully");
      await refreshUser();
      navigate("/admin/login");
    } catch (err) {
      toast.error("Logout failed");
    }
  };

  if (!user) return null;

  return (
    <div className="flex h-screen bg-gray-100 font-sans text-gray-900 overflow-hidden">
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: isSidebarOpen ? 280 : 80 }}
        className="bg-white text-gray-900 flex flex-col h-full border-r border-gray-100 shadow-xl z-20 relative transition-all duration-300"
      >
        {/* Sidebar Header */}
        <div
          className={`p-5 flex items-center justify-between bg-white border-b border-gray-50 transition-all duration-300 ${
            !isSidebarOpen && "flex-col gap-4 p-4"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0 shadow-sm">
              <span className="font-display font-bold text-xl">JK</span>
            </div>
            {isSidebarOpen && (
              <div className="flex flex-col min-w-0">
                <span className="text-[13px] font-black text-gray-900 truncate tracking-tight uppercase">
                  JKPLOT <span className="text-primary">ADMIN</span>
                </span>
                <p className="text-[9px] text-gray-400 font-bold tracking-widest uppercase">
                  Management Portal
                </p>
              </div>
            )}
          </div>

          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={`p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-900 transition-colors ${
              !isSidebarOpen && "mt-2"
            }`}
          >
            {isSidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-4 space-y-6 overflow-y-auto">
          {MENU_GROUPS.map((group, gIdx) => (
            <div key={gIdx} className="space-y-2">
              {isSidebarOpen && (
                <h4 className="px-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
                  {group.title}
                </h4>
              )}
              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive = location.pathname.startsWith(item.path);
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center transition-all group relative text-[13px] font-medium tracking-tight ${
                        isSidebarOpen
                          ? "gap-3 px-4 py-2.5 rounded-xl"
                          : "justify-center w-12 h-12 rounded-xl mx-auto mb-1"
                      } ${
                        isActive
                          ? "bg-black text-white shadow-xl shadow-gray-900/10 font-semibold"
                          : "text-slate-500 hover:bg-gray-50 hover:text-gray-900"
                      }`}
                    >
                      <item.icon
                        size={18}
                        className={`shrink-0 ${
                          isActive
                            ? "text-white"
                            : "text-gray-400 group-hover:text-gray-900"
                        }`}
                      />
                      {isSidebarOpen && (
                        <span className="whitespace-nowrap flex-1 truncate">
                          {item.label}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer / Logout */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/30">
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors font-bold text-[13px] ${
              !isSidebarOpen && "justify-center"
            }`}
          >
            <LogOut size={18} />
            {isSidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 shadow-sm z-10 shrink-0">
          <div className="flex items-center gap-4 flex-1">
            <h1 className="text-xl font-bold text-gray-800 uppercase tracking-tighter">
              JKPLOT <span className="text-primary">ADMIN</span>
            </h1>
            <div className="hidden md:flex items-center relative max-w-md w-full ml-8">
              <Search size={16} className="absolute left-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search properties, users..."
                className="w-full pl-10 pr-4 py-2 bg-gray-100 border-none rounded-lg text-sm focus:ring-2 focus:ring-black focus:bg-white transition-all outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <button className="relative p-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors">
              <Bell size={20} />
            </button>
            <div className="h-8 w-8 rounded-full bg-black text-white flex items-center justify-center font-bold text-sm">
              {user?.name?.[0]?.toUpperCase() || "A"}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-20 relative scroll-smooth bg-gray-50/50">
          <div className="max-w-[1600px] mx-auto min-h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
