import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, Search, Heart, User, Menu, X, Plus, LogOut, LayoutDashboard, Settings, ChevronDown } from "lucide-react";
import { motion } from "motion/react";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

const nav = [
  { to: "/", label: "Home" },
  { to: "/explore", label: "Explore" },
  { to: "/properties?purpose=Buy", label: "Buy" },
  { to: "/properties?purpose=Rent", label: "Rent" },
  { to: "/properties?purpose=Commercial", label: "Commercial" },
  { to: "/dealers", label: "Agents" },
  { to: "/blog", label: "Blog" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname + location.search;
  const dropdownRef = useRef(null);

  const { user, isAuthenticated, logout } = useAuth();
  const showPostProperty = isAuthenticated && user?.role === "dealer";

  const handleLogout = async () => {
    setProfileOpen(false);
    await logout();
    navigate("/", { replace: true });
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close dropdown on route change
  useEffect(() => {
    setProfileOpen(false);
    setOpen(false);
  }, [location.pathname]);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/85 backdrop-blur-xl shadow-sm text-foreground">
      <div className="container-px mx-auto flex h-16 max-w-7xl items-center justify-between gap-4">
        <Link to="/" onClick={() => setOpen(false)} className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-hero text-primary-foreground shadow-soft">
            <Home className="h-4 w-4" />
          </span>
          <span className="font-display text-xl font-bold tracking-tight text-foreground">
            JK<span className="text-primary">PLOT</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex relative">
          {nav.map((n) => {
            const isActive = currentPath === n.to || (n.to !== "/" && currentPath.startsWith(n.to));
            return (
              <Link
                key={n.label}
                to={n.to}
                className={`relative px-4 py-2 text-sm font-semibold transition-colors duration-200 ${
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="navbar-indicator"
                    className="absolute inset-0 rounded-full bg-primary/10"
                    transition={{ type: "spring", bounce: 0.25, duration: 0.5 }}
                  />
                )}
                <span className="relative z-10">{n.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          {showPostProperty && (
            <Link to="/post-property" className="hidden lg:inline-flex">
              <Button className="gap-1.5 rounded-full bg-foreground text-background hover:bg-foreground/90">
                <Plus className="h-4 w-4" /> Post Property <span className="ml-1 rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-semibold text-accent-foreground">FREE</span>
              </Button>
            </Link>
          )}

          {isAuthenticated ? (
            <div className="relative hidden lg:block" ref={dropdownRef}>
              {/* Profile Trigger Button */}
              <button
                onClick={() => setProfileOpen((prev) => !prev)}
                className="flex items-center gap-2 rounded-full border border-border bg-secondary/60 px-3 py-1.5 text-sm font-medium text-foreground hover:bg-secondary transition-colors"
              >
                <div className="grid h-6 w-6 place-items-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <span className="max-w-[80px] truncate">{user?.name?.split(" ")[0]}</span>
                <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${profileOpen ? "rotate-180" : ""}`} />
              </button>

              {/* Dropdown Menu */}
              {profileOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 rounded-2xl border border-border bg-background shadow-xl overflow-hidden z-50">
                  {/* User info header */}
                  <div className="border-b border-border px-4 py-3 bg-secondary/30">
                    <p className="text-sm font-bold text-foreground truncate">{user?.name}</p>
                    <p className="text-[11px] text-muted-foreground capitalize">{user?.role || "Member"}</p>
                  </div>
                  {/* Menu items */}
                  <div className="py-1.5">
                    <Link
                      to="/dashboard"
                      className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-foreground hover:bg-secondary transition-colors"
                    >
                      <LayoutDashboard className="h-4 w-4 text-primary" />
                      Dashboard
                    </Link>
                    <Link
                      to="/dashboard/settings"
                      className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-foreground hover:bg-secondary transition-colors"
                    >
                      <Settings className="h-4 w-4 text-muted-foreground" />
                      Settings
                    </Link>
                  </div>
                  <div className="border-t border-border py-1.5">
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link 
              to="/auth" 
              className="hidden text-sm font-medium text-muted-foreground hover:text-foreground sm:inline"
            >
              Sign in
            </Link>
          )}
          <button
            onClick={() => setOpen(!open)}
            className="grid h-10 w-10 place-items-center rounded-lg border border-border text-foreground hover:bg-secondary lg:hidden"
            aria-label="Menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border bg-background lg:hidden">
          <div className="container-px mx-auto flex max-w-7xl flex-col gap-1 py-3">
            {nav.map((n) => {
              const isActive = currentPath === n.to || (n.to !== "/" && currentPath.startsWith(n.to));
              return (
                <Link
                  key={n.label}
                  to={n.to}
                  onClick={() => setOpen(false)}
                  className={`rounded-lg px-3 py-3 text-sm font-medium hover:bg-secondary ${
                    isActive 
                      ? "text-foreground bg-secondary" 
                      : "text-muted-foreground"
                  }`}
                >
                  {n.label}
                </Link>
              );
            })}
            {isAuthenticated && (
              <>
                <Link
                  to="/dashboard"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-3 py-3 text-sm font-medium text-foreground hover:bg-secondary border-t border-border mt-2 pt-3"
                >
                  <LayoutDashboard className="h-4 w-4 text-primary" /> Dashboard
                </Link>
                <Link
                  to="/dashboard/settings"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-3 py-3 text-sm font-medium text-muted-foreground hover:bg-secondary"
                >
                  <Settings className="h-4 w-4" /> Settings
                </Link>
              </>
            )}
            {showPostProperty && (
              <Link to="/post-property" onClick={() => setOpen(false)}>
                <Button className="mt-2 w-full rounded-full bg-foreground text-background">Post Property — FREE</Button>
              </Link>
            )}
            {isAuthenticated ? (
              <button
                onClick={() => {
                  setOpen(false);
                  handleLogout();
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-3 text-sm font-medium text-destructive hover:bg-destructive/10 text-left border-t border-border mt-2 pt-3"
              >
                <LogOut className="h-4 w-4" /> Logout ({user?.name?.split(' ')[0]})
              </button>
            ) : (
              <Link
                to="/auth"
                onClick={() => setOpen(false)}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-3 text-sm font-medium text-primary hover:bg-primary-soft/30 text-left border-t border-border mt-2 pt-3"
              >
                <User className="h-4 w-4" /> Sign in
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

export function MobileTabBar() {
  const { isAuthenticated } = useAuth();
  const items = [
    { to: "/", label: "Home", icon: Home },
    { to: "/explore", label: "Explore", icon: Search },
    { to: "/saved", label: "Saved", icon: Heart },
    { to: isAuthenticated ? "/dashboard" : "/auth", label: isAuthenticated ? "Account" : "Sign in", icon: User },
  ];
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">
      <div className="mx-auto grid max-w-md grid-cols-4">
        {items.map((i) => {
          const isActive = currentPath === i.to;
          return (
            <Link
              key={i.label}
              to={i.to}
              className={`flex flex-col items-center gap-1 px-2 py-3 text-[11px] font-medium transition-colors ${
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <i.icon className="h-5 w-5" />
              {i.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
