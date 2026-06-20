import { useNavigate, useSearchParams } from "react-router-dom";
import { Search, MapPin, Building2, SearchIcon, Loader2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import api from "@/utils/api";

const cities = ["All", "Srinagar", "Jammu", "Gulmarg", "Pahalgam", "Anantnag", "Baramulla", "Udhampur"];

export function SearchBar({ compact = false }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [purpose, setPurpose] = useState(searchParams.get("purpose") || "All");
  const [city, setCity] = useState(searchParams.get("city") || "All");
  const [type, setType] = useState(searchParams.get("type") || "All");

  useEffect(() => {
    setPurpose(searchParams.get("purpose") || "All");
    setCity(searchParams.get("city") || "All");
    setType(searchParams.get("type") || "All");
    setSearchQuery(searchParams.get("search") || "");
  }, [searchParams]);
  
  // Global Search State
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const wrapperRef = useRef(null);

  const purposes = ["Buy", "Rent", "Commercial"];

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Dynamic types based on purpose
  const getTypes = (currentPurpose) => {
    if (currentPurpose === "Commercial") return ["All", "Office", "Industry", "Retail", "Plot / Land"];
    if (currentPurpose === "Buy" || currentPurpose === "Rent") return ["All", "Flat/Apartment", "Independent House / Villa", "Independent / Builder Floor", "Plot / Land"];
    return ["All", "Flat/Apartment", "Independent House / Villa", "Independent / Builder Floor", "Office", "Industry", "Retail", "Plot / Land"];
  };

  const [types, setTypes] = useState(getTypes(purpose));

  useEffect(() => {
    setTypes(getTypes(purpose));
    if(!getTypes(purpose).includes(type)) setType("All");
  }, [purpose]);

  // Debounced Suggestions Fetch
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!searchQuery || searchQuery.length < 2) {
        setSuggestions([]);
        return;
      }
      setLoadingSuggestions(true);
      try {
        const { data } = await api.get(`/properties?search=${searchQuery}&limit=5`);
        if (data.success) {
          setSuggestions(data.data.slice(0, 5)); // Limit to top 5
        }
      } catch (err) {
        console.error("Suggestions error", err);
      } finally {
        setLoadingSuggestions(false);
      }
    };

    const timerId = setTimeout(fetchSuggestions, 300); // 300ms debounce
    return () => clearTimeout(timerId);
  }, [searchQuery]);

  const handleSearch = () => {
    setShowSuggestions(false);
    const params = new URLSearchParams();
    if (purpose !== "All") params.append("purpose", purpose);
    if (city !== "All") params.append("city", city);
    if (type !== "All") params.append("type", type);
    if (searchQuery.trim()) params.append("search", searchQuery.trim());
    
    navigate(`/properties?${params.toString()}`);
  };

  const inputPadding = compact ? "px-4 py-2" : "px-4 py-3";
  const btnSize = compact ? "min-h-[48px] px-5 py-2 text-sm" : "min-h-[56px] px-6 py-4 text-base";

  return (
    <div className={`w-full ${compact ? "rounded-2xl border border-border bg-card shadow-sm p-1.5 transition-all" : "rounded-3xl bg-background/95 p-2 shadow-elevated backdrop-blur-xl"}`}>
      {!compact && (
        <div className="mb-2 flex gap-1 px-2 pt-2">
          {purposes.map((p) => (
            <button
              key={p}
              onClick={() => setPurpose(p)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                purpose === p ? "bg-foreground text-background" : "text-muted-foreground hover:bg-secondary"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-2 md:grid-cols-[1.5fr_1fr_1fr_auto]">
        
        {/* Global Search Input */}
        <div ref={wrapperRef} className="relative">
          <label className={`flex items-center gap-2 rounded-xl border border-border bg-background ${inputPadding} focus-within:border-primary md:border-0 h-full`}>
            <SearchIcon className="h-4 w-4 text-muted-foreground" />
            <div className="flex-1">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Search</div>
              <input
                type="text"
                placeholder="Name, Furnished, Locality..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full bg-transparent text-sm font-medium outline-none placeholder:font-normal placeholder:text-muted-foreground/60"
              />
            </div>
            {loadingSuggestions && <Loader2 className="h-4 w-4 text-primary animate-spin" />}
          </label>

          {/* Suggestions Dropdown */}
          {showSuggestions && searchQuery.length >= 2 && (
            <div className="absolute left-0 right-0 top-full mt-2 z-50 rounded-2xl border border-border bg-background shadow-elevated overflow-hidden py-2">
              {suggestions.length > 0 ? (
                suggestions.map(s => (
                  <button
                    key={s._id}
                    className="w-full text-left px-4 py-2 hover:bg-secondary transition flex flex-col"
                    onClick={() => {
                      setSearchQuery(s.title);
                      setShowSuggestions(false);
                      navigate(`/properties/${s._id}`);
                    }}
                  >
                    <span className="font-semibold text-sm truncate">{s.title}</span>
                    <span className="text-xs text-muted-foreground truncate">{s.city} • {s.type} • {s.furnishing || 'Unfurnished'}</span>
                  </button>
                ))
              ) : !loadingSuggestions ? (
                <div className="px-4 py-3 text-sm text-muted-foreground text-center">No matches found.</div>
              ) : null}
            </div>
          )}
        </div>

        <label className={`flex items-center gap-2 rounded-xl border border-border bg-background ${inputPadding} focus-within:border-primary md:border-0 md:border-l`}>
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <div className="flex-1">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">City</div>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full bg-transparent text-sm font-medium outline-none"
            >
              {cities.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
        </label>

        <label className={`flex items-center gap-2 rounded-xl border border-border bg-background ${inputPadding} focus-within:border-primary md:border-0 md:border-l`}>
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <div className="flex-1">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Property Type</div>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full bg-transparent text-sm font-medium outline-none"
            >
              {types.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>
        </label>

        <Button
          onClick={handleSearch}
          className={`h-full gap-2 rounded-xl bg-primary font-semibold shadow-soft hover:bg-primary/90 ${btnSize}`}
        >
          <Search className="h-4 w-4" /> Search
        </Button>
      </div>
    </div>
  );
}
