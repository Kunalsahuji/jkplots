import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, Search, Heart, User, Menu, X, Plus, LogOut } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

const nav = [
  { to: "/", label: "Home" },
  { to: "/explore", label: "Explore" },
  { to: "/properties?purpose=Buy", label: "Buy" },
  { to: "/properties?purpose=Rent", label: "Rent" },
  { to: "/properties?purpose=Commercial", label: "Commercial" },
  { to: "/dashboard", label: "Dashboard" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname + location.search;

  const { user, isAuthenticated, logout } = useAuth();
  const showPostProperty = isAuthenticated && user?.role === "dealer";

  const handleLogout = async () => {
    await logout();
    navigate("/", { replace: true });
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/85 backdrop-blur-xl">
      <div className="container-px mx-auto flex h-16 max-w-7xl items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-hero text-primary-foreground shadow-soft">
            <Home className="h-4 w-4" />
          </span>
          <span className="font-display text-xl font-bold tracking-tight">
            JK<span className="text-primary">PLOT</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {nav.map((n) => {
            const isActive = currentPath === n.to || (n.to !== "/" && currentPath.startsWith(n.to));
            return (
              <Link
                key={n.label}
                to={n.to}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-secondary hover:text-foreground ${
                  isActive ? "text-foreground bg-secondary" : "text-muted-foreground"
                }`}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <>
              <Link to="/dashboard" className="hidden items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground sm:inline-flex">
                <User className="h-4 w-4" /> {user?.name?.split(' ')[0]}
              </Link>
              <button
                onClick={handleLogout}
                className="hidden items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:border-destructive hover:text-destructive sm:inline-flex"
              >
                <LogOut className="h-3.5 w-3.5" /> Logout
              </button>
            </>
          ) : (
            <Link to="/auth" className="hidden text-sm font-medium text-muted-foreground hover:text-foreground sm:inline">
              Sign in
            </Link>
          )}
          {showPostProperty && (
            <Link to="/post-property" className="hidden sm:inline-flex">
              <Button className="gap-1.5 rounded-full bg-foreground text-background hover:bg-foreground/90">
                <Plus className="h-4 w-4" /> Post Property <span className="ml-1 rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-semibold text-accent-foreground">FREE</span>
              </Button>
            </Link>
          )}
          <button
            onClick={() => setOpen(!open)}
            className="grid h-10 w-10 place-items-center rounded-lg border border-border lg:hidden"
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
                    isActive ? "text-foreground bg-secondary" : "text-muted-foreground"
                  }`}
                >
                  {n.label}
                </Link>
              );
            })}
            {showPostProperty && (
              <Link to="/post-property" onClick={() => setOpen(false)}>
                <Button className="mt-2 w-full rounded-full bg-foreground text-background">Post Property — FREE</Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

export function MobileTabBar() {
  const items = [
    { to: "/", label: "Home", icon: Home },
    { to: "/explore", label: "Explore", icon: Search },
    { to: "/saved", label: "Saved", icon: Heart },
    { to: "/dashboard", label: "Account", icon: User },
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
