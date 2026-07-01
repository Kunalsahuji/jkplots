import { useSearchParams, Link } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Building2,
  Home,
  Store,
  KeyRound,
  Hotel,
  LandPlot,
  TrendingUp,
  Eye,
  Heart,
  MessageSquare,
  ArrowUpRight,
  MapPin,
  Search,
  BadgeCheck,
  Sparkles,
  Filter,
  ChevronRight,
  IndianRupee,
  Users,
  Activity,
  ChevronLeft,
} from "lucide-react";
import { cities, formatINR } from "@/utils/properties";
import { PropertyCard } from "@/components/site/PropertyCard";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import api from "@/utils/api";
import catBuy from "@/assets/cat-buy.jpg";
import catRent from "@/assets/cat-rent.jpg";
import catLand from "@/assets/cat-land.jpg";
import catCommercial from "@/assets/cat-commercial.jpg";
import heroImg from "@/assets/hero-kashmir.jpg";

const categories = [
  {
    id: "residential",
    label: "Residential",
    icon: Home,
    desc: "Villas, apartments & homes",
    accent: "from-primary/15 to-primary/0",
    image: catBuy,
    match: (p) => p.type === "Independent House / Villa" || p.type === "Flat/Apartment" || p.type === "Independent / Builder Floor",
    subs: [
      { id: "villa", label: "Villas", match: (p) => p.type === "Independent House / Villa" },
      { id: "apartment", label: "Apartments", match: (p) => p.type === "Flat/Apartment" },
      { id: "furnished", label: "Furnished", match: (p) => p.furnishing === "Furnished" },
      { id: "ready", label: "Ready to Move", match: (p) => true },
    ],
  },
  {
    id: "plots",
    label: "Plots & Land",
    icon: LandPlot,
    desc: "Residential & agricultural land",
    accent: "from-accent/20 to-accent/0",
    image: catLand,
    match: (p) => p.type === "Plot / Land",
    subs: [
      { id: "all", label: "All Plots", match: (p) => p.type === "Plot / Land" },
      { id: "mountain", label: "Mountain View", match: (p) => p.amenities && p.amenities.some((a) => /mountain/i.test(a)) },
    ],
  },
  {
    id: "commercial",
    label: "Commercial",
    icon: Store,
    desc: "Shops, offices & showrooms",
    accent: "from-info/15 to-info/0",
    image: catCommercial,
    match: (p) => p.purpose === "Commercial" || p.type === "Office" || p.type === "Industry" || p.type === "Retail",
    subs: [
      { id: "all", label: "All Commercial", match: (p) => p.purpose === "Commercial" },
      { id: "showroom", label: "Showrooms", match: (p) => /showroom|glass|retail/i.test(p.title) || p.type === "Retail" },
    ],
  },
  {
    id: "rent",
    label: "Rentals",
    icon: KeyRound,
    desc: "Monthly rental properties",
    accent: "from-success/15 to-success/0",
    image: catRent,
    match: (p) => p.purpose === "Rent",
    subs: [
      { id: "all", label: "All Rentals", match: (p) => p.purpose === "Rent" },
      { id: "furnished", label: "Furnished", match: (p) => p.purpose === "Rent" && p.furnishing === "Furnished" },
    ],
  },
  {
    id: "luxury",
    label: "Luxury & Heritage",
    icon: Hotel,
    desc: "Premium estates & chalets",
    accent: "from-accent/20 to-primary/10",
    image: heroImg,
    match: (p) => p.price >= 20000000 || /heritage|chalet|wooden|luxury/i.test(p.title),
    subs: [
      { id: "all", label: "All Luxury", match: (p) => p.price >= 20000000 },
      { id: "chalet", label: "Chalets", match: (p) => /chalet|heritage|wooden/i.test(p.title) },
    ],
  },
];

