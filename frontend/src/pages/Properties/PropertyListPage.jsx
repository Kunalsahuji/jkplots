import { useSearchParams } from "react-router-dom";
import { useMemo, useState, useEffect } from "react";
import { PropertyCard } from "@/components/site/PropertyCard";
import { SearchBar } from "@/components/site/SearchBar";
import { SlidersHorizontal, LayoutGrid, List, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProperties } from "@/hooks/useProperties";
import { motion, AnimatePresence } from "framer-motion";
import { useDebounce } from "@/hooks/useDebounce";
import { PropertyCardSkeleton } from "@/components/site/Skeletons";

const cityOpts = ["All", "Srinagar", "Jammu", "Gulmarg", "Pahalgam", "Anantnag", "Baramulla", "Udhampur"];
const bedroomOpts = ["Any", "1+", "2+", "3+", "4+"];

export default function PropertyListPage() {
  const [searchParams] = useSearchParams();
  const [view, setView] = useState("grid");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [city, setCity] = useState("All");
  const [type, setType] = useState("All");
  const [purpose, setPurpose] = useState("All");
  const [beds, setBeds] = useState("Any");
  const [budget, setBudget] = useState(50000000);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [furnished, setFurnished] = useState(false);
  const [sort, setSort] = useState("relevance");

  // Pagination state
  const [page, setPage] = useState(1);
  const limit = 6; // 6 items per page fits a 3-column layout nicely

  // Dynamic types based on purpose
  const typeOpts = useMemo(() => {
    if (purpose === "Commercial") {
      return ["All", "Office", "Industry", "Retail", "Plot / Land"];
    }
    if (purpose === "Buy" || purpose === "Rent") {
      return ["All", "Flat/Apartment", "Independent House / Villa", "Independent / Builder Floor", "Plot / Land"];
    }
    return ["All", "Flat/Apartment", "Independent House / Villa", "Independent / Builder Floor", "Office", "Industry", "Retail", "Plot / Land"];
  }, [purpose]);

  // Reset type if current type is not valid for the new purpose
  useEffect(() => {
    if (type !== "All" && !typeOpts.includes(type)) {
      setType("All");
    }
  }, [purpose, type, typeOpts]);

  useEffect(() => {
    const cityParam = searchParams.get("city");
    const purposeParam = searchParams.get("purpose");
    const typeParam = searchParams.get("type");

    if (cityParam && cityParam !== "All") setCity(cityParam);
    if (purposeParam && purposeParam !== "All") setPurpose(purposeParam);
    if (typeParam && typeParam !== "Any" && typeParam !== "All") setType(typeParam);
  }, [searchParams]);

  // Reset to first page when any search parameter or filter changes
  useEffect(() => {
    setPage(1);
  }, [city, type, purpose, beds, budget, sort, searchParams, verifiedOnly, furnished]);

  // Prevent background body scrolling when mobile filter drawer is active
  useEffect(() => {
    if (filtersOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [filtersOpen]);

  // Debounce the budget range slider value to avoid hitting backend API on every scroll step
  const debouncedBudget = useDebounce(budget, 350);

  // Compute API query filters
  const apiParams = useMemo(() => {
    const params = { page, limit };
    const searchParam = searchParams.get("search");
    if (searchParam) params.search = searchParam;
    
    if (city !== "All") params.city = city;
    if (type !== "All") params.type = type;
    if (purpose !== "All") params.purpose = purpose;
    if (beds !== "Any") params.bedrooms = parseInt(beds);
    
    // Budget limit (debounced)
    params["price[lte]"] = debouncedBudget;

    if (sort === "price-asc") params.sort = "price";
    if (sort === "price-desc") params.sort = "-price";

    return params;
  }, [city, type, purpose, beds, debouncedBudget, sort, searchParams, page]);

  // Query properties using React Query hook
  const { data: propertiesData, isLoading } = useProperties(apiParams);

  const dbProperties = propertiesData?.data || [];
  const pagination = propertiesData?.pagination || null;

  const filtered = useMemo(() => {
    let list = dbProperties;
    if (verifiedOnly) list = list.filter((p) => p.verified);
    if (furnished) list = list.filter((p) => p.furnishing === "Furnished");
    return list;
  }, [dbProperties, verifiedOnly, furnished]);

  const handleReset = () => {
    setCity("All");
    setType("All");
    setPurpose("All");
    setBeds("Any");
    setBudget(50000000);
    setVerifiedOnly(false);
    setFurnished(false);
    setPage(1);
  };

  const Filters = (
    <div className="space-y-6">
      <FilterGroup label="Purpose">
        <Chips opts={["All", "Buy", "Rent", "Commercial"]} value={purpose} onChange={setPurpose} />
      </FilterGroup>
      <FilterGroup label="City">
        <Chips opts={cityOpts} value={city} onChange={setCity} />
      </FilterGroup>
      <FilterGroup label="Property type">
        <Chips opts={typeOpts} value={type} onChange={setType} />
      </FilterGroup>
      <FilterGroup label="Bedrooms">
        <Chips opts={bedroomOpts} value={beds} onChange={setBeds} />
      </FilterGroup>
      <FilterGroup label={`Max budget — ₹${(budget / 10000000).toFixed(2)} Cr`}>
        <input
          type="range"
          min={1000000}
          max={50000000}
          step={500000}
          value={budget}
          onChange={(e) => setBudget(+e.target.value)}
          className="w-full accent-primary"
        />
      </FilterGroup>
      <FilterGroup label="More">
        <div className="space-y-2">
          <Toggle checked={verifiedOnly} onChange={setVerifiedOnly} label="Verified only" />
          <Toggle checked={furnished} onChange={setFurnished} label="Furnished" />
        </div>
      </FilterGroup>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="bg-secondary/30"
    >
      <div className="border-b border-border bg-background">
        <div className="container-px mx-auto max-w-7xl py-6">
          <SearchBar compact />
        </div>
      </div>

      <div className="container-px mx-auto grid max-w-7xl gap-8 py-8 lg:grid-cols-[280px_1fr]">
        {/* Sidebar */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 rounded-2xl border border-border bg-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold">Filters</h3>
              <button onClick={handleReset} className="text-xs font-medium text-primary hover:underline">
                Reset
              </button>
            </div>
            {Filters}
          </div>
        </aside>

        {/* Results */}
        <div>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="font-display text-2xl font-bold">Properties in J&amp;K</h1>
              <p className="text-sm text-muted-foreground">
                {isLoading ? "Loading..." : `${filtered.length} listings this page`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFiltersOpen(true)}
                className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium lg:hidden"
              >
                <SlidersHorizontal className="h-4 w-4" /> Filters
              </button>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="rounded-full border border-border bg-card px-4 py-2 text-sm font-medium"
              >
                <option value="relevance">Most relevant</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
              </select>
              <div className="hidden rounded-full border border-border bg-card p-1 sm:flex">
                <button
                  onClick={() => setView("grid")}
                  className={`grid h-8 w-8 place-items-center rounded-full ${
                    view === "grid" ? "bg-foreground text-background" : "text-muted-foreground"
                  }`}
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setView("list")}
                  className={`grid h-8 w-8 place-items-center rounded-full ${
                    view === "list" ? "bg-foreground text-background" : "text-muted-foreground"
                  }`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className={view === "grid" ? "grid gap-5 sm:grid-cols-2 xl:grid-cols-3" : "space-y-5"}>
              {Array.from({ length: limit }).map((_, i) => (
                <PropertyCardSkeleton key={i} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
              <h3 className="font-display text-xl font-semibold">No properties match your filters</h3>
              <p className="mt-2 text-sm text-muted-foreground">Try widening your search or resetting filters.</p>
            </div>
          ) : (
            <>
              <div className={view === "grid" ? "grid gap-5 sm:grid-cols-2 xl:grid-cols-3" : "space-y-5"}>
                {filtered.map((p) => (
                  <PropertyCard key={p._id || p.id} p={p} />
                ))}
              </div>

              {/* Server-side Pagination Navigation */}
              {pagination && pagination.totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                    disabled={page === 1}
                    className="rounded-full"
                  >
                    <ChevronLeft className="mr-1 h-4 w-4" /> Prev
                  </Button>
                  <span className="text-xs font-semibold text-muted-foreground">
                    Page {page} of {pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((prev) => Math.min(prev + 1, pagination.totalPages))}
                    disabled={page === pagination.totalPages}
                    className="rounded-full"
                  >
                    Next <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Mobile filters drawer */}
      <AnimatePresence>
        {filtersOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setFiltersOpen(false)}
              className="absolute inset-0 bg-foreground/35 backdrop-blur-sm"
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="absolute inset-y-0 right-0 flex h-full w-full max-w-sm flex-col bg-background shadow-2xl border-l border-border"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border px-6 py-4">
                <div>
                  <h3 className="font-display text-lg font-bold">Filters</h3>
                  <p className="text-xs text-muted-foreground">Narrow down your results</p>
                </div>
                <button
                  onClick={() => setFiltersOpen(false)}
                  className="grid h-9 w-9 place-items-center rounded-full border border-border hover:bg-secondary transition"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Scrollable Filters Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active Filters</span>
                  <button onClick={handleReset} className="text-xs font-semibold text-primary hover:underline">
                    Reset All
                  </button>
                </div>
                {Filters}
              </div>

              {/* Footer CTA */}
              <div className="border-t border-border p-6 bg-secondary/10">
                <Button onClick={() => setFiltersOpen(false)} className="w-full rounded-full bg-primary py-6 text-sm font-semibold shadow-md">
                  Show {filtered.length} results
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function FilterGroup({ label, children }) {
  return (
    <div>
      <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
      {children}
    </div>
  );
}

function Chips({ opts, value, onChange }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {opts.map((o) => (
        <button
          key={o}
          onClick={() => onChange(o)}
          className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
            value === o ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:border-primary"
          }`}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

function Toggle({ checked, onChange, label }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 text-sm">
      <span>{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative h-5 w-9 rounded-full transition ${checked ? "bg-primary" : "bg-border"}`}
      >
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-background transition-all ${checked ? "left-4" : "left-0.5"}`} />
      </button>
    </label>
  );
}
