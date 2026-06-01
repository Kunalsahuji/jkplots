import { useParams, Link, Navigate } from "react-router-dom";
import { properties } from "@/utils/properties";
import { PropertyCard } from "@/components/site/PropertyCard";
import {
  Bed,
  Bath,
  Maximize,
  MapPin,
  BadgeCheck,
  Phone,
  MessageCircle,
  Share2,
  Heart,
  Calculator,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function PropertyDetailPage() {
  const { id } = useParams();
  const p = properties.find((x) => x.id === id);

  if (!p) {
    return <Navigate to="/" replace />;
  }

  const [active, setActive] = useState(0);
  const [loanAmt, setLoanAmt] = useState(Math.round(p.price * 0.8));
  const [years, setYears] = useState(20);
  const [rate, setRate] = useState(8.5);

  const monthlyRate = rate / 12 / 100;
  const months = years * 12;
  const emi =
    loanAmt > 0
      ? (loanAmt * monthlyRate * Math.pow(1 + monthlyRate, months)) /
        (Math.pow(1 + monthlyRate, months) - 1)
      : 0;

  const similar = properties.filter((x) => x.id !== p.id && x.city === p.city).slice(0, 3);

  return (
    <div>
      {/* Gallery */}
      <section className="container-px mx-auto max-w-7xl pt-6">
        <nav className="mb-4 text-xs text-muted-foreground">
          <Link to="/" className="hover:text-foreground">Home</Link> /{" "}
          <Link to="/properties" className="hover:text-foreground">Properties</Link> /{" "}
          <span className="text-foreground">{p.title}</span>
        </nav>
        <div className="grid gap-3 md:grid-cols-[2fr_1fr]">
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-muted md:aspect-[16/10]">
            <img src={p.gallery[active]} alt={p.title} className="h-full w-full object-cover" />
            {p.verified && (
              <span className="absolute left-4 top-4 flex items-center gap-1 rounded-full bg-success px-3 py-1.5 text-xs font-semibold text-success-foreground">
                <BadgeCheck className="h-3.5 w-3.5" /> Verified
              </span>
            )}
          </div>
          <div className="grid grid-cols-3 gap-3 md:grid-cols-1">
            {p.gallery.slice(0, 3).map((g, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                className={`aspect-[4/3] overflow-hidden rounded-xl border-2 transition ${
                  active === i ? "border-primary" : "border-transparent"
                }`}
              >
                <img src={g} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="container-px mx-auto grid max-w-7xl gap-8 py-8 lg:grid-cols-[1fr_360px]">
        {/* Main */}
        <div className="space-y-8">
          <div>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">
                  For {p.purpose} · {p.type}
                </span>
                <h1 className="mt-3 font-display text-3xl font-bold md:text-4xl">{p.title}</h1>
                <p className="mt-2 flex items-center gap-1.5 text-muted-foreground">
                  <MapPin className="h-4 w-4" /> {p.area}, {p.city}
                </p>
              </div>
              <div className="flex gap-2">
                <button className="grid h-10 w-10 place-items-center rounded-full border border-border hover:bg-secondary">
                  <Heart className="h-4 w-4" />
                </button>
                <button className="grid h-10 w-10 place-items-center rounded-full border border-border hover:bg-secondary">
                  <Share2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="mt-4 flex items-baseline gap-3">
              <div className="font-display text-4xl font-bold text-primary">{p.priceLabel}</div>
              <div className="text-sm text-muted-foreground">· {Math.round(p.price / p.sqft).toLocaleString()}/sqft</div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 rounded-2xl border border-border bg-card p-5 sm:grid-cols-4">
            {[
              [Bed, p.beds || "—", "Bedrooms"],
              [Bath, p.baths || "—", "Bathrooms"],
              [Maximize, p.sqft.toLocaleString(), "Sq ft"],
              [Calendar, p.readyToMove ? "Ready" : "Soon", "Status"],
            ].map(([I, v, l], i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary-soft text-primary">
                  <I className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-lg font-semibold">{v}</div>
                  <div className="text-xs text-muted-foreground">{l}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Description */}
          <Section title="About this property">
            <p className="leading-relaxed text-muted-foreground">{p.description}</p>
          </Section>

          {/* Amenities */}
          <Section title="Amenities">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {p.amenities.map((a) => (
                <div key={a} className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5 text-sm">
                  <span className="h-2 w-2 rounded-full bg-success" /> {a}
                </div>
              ))}
            </div>
          </Section>

          {/* Map placeholder */}
          <Section title="Location">
            <div className="aspect-[16/9] overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary-soft to-secondary">
              <div className="flex h-full flex-col items-center justify-center text-center">
                <MapPin className="h-10 w-10 text-primary" />
                <p className="mt-2 font-semibold">
                  {p.area}, {p.city}
                </p>
                <p className="text-xs text-muted-foreground">Map preview · Connect Google Maps API</p>
              </div>
            </div>
          </Section>

          {/* EMI Calculator */}
          <Section title="EMI Calculator" icon={Calculator}>
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="grid gap-4 md:grid-cols-3">
                <Field label={`Loan ₹${(loanAmt / 100000).toFixed(1)}L`}>
                  <input
                    type="range"
                    min={500000}
                    max={p.price}
                    step={100000}
                    value={loanAmt}
                    onChange={(e) => setLoanAmt(+e.target.value)}
                    className="w-full accent-primary"
                  />
                </Field>
                <Field label={`Tenure ${years} yrs`}>
                  <input
                    type="range"
                    min={5}
                    max={30}
                    value={years}
                    onChange={(e) => setYears(+e.target.value)}
                    className="w-full accent-primary"
                  />
                </Field>
                <Field label={`Interest ${rate}%`}>
                  <input
                    type="range"
                    min={6}
                    max={15}
                    step={0.1}
                    value={rate}
                    onChange={(e) => setRate(+e.target.value)}
                    className="w-full accent-primary"
                  />
                </Field>
              </div>
              <div className="mt-6 rounded-xl bg-primary p-5 text-primary-foreground">
                <div className="text-xs uppercase tracking-wider opacity-80">Monthly EMI</div>
                <div className="font-display text-3xl font-bold">₹{Math.round(emi).toLocaleString("en-IN")}</div>
              </div>
            </div>
          </Section>
        </div>

        {/* Sticky contact */}
        <aside>
          <div className="sticky top-24 space-y-4">
            <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-full bg-gradient-hero text-primary-foreground font-bold">
                  {p.dealer.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <div className="font-semibold">{p.dealer.name}</div>
                  {p.dealer.verified && (
                    <div className="flex items-center gap-1 text-xs text-success">
                      <BadgeCheck className="h-3 w-3" /> Verified Dealer
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-5 space-y-2">
                <Button className="w-full gap-2 rounded-xl bg-success text-success-foreground hover:bg-success/90">
                  <MessageCircle className="h-4 w-4" /> WhatsApp Dealer
                </Button>
                <Button variant="outline" className="w-full gap-2 rounded-xl">
                  <Phone className="h-4 w-4" /> {p.dealer.phone}
                </Button>
              </div>
              <form onSubmit={(e) => e.preventDefault()} className="mt-4 space-y-2 border-t border-border pt-4">
                <input
                  placeholder="Your name"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
                />
                <input
                  placeholder="Phone number"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
                />
                <textarea
                  placeholder="I'm interested in this property..."
                  rows={3}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
                />
                <Button className="w-full rounded-xl bg-primary">Request a callback</Button>
              </form>
            </div>
          </div>
        </aside>
      </div>

      {/* Similar */}
      {similar.length > 0 && (
        <section className="container-px mx-auto max-w-7xl py-10">
          <h2 className="font-display text-2xl font-bold md:text-3xl">Similar properties in {p.city}</h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {similar.map((s) => (
              <PropertyCard key={s.id} p={s} />
            ))}
          </div>
        </section>
      )}

      {/* Mobile sticky CTA */}
      <div className="fixed inset-x-0 bottom-16 z-30 border-t border-border bg-background p-3 lg:hidden">
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <div className="text-xs text-muted-foreground">Price</div>
            <div className="font-display text-lg font-bold text-primary">{p.priceLabel}</div>
          </div>
          <Button className="flex-1 gap-2 rounded-xl bg-success text-success-foreground">
            <MessageCircle className="h-4 w-4" /> WhatsApp
          </Button>
          <Button className="flex-1 gap-2 rounded-xl bg-primary">
            <Phone className="h-4 w-4" /> Call
          </Button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, icon: Icon, children }) {
  return (
    <section>
      <h2 className="flex items-center gap-2 font-display text-xl font-bold md:text-2xl">
        {Icon && <Icon className="h-5 w-5 text-primary" />} {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
      {children}
    </div>
  );
}