export default function ExplorePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const category = searchParams.get("category") || "all";
  const sub = searchParams.get("sub") || "all";

  const [dbProperties, setDbProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination & Sorting States
  const [sort, setSort] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const [cart, setCart] = useState([]);
  const resultsRef = useRef(null);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const { data } = await api.get("/properties?limit=500");
        if (data.success) {
          setDbProperties(data.data);
        }
      } catch (err) {
        toast.error("Failed to fetch explore properties");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  useEffect(() => {
    if (category !== "all" && resultsRef.current) {
      const top = resultsRef.current.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top, behavior: "smooth" });
    }
    setCurrentPage(1); // Reset page on category change
  }, [category, sub]);

  const active = categories.find((c) => c.id === category);
  
  const filtered = useMemo(() => {
    let list = [...dbProperties];
    if (active) list = list.filter(active.match);
    if (active && sub !== "all") {
      const s = active.subs.find((x) => x.id === sub);
      if (s) list = list.filter(s.match);
    }

    // Sorting
    if (sort === "price-asc") {
      list.sort((a, b) => a.price - b.price);
    } else if (sort === "price-desc") {
      list.sort((a, b) => b.price - a.price);
    } else if (sort === "newest") {
      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    return list;
  }, [dbProperties, active, sub, sort]);

  // Pagination Slice
  const paginatedResults = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, currentPage]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  // Analytics computed from data
  const stats = useMemo(() => {
    if (dbProperties.length === 0) return { total: 0, avg: 0, verified: 0, featured: 0 };
    const total = dbProperties.length;
    const avg = Math.round(dbProperties.reduce((a, b) => a + (b.price || 0), 0) / total);
    const verified = dbProperties.filter((p) => p.verified).length;
    const featured = dbProperties.filter((p) => p.isFeatured && new Date(p.featuredUntil) > new Date()).length;
    return { total, avg, verified, featured };
  }, [dbProperties]);

  const cityStats = useMemo(
    () =>
      cities.map((c) => ({
        ...c,
        count: dbProperties.filter((p) => p.city === c.name).length,
      })),
    [dbProperties]
  );

  const trending = useMemo(() => [...dbProperties].sort((a, b) => b.price - a.price).slice(0, 4), [dbProperties]);

  const toggleCart = (id) => {
    setCart((prev) => {
      const exists = prev.includes(id);
      const next = exists ? prev.filter((x) => x !== id) : [...prev, id];
      toast.success(exists ? "Removed from compare" : "Added to compare", {
        description: exists ? "Property removed from your compare cart." : `${next.length} items in compare cart.`,
      });
      return next;
    });
  };

  const handleCategoryClick = (id) => {
    const isSame = category === id;
    if (isSame) {
      setSearchParams({});
    } else {
      setSearchParams({ category: id, sub: "all" });
    }
  };

  return (
    <div className="bg-background">
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-br from-primary/8 via-background to-accent/5">
        <div className="container-px mx-auto max-w-7xl py-10 md:py-16">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
                <Sparkles className="h-3.5 w-3.5 text-primary" /> 
                Explore J&K Real Estate
              </div>
              <h1 className="mt-3 font-display text-3xl font-bold leading-tight md:text-5xl">
                Find your next property by <span className="text-primary">category</span>
              </h1>
              <p className="mt-3 text-muted-foreground md:text-lg">
                Browse residential, commercial, plots, rentals and luxury homes — with live market insights from across Jammu & Kashmir.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link to="/properties">
                <Button variant="outline" className="rounded-full">
                  <Search className="mr-1.5 h-4 w-4" /> Advanced Search
                </Button>
              </Link>
              <Link to="/post-property">
                <Button className="rounded-full bg-foreground text-background hover:bg-foreground/90">Post Property</Button>
              </Link>
            </div>
          </div>

          {/* KPIs */}
          <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              { icon: Building2, label: "Listings", value: stats.total.toLocaleString() },
              { icon: BadgeCheck, label: "Verified", value: stats.verified.toLocaleString() },
              { icon: IndianRupee, label: "Avg. Price", value: formatINR(stats.avg) },
              { icon: TrendingUp, label: "Featured", value: stats.featured.toLocaleString() },
            ].map((k) => (
              <div key={k.label} className="rounded-2xl border border-border bg-card p-4 shadow-soft">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <k.icon className="h-3.5 w-3.5" /> {k.label}
                </div>
                <div className="mt-1.5 font-display text-2xl font-bold">{k.value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="container-px mx-auto max-w-7xl py-10">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold md:text-3xl">Browse by Category</h2>
            <p className="text-sm text-muted-foreground">Tap a category to drill into subcategories</p>
          </div>
          {category !== "all" && (
            <button
              onClick={() => setSearchParams({})}
              className="text-sm font-medium text-primary hover:underline"
            >
              Clear
            </button>
          )}
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
          {categories.map((c) => {
            const isActive = category === c.id;
            const count = dbProperties.filter(c.match).length;
            return (
              <button
                key={c.id}
                onClick={() => handleCategoryClick(c.id)}
                className={`group relative overflow-hidden rounded-2xl border text-left transition-all hover:-translate-y-1 hover:shadow-elevated ${
                  isActive ? "border-primary ring-2 ring-primary/30" : "border-border"
                }`}
              >
                <div className="relative aspect-[4/5] w-full overflow-hidden bg-muted">
                  <img
                    src={c.image}
                    alt={c.label}
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-foreground/90 via-foreground/30 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-3 text-background">
                    <div className="mb-1.5 inline-grid h-8 w-8 place-items-center rounded-lg bg-background/95 text-primary shadow-soft">
                      <c.icon className="h-4 w-4" />
                    </div>
                    <h3 className="font-display text-sm font-bold leading-tight md:text-base">{c.label}</h3>
                    <p className="text-[10px] text-background/80 md:text-[11px]">{c.desc}</p>
                    <div className="mt-1.5 flex items-center justify-between text-[10px] font-medium text-background/90">
                      <span>{count} listings</span>
                      <ChevronRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* SUBCATEGORIES */}
        {active && (
          <div className="mt-6 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <Filter className="h-3.5 w-3.5" /> Subcategories:
            </span>
            <button
              onClick={() => setSearchParams({ category: active.id, sub: "all" })}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                sub === "all"
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card hover:bg-secondary"
              }`}
            >
              All ({dbProperties.filter(active.match).length})
            </button>
            {active.subs.map((s) => {
              const cnt = dbProperties.filter((p) => active.match(p) && s.match(p)).length;
              const sel = sub === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setSearchParams({ category: active.id, sub: s.id })}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                    sel
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card hover:bg-secondary"
                  }`}
                >
                  {s.label} ({cnt})
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* RESULTS + COMPARE CART */}
      <section ref={resultsRef} className="container-px mx-auto max-w-7xl pb-10 pt-2 scroll-mt-20">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="font-display text-2xl font-bold md:text-3xl">
            {active ? active.label : "All Properties"}
            <span className="ml-2 text-base font-medium text-muted-foreground">({filtered.length})</span>
          </h2>
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="rounded-full border border-border bg-card px-4 py-2 text-sm font-medium outline-none transition focus:border-primary"
            >
              <option value="newest">Newest first</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
            {cart.length > 0 && (
              <Link
                to={`/properties?compare=${cart.join(",")}`}
                className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background transition hover:bg-foreground/90"
              >
                Compare {cart.length} <ArrowUpRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        </div>

        {loading ? (
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-3xl border border-border bg-card p-4">
                <div className="aspect-[4/3] w-full rounded-2xl bg-secondary" />
                <div className="mt-4 h-6 w-2/3 rounded bg-secondary" />
                <div className="mt-2 h-4 w-1/3 rounded bg-secondary" />
                <div className="mt-4 flex gap-2">
                  <div className="h-8 w-1/4 rounded-full bg-secondary" />
                  <div className="h-8 w-1/4 rounded-full bg-secondary" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-border bg-card p-10 text-center">
            <p className="text-muted-foreground">No properties in this subcategory yet.</p>
          </div>
        ) : (
          <>
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {paginatedResults.map((p) => (
                <div key={p._id || p.id} className="relative">
                  <PropertyCard p={p} />
                  <button
                    onClick={() => toggleCart(p._id || p.id)}
                    className={`absolute left-2 top-2 z-10 rounded-full px-2 py-0.5 text-[10px] font-semibold shadow-soft transition ${
                      cart.includes(p._id || p.id)
                        ? "bg-primary text-primary-foreground"
                        : "bg-background/95 text-foreground hover:bg-background"
                    }`}
                  >
                    {cart.includes(p._id || p.id) ? "✓ In Compare" : "+ Compare"}
                  </button>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 rounded-full"
                  disabled={currentPage === 1}
                  onClick={() => {
                    setCurrentPage((p) => Math.max(1, p - 1));
                    resultsRef.current?.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setCurrentPage(i + 1);
                        resultsRef.current?.scrollIntoView({ behavior: "smooth" });
                      }}
                      className={`h-10 w-10 rounded-full text-sm font-medium transition ${
                        currentPage === i + 1
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-secondary"
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>

                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 rounded-full"
                  disabled={currentPage === totalPages}
                  onClick={() => {
                    setCurrentPage((p) => Math.min(totalPages, p + 1));
                    resultsRef.current?.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </section>

      {/* CITY ANALYTICS */}
      <section className="border-t border-border bg-secondary/40">
        <div className="container-px mx-auto max-w-7xl py-10">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="font-display text-2xl font-bold md:text-3xl">City Insights</h2>
              <p className="text-sm text-muted-foreground">Listing distribution across J&K cities</p>
            </div>
            <Activity className="h-5 w-5 text-primary" />
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {cityStats.map((c) => {
              const max = Math.max(...cityStats.map((x) => x.count), 1);
              const pct = (c.count / max) * 100;
              return (
                <Link
                  key={c.name}
                  to={`/properties?city=${c.name}`}
                  className="group overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition hover:-translate-y-1 hover:shadow-card"
                >
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <img src={c.image} alt={c.name} className="h-full w-full object-cover transition group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 to-transparent" />
                    <div className="absolute bottom-2 left-3 right-3 text-background">
                      <div className="flex items-center justify-between">
                        <span className="font-display text-lg font-bold">{c.name}</span>
                        <span className="text-xs">{c.count} listings</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-3">
                    <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                      <div className="h-full rounded-full bg-gradient-to-r from-primary to-accent" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* TRENDING */}
      <section className="container-px mx-auto max-w-7xl py-10">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="flex items-center gap-2 font-display text-2xl font-bold md:text-3xl">
              <TrendingUp className="h-6 w-6 text-primary" /> Trending Now
            </h2>
            <p className="text-sm text-muted-foreground">Highest-value picks this week</p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {trending.map((p, i) => (
            <Link
              key={p._id || p.id}
              to={`/properties/${p._id || p.id}`}
              className="group flex gap-3 overflow-hidden rounded-2xl border border-border bg-card p-3 transition hover:-translate-y-0.5 hover:shadow-card"
            >
              <div className="relative h-24 w-32 flex-none overflow-hidden rounded-xl">
                <img src={p.photos?.[0] || p.image} alt={p.title} className="h-full w-full object-cover transition group-hover:scale-105" />
                <span className="absolute left-1.5 top-1.5 rounded-full bg-foreground/85 px-1.5 py-0.5 text-[10px] font-bold text-background">
                  #{i + 1}
                </span>
              </div>
              <div className="flex flex-1 flex-col justify-between py-1">
                <div>
                  <h3 className="line-clamp-1 font-display font-semibold">{p.title}</h3>
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" /> {p.area} sq.ft., {p.city}
                  </p>
                </div>
                <div className="flex items-end justify-between">
                  <div className="font-display text-lg font-bold text-primary">{p.priceLabel || formatINR(p.price)}</div>
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span className="inline-flex items-center gap-0.5">
                      <Eye className="h-3 w-3" /> {p.views || 0}
                    </span>
                    <span className="inline-flex items-center gap-0.5">
                      <Heart className="h-3 w-3" /> {p.likes || 0}
                    </span>
                    <span className="inline-flex items-center gap-0.5">
                      <MessageSquare className="h-3 w-3" /> {p.reviews?.length || p.enquiriesCount || 0}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container-px mx-auto max-w-7xl pb-16">
        <div className="overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary to-primary/80 p-8 text-primary-foreground md:p-12">
          <div className="flex flex-col items-start gap-5 md:flex-row md:items-center md:justify-between">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-primary-foreground/15 px-3 py-1 text-[11px] font-semibold">
                <Users className="h-3 w-3" /> 10,000+ buyers this month
              </div>
              <h2 className="mt-2 font-display text-2xl font-bold md:text-3xl">List your property, reach verified buyers.</h2>
              <p className="mt-1 text-sm opacity-90">Free posting · Verified leads · Dedicated dealer dashboard.</p>
            </div>
            <Link to="/post-property">
              <Button className="rounded-full bg-background text-foreground hover:bg-background/90">Post Property — Free</Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
