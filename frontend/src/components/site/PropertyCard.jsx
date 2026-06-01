import { Link } from "react-router-dom";
import { MapPin, BadgeCheck, Heart } from "lucide-react";
import { useState } from "react";

export function PropertyCard({ p }) {
  const [saved, setSaved] = useState(false);
  return (
    <Link
      to={`/properties/${p.id}`}
      className="group block overflow-hidden rounded-xl border border-border bg-card transition-all hover:-translate-y-0.5 hover:shadow-card"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <img
          src={p.image}
          alt={p.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute left-2 top-2 flex gap-1.5">
          {p.verified && (
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
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setSaved(!saved);
          }}
          className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-background/90 backdrop-blur transition hover:scale-110"
          aria-label="Save"
        >
          <Heart className={`h-3.5 w-3.5 ${saved ? "fill-destructive text-destructive" : "text-foreground"}`} />
        </button>
      </div>

      <div className="space-y-1.5 p-3">
        <h3 className="line-clamp-1 font-display text-sm font-semibold leading-tight">{p.title}</h3>
        <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <MapPin className="h-3 w-3" /> <span className="line-clamp-1">{p.area}, {p.city}</span>
        </p>
        <div className="flex items-end justify-between pt-1">
          <div className="font-display text-base font-bold text-primary">{p.priceLabel}</div>
          <span className="rounded-full bg-primary-soft px-2 py-0.5 text-[10px] font-medium text-primary">
            {p.type}
          </span>
        </div>
      </div>
    </Link>
  );
}
