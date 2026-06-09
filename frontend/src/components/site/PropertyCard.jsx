import { Link } from "react-router-dom";
import { MapPin, BadgeCheck, Heart } from "lucide-react";
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
  if (img.startsWith("http") || img.startsWith("data:")) return img;
  return `http://localhost:5000${img}`;
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
      className="group block overflow-hidden rounded-xl border border-border bg-card transition-all hover:-translate-y-0.5 hover:shadow-card"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <img
          src={image}
          alt={title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute left-2 top-2 flex gap-1.5">
          {(p.verified || p.isActive) && (
            <span className="flex items-center gap-0.5 rounded-full bg-success px-2 py-0.5 text-[10px] font-semibold text-success-foreground">
              <BadgeCheck className="h-2.5 w-2.5" /> Verified
            </span>
          )}
          {p.featured && (
            <span className="rounded-full bg-gradient-accent px-2 py-0.5 text-[10px] font-bold text-accent-foreground">
              ★
            </span>
          )}
        </div>
        <button
          onClick={handleSaveToggle}
          className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-background/90 backdrop-blur transition hover:scale-110"
          aria-label="Save"
        >
          <Heart className={`h-3.5 w-3.5 ${isSaved ? "fill-destructive text-destructive" : "text-foreground"}`} />
        </button>
      </div>

      <div className="space-y-1.5 p-3">
        <h3 className="line-clamp-1 font-display text-sm font-semibold leading-tight">{title}</h3>
        <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <MapPin className="h-3 w-3" /> <span className="line-clamp-1">{area}, {city}</span>
        </p>
        <div className="flex items-end justify-between pt-1">
          <div className="font-display text-base font-bold text-primary">{priceLabel}</div>
          <span className="rounded-full bg-primary-soft px-2 py-0.5 text-[10px] font-medium text-primary">
            {type}
          </span>
        </div>
      </div>
    </Link>
  );
}
