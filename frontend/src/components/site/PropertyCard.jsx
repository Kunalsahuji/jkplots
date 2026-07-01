import { Link } from "react-router-dom";
import { MapPin, BadgeCheck, Heart, Eye, Zap } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import api from "@/utils/api";
import { toast } from "sonner";
import { resolveImage, FALLBACK_IMAGE } from "@/utils/resolveImage";

const formatPrice = (val) => {
  if (!val) return "₹—";
  if (typeof val === "string") return val; // Handle mock price strings
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(1)} L`;
  return `₹${val.toLocaleString()}`;
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

  const [imgSrc, setImgSrc] = useState(image);

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
      className={`group flex flex-col h-full overflow-hidden rounded-[20px] transition-all duration-300 ${
        isFeatured
          ? "bg-card border-2 border-primary/10 shadow-md hover:-translate-y-1 hover:shadow-xl hover:border-primary/20"
          : "bg-card border border-border/50 shadow-sm hover:-translate-y-1 hover:shadow-soft"
      }`}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-secondary shrink-0">
        <img
          src={imgSrc}
          alt={title}
          loading="lazy"
          onError={() => setImgSrc(FALLBACK_IMAGE)}
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />
        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {isFeatured && (
            <span className="flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-extrabold text-primary shadow-sm uppercase tracking-wide">
              ⭐ FEATURED
            </span>
          )}
          {(p.verified || p.isActive) && !isFeatured && (
            <span className="flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold text-emerald-600 shadow-sm uppercase tracking-wide">
              <BadgeCheck className="h-3.5 w-3.5" /> VERIFIED
            </span>
          )}
        </div>
        <button
          onClick={handleSaveToggle}
          className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-white/95 transition hover:scale-110 shadow-sm"
          aria-label="Save"
        >
          <Heart className={`h-4 w-4 ${isSaved ? "fill-primary text-primary" : "text-muted-foreground"}`} />
        </button>
      </div>

      <div className="p-4 flex-1 flex flex-col">
        <h3 className="line-clamp-2 font-display text-[17px] font-bold leading-tight text-foreground group-hover:text-primary transition-colors">
          {title}
        </h3>
        <p className="mt-1.5 line-clamp-2 text-[13px] text-muted-foreground leading-relaxed">
          {p.description || `Premium ${type} available in ${area}, ${city} with modern amenities.`}
        </p>
        
        <div className="mt-auto pt-4 flex flex-col gap-2">
          <div className="flex items-baseline gap-1">
            <span className="font-display text-2xl font-black text-primary tracking-tight">{priceLabel}</span>
            <span className="text-sm font-medium text-muted-foreground">
              {p.purpose === "Rent" ? "/month" : ""}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[13px] text-muted-foreground font-medium">
            <MapPin className="h-4 w-4" /> <span className="line-clamp-1">{area}, {city}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
