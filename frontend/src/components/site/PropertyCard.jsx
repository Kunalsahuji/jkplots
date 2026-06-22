import { Link } from "react-router-dom";
import { MapPin, BadgeCheck, Heart, Eye } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import api from "@/utils/api";
import { toast } from "sonner";

const formatPrice = (val) => {
  if (!val) return "₹—";
  if (typeof val === "string") return val; // Handle mock price strings
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(1)} L`;
  return `₹${val.toLocaleString()}`;
};

const resolveImage = (img) => {
  if (!img) return "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80";
  if (img.startsWith("http") || img.startsWith("data:") || img.startsWith("/src/")) return img;
  return `http://localhost:5000${img.startsWith("/") ? "" : "/"}${img}`;
};

export function PropertyCard({ p }) {
  const { user, refreshUser } = useAuth();
  const id = p._id || p.id;
  const isSaved = user?.savedProperties?.some(savedId => savedId === id || savedId?._id === id) || false;
  
  const title = p.title;
  const image = resolveImage(p.photos?.[0] || p.image);
  const area = p.locality || p.area;
  const city = p.city;
  const priceLabel = formatPrice(p.price || p.priceLabel);
  const type = p.type;
  const isFeatured = p.isFeatured && new Date(p.featuredUntil) > new Date();

  // Image error fallback logic
  const [imgSrc, setImgSrc] = useState(image);
  const fallbackImage = "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80";

  const handleSaveToggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      toast.error("Please log in to save properties.");
      return;
    }

    try {
      const { data } = await api.post(`/users/save-property/${id}`);
      if (data.success) {
        toast.success(data.message);
        await refreshUser();
      }
    } catch (err) {
      toast.error("Failed to update shortlist.");
    }
  };

  return (
    <Link
      to={`/properties/${id}`}
      className={`group flex flex-col h-full overflow-hidden rounded-2xl border transition-all duration-300 ${
        isFeatured
          ? "border-amber-400 bg-gradient-to-b from-card to-amber-50/10 dark:to-amber-950/5 shadow-[0_4px_20px_rgba(245,158,11,0.08)] hover:-translate-y-1.5 hover:shadow-[0_12px_24px_rgba(245,158,11,0.18)]"
          : "border-border bg-card hover:-translate-y-1 hover:shadow-md"
      }`}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <img
          src={imgSrc}
          alt={title}
          loading="lazy"
          onError={() => setImgSrc(fallbackImage)}
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />
        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {isFeatured && (
            <span className="flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-500 to-yellow-600 px-2.5 py-0.5 text-[10px] font-bold text-white shadow-md uppercase tracking-wider animate-pulse">
              ★ Featured
            </span>
          )}
          {(p.verified || p.isActive) && (
            <span className="flex items-center gap-0.5 rounded-full bg-emerald-500/90 backdrop-blur-sm px-2.5 py-0.5 text-[10px] font-semibold text-white shadow-sm">
              <BadgeCheck className="h-3 w-3" /> Verified
            </span>
          )}
        </div>
        <button
          onClick={handleSaveToggle}
          className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-background/90 backdrop-blur-md transition hover:scale-110 shadow-md"
          aria-label="Save"
        >
          <Heart className={`h-4 w-4 ${isSaved ? "fill-destructive text-destructive" : "text-foreground"}`} />
        </button>
      </div>

      <div className="space-y-2 p-4 flex-1 flex flex-col">
        <h3 className="line-clamp-1 font-display text-sm font-semibold leading-tight text-foreground/90 group-hover:text-primary transition-colors">
          {title}
        </h3>
        <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 text-muted-foreground/70" /> <span className="line-clamp-1">{area}, {city}</span>
        </p>
        <div className="flex items-center justify-between gap-1.5 pt-2 mt-auto border-t border-border/60">
          <div className={`font-display text-[15px] whitespace-nowrap font-extrabold ${isFeatured ? "text-amber-600 dark:text-amber-400" : "text-primary"}`}>
            {priceLabel}
          </div>
          <div className="flex items-center gap-1.5 min-w-0 justify-end">
            {p.views !== undefined && (
               <span className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium bg-secondary/80 px-1.5 py-0.5 rounded-md shrink-0" title={`${p.views} Views`}>
                 <Eye className="h-3 w-3" /> {p.views}
               </span>
            )}
            <span 
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap truncate max-w-[90px] sm:max-w-[110px] ${
                isFeatured 
                  ? "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                  : "bg-primary-soft text-primary"
              }`}
              title={type}
            >
              {type}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
