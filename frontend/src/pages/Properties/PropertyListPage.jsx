import { useSearchParams } from "react-router-dom";
import { useMemo, useState, useEffect } from "react";
import { PropertyCard } from "@/components/site/PropertyCard";
import { properties } from "@/utils/properties";
import { SearchBar } from "@/components/site/SearchBar";
import { SlidersHorizontal, LayoutGrid, List, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import api from "@/utils/api";

const cityOpts = ["All", "Srinagar", "Jammu", "Gulmarg", "Pahalgam"];
const typeOpts = ["All", "Villa", "Apartment", "Plot", "Commercial"];
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

  const [dbProperties, setDbProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchParams = {};
    const cityParam = searchParams.get("city");
    const purposeParam = searchParams.get("purpose");
    const typeParam = searchParams.get("type");

    if (cityParam && cityParam !== "All") setCity(cityParam);
    if (purposeParam && purposeParam !== "All") setPurpose(purposeParam);
    if (typeParam && typeParam !== "Any" && typeParam !== "All") setType(typeParam);
  }, [searchParams]);

  useEffect(() => {
    const fetchListings = async () => {
      setLoading(true);
      try {
        const params = {};
        if (city !== "All") params.city = city;
        if (type !== "All") params.type = type;
        if (purpose !== "All") params.purpose = purpose;
        if (beds !== "Any") params.bedrooms = parseInt(beds);
        
        // Budget limit
        params["price[lte]"] = budget;

        if (sort === "price-asc") params.sort = "price";
        if (sort === "price-desc") params.sort = "-price";

        const { data } = await api.get("/properties", { params });
        if (data.success) {
          setDbProperties(data.data);
        }
      } catch (err) {
        console.error("Failed to load listings:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchListings();
  }, [city, type, purpose, beds, budget, sort]);

  const filtered = useMemo(() => {
    let list = dbProperties;
    if (verifiedOnly) list = list.filter((p) => p.verified);
    if (furnished) list = list.filter((p) => p.furnished);
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
    <div className="bg-secondary/30">
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
              <p className="text-sm text-muted-foreground">{filtered.length} results</p>
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

          {loading ? (
            <div className={view === "grid" ? "grid gap-5 sm:grid-cols-2 xl:grid-cols-3" : "space-y-5"}>
              {Array.from({ length: 6 }).map((_, i) => (
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
            <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
              <h3 className="font-display text-xl font-semibold">No properties match your filters</h3>
              <p className="mt-2 text-sm text-muted-foreground">Try widening your search or resetting filters.</p>
            </div>
          ) : (
            <div className={view === "grid" ? "grid gap-5 sm:grid-cols-2 xl:grid-cols-3" : "space-y-5"}>
              {filtered.map((p) => (
                <PropertyCard key={p._id || p.id} p={p} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile filters drawer */}
      {filtersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-foreground/50" onClick={() => setFiltersOpen(false)} />
          <div className="absolute inset-y-0 right-0 w-full max-w-sm overflow-y-auto bg-background p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-xl font-bold">Filters</h3>
              <button
                onClick={() => setFiltersOpen(false)}
                className="grid h-9 w-9 place-items-center rounded-full border border-border"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {Filters}
            <Button onClick={() => setFiltersOpen(false)} className="mt-6 w-full rounded-full bg-primary">
              Show {filtered.length} results
            </Button>
          </div>
        </div>
      )}
    </div>
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
