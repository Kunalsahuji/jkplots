import { properties } from "@/utils/properties";
import { PropertyCard } from "@/components/site/PropertyCard";
import { Heart } from "lucide-react";

export default function SavedPage() {
  const saved = properties.slice(0, 4);

  return (
    <div className="container-px mx-auto max-w-7xl py-10">
      <div className="flex items-center gap-3">
        <Heart className="h-6 w-6 text-destructive" />
        <h1 className="font-display text-3xl font-bold">Saved properties</h1>
      </div>
      <p className="mt-1 text-muted-foreground">{saved.length} properties in your shortlist</p>
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {saved.map((p) => (
          <PropertyCard key={p.id} p={p} />
        ))}
      </div>
    </div>
  );
}
