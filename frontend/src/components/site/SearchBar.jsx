import { useNavigate } from "react-router-dom";
import { Search, MapPin, Building2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const cities = ["Srinagar", "Jammu", "Gulmarg", "Pahalgam", "Anantnag", "Baramulla", "Udhampur"];
const types = ["Any", "Villa", "Apartment", "Plot", "Commercial"];

export function SearchBar({ compact = false }) {
  const navigate = useNavigate();
  const [purpose, setPurpose] = useState("Buy");
  const [city, setCity] = useState("Srinagar");
  const [type, setType] = useState("Any");

  const purposes = ["Buy", "Rent", "Commercial"];

  const handleSearch = () => {
    const params = new URLSearchParams();
    params.append("purpose", purpose);
    params.append("city", city);
    if (type !== "Any") {
      params.append("type", type);
    }
    navigate(`/properties?${params.toString()}`);
  };

  return (
    <div className={`w-full ${compact ? "" : "rounded-3xl bg-background/95 p-2 shadow-elevated backdrop-blur-xl"}`}>
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

      <div className="grid grid-cols-1 gap-2 md:grid-cols-[1.2fr_1fr_auto]">
        <label className="flex items-center gap-2 rounded-2xl border border-border bg-background px-4 py-3 focus-within:border-primary md:border-0">
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

        <label className="flex items-center gap-2 rounded-2xl border border-border bg-background px-4 py-3 focus-within:border-primary md:border-0 md:border-l">
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
          size="lg"
          onClick={handleSearch}
          className="h-auto gap-2 rounded-2xl bg-primary px-6 py-4 text-base font-semibold shadow-soft hover:bg-primary/90"
        >
          <Search className="h-4 w-4" /> Search
        </Button>
      </div>
    </div>
  );
}
