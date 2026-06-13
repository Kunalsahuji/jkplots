import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import heroImg from "@/assets/hero-kashmir.jpg";
import prop1 from "@/assets/prop-1.jpg";
import prop2 from "@/assets/prop-2.jpg";
import prop3 from "@/assets/prop-3.jpg";
import prop4 from "@/assets/prop-4.jpg";
import catBuy from "@/assets/cat-buy.jpg";
import catRent from "@/assets/cat-rent.jpg";
import catLand from "@/assets/cat-land.jpg";
import catCommercial from "@/assets/cat-commercial.jpg";
import { SearchBar } from "@/components/site/SearchBar";
import { PropertyCard } from "@/components/site/PropertyCard";
import { properties, cities } from "@/utils/properties";
import { useAuth } from "@/context/AuthContext";
import {
  ShieldCheck,
  Sparkles,
  Headphones,
  TrendingUp,
  ArrowRight,
  Star,
  Quote,
  Smartphone,
  BadgeCheck,
  Home as HomeIcon,
  KeyRound,
  LandPlot,
  Store,
} from "lucide-react";

const heroImages = [heroImg, prop1, prop2, prop3, prop4];

export default function HomePage() {
  const [propertyList, setPropertyList] = useState([]);
  const [bgIndex, setBgIndex] = useState(0);

  const { user, isAuthenticated } = useAuth();
  const showPostProperty = isAuthenticated && user?.role === "dealer";

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/properties");
        const resData = await response.json();
        if (resData.success) {
          setPropertyList(resData.data);
        }
      } catch (err) {
        console.error("Failed to fetch properties from backend:", err);
      }
    };
    fetchProperties();
  }, []);

  const activeProperties = propertyList.length > 0 ? propertyList : properties;
  const featured = activeProperties.filter((p) => p.isFeatured && new Date(p.featuredUntil) > new Date()).slice(0, 8);
  const all = activeProperties.filter((p) => !p.isFeatured || new Date(p.featuredUntil) <= new Date()).slice(0, 8);

  useEffect(() => {
    const timer = setInterval(() => {
      setBgIndex((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden min-h-[500px] md:min-h-[600px] lg:min-h-[700px] flex items-center">
        <div className="absolute inset-0">
          {heroImages.map((img, index) => (
            <img
              key={index}
              src={img}
              alt={`Kashmir valley villa slide ${index + 1}`}
              width={1920}
              height={1080}
              className={`absolute inset-0 h-full w-full object-cover transition-all duration-[5000ms] ease-out ${
                index === bgIndex ? "opacity-100 scale-105" : "opacity-0 scale-100"
              }`}
            />
          ))}
          <div className="absolute inset-0 bg-gradient-to-b from-foreground/50 via-foreground/35 to-foreground/85" />
          {/* Navigation Dots */}
          <div className="absolute bottom-6 right-6 flex gap-2 z-10">
            {heroImages.map((_, i) => (
              <button
                key={i}
                onClick={() => setBgIndex(i)}
                className={`h-2 w-2 rounded-full transition-all duration-300 ${
                  i === bgIndex ? "bg-accent w-6" : "bg-background/40 hover:bg-background/80"
                }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </div>
        <div className="relative container-px mx-auto w-full max-w-7xl pb-16 pt-16 md:pb-24 md:pt-20 lg:pb-28 lg:pt-24 z-10">
          <div className="max-w-3xl text-background">
            <span className="inline-flex items-center gap-2 rounded-full border border-background/30 bg-background/10 px-3 py-1.5 text-xs font-medium backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-accent" /> J&amp;K's most trusted marketplace
            </span>
            <h1 className="mt-5 font-display text-4xl font-bold leading-[1.05] md:text-6xl lg:text-7xl">
              Find your place<br />in the <span className="text-accent">valley.</span>
            </h1>
            <p className="mt-5 max-w-xl text-base text-background/85 md:text-lg">
              Verified villas, apartments, plots and commercial spaces across Jammu &amp; Kashmir — handpicked, transparent, real.
            </p>
          </div>

          <div className="mt-10 md:mt-12">
            <SearchBar />
          </div>

          <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3 text-sm text-background/90">
            {[
              ["12,500+", "Verified listings"],
              ["1,200+", "Trusted dealers"],
              ["50K+", "Happy customers"],
              ["4.8★", "User rating"],
            ].map(([n, l]) => (
              <div key={l}>
                <div className="font-display text-2xl font-bold">{n}</div>
                <div className="text-xs text-background/70">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CATEGORIES — premium image cards */}
      <section className="container-px mx-auto max-w-7xl py-14 md:py-20">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">What are you looking for?</span>
            <h2 className="mt-2 font-display text-3xl font-bold md:text-4xl">Browse by purpose</h2>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
          {[
            {
              label: "Buy a Home",
              desc: "Villas, Apartments",
              icon: HomeIcon,
              img: catBuy,
              query: "purpose=Buy&type=Villa",
            },
            {
              label: "Rent a Place",
              desc: "Flexible, furnished",
              icon: KeyRound,
              img: catRent,
              query: "purpose=Rent",
            },
            {
              label: "Buy Land",
              desc: "Plots & farms",
              icon: LandPlot,
              img: catLand,
              query: "purpose=Buy&type=Plot",
            },
            {
              label: "Commercial",
              desc: "Shops, offices",
              icon: Store,
              img: catCommercial,
              query: "purpose=Commercial&type=Commercial",
            },
          ].map((c) => (
            <Link
              key={c.label}
              to={`/properties?${c.query}`}
              className="group relative block aspect-[4/5] overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition-all hover:-translate-y-1 hover:shadow-elevated"
            >
              <img
                src={c.img}
                alt={c.label}
                loading="lazy"
                width={800}
                height={1000}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/85 via-foreground/30 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4 text-background">
                <div className="mb-2 inline-grid h-9 w-9 place-items-center rounded-xl bg-background/95 text-primary shadow-soft">
                  <c.icon className="h-4 w-4" />
                </div>
                <div className="font-display text-base font-bold leading-tight md:text-lg">{c.label}</div>
                <div className="text-[11px] text-background/80 md:text-xs">{c.desc}</div>
                <div className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-accent opacity-0 transition-opacity group-hover:opacity-100">
                  Explore <ArrowRight className="h-3 w-3" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* FEATURED */}
      <section className="container-px mx-auto max-w-7xl py-12">
        <SectionHeader title="Featured properties" sub="Hand-curated, verified, ready to visit" link="/properties" />
        <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
          {featured.map((p) => (
            <PropertyCard key={p._id || p.id} p={p} />
          ))}
        </div>
      </section>

      {/* CITIES */}
      <section className="container-px mx-auto max-w-7xl py-16">
        <SectionHeader title="Explore by city" sub="From the lakes of Srinagar to the meadows of Sonmarg" />
        <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-5">
          {cities.map((c) => (
            <Link
              key={c.name}
              to={`/properties?city=${c.name}`}
              className="group relative aspect-[3/4] overflow-hidden rounded-xl"
            >
              <img
                src={c.image}
                alt={c.name}
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-overlay" />
              <div className="absolute inset-x-0 bottom-0 p-3 text-background">
                <h3 className="font-display text-lg font-bold">{c.name}</h3>
                <p className="text-[11px] text-background/80">{c.count} properties</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* WHY US */}
      {/* <section className="bg-primary-soft/50 py-20">
        <div className="container-px mx-auto max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <span className="text-sm font-semibold uppercase tracking-wider text-primary">Why JKPLOT</span>
              <h2 className="mt-3 font-display text-4xl font-bold leading-tight md:text-5xl">
                Built on trust. Designed for J&amp;K.
              </h2>
              <p className="mt-4 max-w-lg text-muted-foreground">
                Every listing is verified by our local team. Every dealer is vetted. Every transaction is transparent.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { i: ShieldCheck, t: "100% Verified", d: "Physical & document checks on every listing" },
                { i: BadgeCheck, t: "Real Dealers", d: "KYC-verified brokers and owners" },
                { i: TrendingUp, t: "Fair Pricing", d: "Market insights & locality price trends" },
                { i: Headphones, t: "Local Support", d: "Hindi, Urdu, Kashmiri — we speak your language" },
              ].map((f) => (
                <div key={f.t} className="rounded-2xl bg-card p-5 shadow-soft">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-primary-foreground">
                    <f.i className="h-5 w-5" />
                  </div>
                  <div className="mt-3 font-display text-lg font-semibold">{f.t}</div>
                  <div className="text-sm text-muted-foreground">{f.d}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section> */}

      {/* LATEST */}
      <section className="container-px mx-auto max-w-7xl py-16">
        <SectionHeader title="Latest listings" sub="Fresh on the market this week" link="/properties" />
        <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
          {all.map((p) => (
            <PropertyCard key={p._id || p.id} p={p} />
          ))}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="container-px mx-auto max-w-7xl py-16">
        <SectionHeader title="Loved by families across J&K" sub="Real stories from real buyers" />
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {[
            {
              n: "Aamir Hussain",
              c: "Srinagar",
              q: "Found our dream home in Rajbagh within two weeks. Every property we visited matched the listing exactly.",
            },
            {
              n: "Priya Sharma",
              c: "Jammu",
              q: "The dealer verification saved us from a fraud listing on another site. JKPLOT is the real deal.",
            },
            {
              n: "Fayaz Lone",
              c: "Anantnag",
              q: "Sold my plot in 19 days. Their team handled everything — photos, listing, buyer calls.",
            },
          ].map((t) => (
            <div key={t.n} className="rounded-2xl border border-border bg-card p-6">
              <Quote className="h-6 w-6 text-accent" />
              <p className="mt-3 text-sm leading-relaxed">{t.q}</p>
              <div className="mt-4 flex items-center gap-1 text-accent">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-3.5 w-3.5 fill-current" />
                ))}
              </div>
              <div className="mt-3 font-semibold">{t.n}</div>
              <div className="text-xs text-muted-foreground">{t.c}</div>
            </div>
          ))}
        </div>
      </section>

      {/* PROPERTY CTA */}
      {showPostProperty && (
        <section className="container-px mx-auto max-w-7xl py-16">
          <div className="overflow-hidden rounded-3xl bg-gradient-hero p-8 text-primary-foreground md:p-12 lg:p-16">
            <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/20 px-3 py-1 text-xs font-semibold text-accent">
                  <Sparkles className="h-3.5 w-3.5" /> List For Free
                </span>
                <h2 className="mt-4 font-display text-3xl font-bold leading-tight md:text-5xl">Want to sell or rent your property?</h2>
                <p className="mt-4 max-w-md text-background/85 md:text-lg">
                  Showcase your villas, apartments, or plots to thousands of verified buyers in Jammu & Kashmir.
                </p>
                <div className="mt-8">
                  <Link to="/post-property" className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3.5 text-sm font-semibold text-accent-foreground shadow-lg transition hover:scale-[1.02] active:scale-95">
                    Post Property Free <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
              <div className="flex justify-end">
                <div className="w-full max-w-sm rounded-2xl border border-background/20 bg-background/10 p-6 backdrop-blur-md">
                  <h3 className="font-display text-lg font-bold text-background">Why list with JKPLOT?</h3>
                  <ul className="mt-4 space-y-3.5 text-sm text-background/90">
                    <li className="flex items-start gap-2.5">
                      <span className="mt-0.5 rounded-full bg-accent/20 p-1 text-accent">✓</span>
                      <div>
                        <p className="font-semibold">100% Free Listing</p>
                        <p className="text-xs text-background/70">No hidden charges or commissions</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="mt-0.5 rounded-full bg-accent/20 p-1 text-accent">✓</span>
                      <div>
                        <p className="font-semibold">Direct WhatsApp Enquiries</p>
                        <p className="text-xs text-background/70">Connect directly with interested buyers</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="mt-0.5 rounded-full bg-accent/20 p-1 text-accent">✓</span>
                      <div>
                        <p className="font-semibold">Verified Leads Only</p>
                        <p className="text-xs text-background/70">Say goodbye to spam and fake brokers</p>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function SectionHeader({ title, sub, link }) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <h2 className="font-display text-3xl font-bold md:text-4xl">{title}</h2>
        <p className="mt-2 text-muted-foreground">{sub}</p>
      </div>
      {link && (
        <Link
          to={link}
          className="hidden shrink-0 items-center gap-1 text-sm font-semibold text-primary hover:underline md:inline-flex"
        >
          View all <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      )}
    </div>
  );
}
