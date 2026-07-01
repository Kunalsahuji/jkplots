import { useState, useEffect, useRef, useMemo } from "react";
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
import api from "@/utils/api";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { ShieldCheck, Sparkles, Headphones, TrendingUp, ArrowRight, Star, Quote, X, Smartphone, BadgeCheck, Home as HomeIcon, KeyRound, LandPlot, Store, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const heroImages = [heroImg, prop1, prop2, prop3, prop4];

function formatTitle(title) {
  if (!title) return null;
  if (typeof title !== "string") return title; // JSX fallback
  const words = title.trim().split(/\s+/);
  if (words.length <= 2) return <span className="text-accent">{title}</span>;
  const firstPart = words.slice(0, -2).join(" ");
  const lastPart = words.slice(-2).join(" ");
  return <>{firstPart} <span className="text-accent">{lastPart}</span></>;
}

const purposeCategories = [
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
  {
    label: "PG / Co-living",
    desc: "Shared spaces, hostels",
    icon: HomeIcon,
    img: prop3,
    query: "purpose=Rent&type=PG",
  }
];

export default function HomePage() {
  const [propertyList, setPropertyList] = useState([]);
  const [bgIndex, setBgIndex] = useState(0);
  const [heroBanners, setHeroBanners] = useState([]);
  const [platformStats, setPlatformStats] = useState({
    properties: "12.5K+",
    dealers: "1.2K+",
    users: "50K+",
    rating: "4.8"
  });

  const { user, isAuthenticated } = useAuth();
  const showPostProperty = isAuthenticated && user?.role === "dealer";

  const [featuredReviews, setFeaturedReviews] = useState([]);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });
  const [hasExistingReview, setHasExistingReview] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    // Fetch featured reviews
    const fetchReviews = async () => {
      try {
        const { data } = await api.get("/reviews?featured=true&limit=8");
        if (data.success && data.data.length > 0) {
          setFeaturedReviews(data.data);
        } else {
          // Fallback static reviews if empty DB
          setFeaturedReviews([
            {
              user: { name: "Aamir Hussain" },
              comment: "Found our dream home in Rajbagh within two weeks. Every property we visited matched the listing exactly.",
              rating: 5
            },
            {
              user: { name: "Priya Sharma" },
              comment: "The dealer verification saved us from a fraud listing on another site. JKPLOT is the real deal.",
              rating: 5
            },
            {
              user: { name: "Fayaz Lone" },
              comment: "Sold my plot in 19 days. Their team handled everything — photos, listing, buyer calls.",
              rating: 5
            }
          ]);
        }
      } catch (err) {
        console.error("Failed to load featured reviews:", err);
      }
    };
    fetchReviews();
  }, []);

  useEffect(() => {
    if (user) {
      const fetchMyReview = async () => {
        try {
          const { data } = await api.get("/reviews/me");
          if (data.success && data.data) {
            setReviewForm({ rating: data.data.rating, comment: data.data.comment });
            setHasExistingReview(true);
          } else {
            setReviewForm({ rating: 5, comment: "" });
            setHasExistingReview(false);
          }
        } catch (err) {
          console.error("Failed to load your review:", err);
        }
      };
      fetchMyReview();
    } else {
      setReviewForm({ rating: 5, comment: "" });
      setHasExistingReview(false);
    }
  }, [user, reviewModalOpen]); // refetch when modal opens just in case

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please login to submit a review");
      return;
    }
    setSubmittingReview(true);
    try {
      const { data } = await api.post("/reviews", reviewForm);
      if (data.success) {
        toast.success(data.message || "Thank you for your feedback! Your review has been submitted.");
        setReviewModalOpen(false);
        setHasExistingReview(true);
      }
    } catch (err) {
      toast.error(err?.response?.data?.error || "Failed to submit review");
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDeleteReview = async () => {
    if (!window.confirm("Are you sure you want to delete your review?")) return;
    try {
      const { data } = await api.delete("/reviews/me");
      if (data.success) {
        toast.success("Review deleted successfully.");
        setReviewForm({ rating: 5, comment: "" });
        setHasExistingReview(false);
        setReviewModalOpen(false);
      }
    } catch (err) {
      toast.error(err?.response?.data?.error || "Failed to delete review");
    }
  };

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const { data: resData } = await api.get("/properties");
        if (resData.success) {
          setPropertyList(resData.data);
        }
      } catch (err) {
        console.error("Failed to fetch properties from backend:", err);
      }
    };
    fetchProperties();

    const fetchBanners = async () => {
      try {
        const { data } = await api.get("/banners?placement=homepage_hero");
        if (data.success && data.data.length > 0) {
          setHeroBanners(data.data);
        }
      } catch (err) {
        console.error("Failed to fetch banners:", err);
      }
    };
    fetchBanners();

    const fetchStats = async () => {
      try {
        const { data } = await api.get("/system-config/stats");
        if (data.success && data.data) {
          const formatNum = (n) => n >= 1000 ? (n/1000).toFixed(1).replace('.0', '') + 'K+' : n + '+';
          setPlatformStats({
            properties: formatNum(data.data.properties),
            dealers: formatNum(data.data.dealers),
            users: formatNum(data.data.users),
            rating: data.data.rating
          });
        }
      } catch (err) {
        console.error("Failed to fetch stats:", err);
      }
    };
    fetchStats();
  }, []);

  const activeProperties = propertyList.length > 0 ? propertyList : properties;
  const allFeatured = activeProperties.filter((p) => p.isFeatured && new Date(p.featuredUntil) > new Date());
  const allLatest = activeProperties.filter((p) => !p.isFeatured || new Date(p.featuredUntil) <= new Date());

  const itemsPerPage = 8;
  const [latestPage, setLatestPage] = useState(1);
  const totalLatestPages = Math.ceil(allLatest.length / itemsPerPage);
  const paginatedLatest = allLatest.slice((latestPage - 1) * itemsPerPage, latestPage * itemsPerPage);

  const [featuredPage, setFeaturedPage] = useState(1);
  const totalFeaturedPages = Math.ceil(allFeatured.length / itemsPerPage);
  const paginatedFeatured = allFeatured.slice((featuredPage - 1) * itemsPerPage, featuredPage * itemsPerPage);

  const dynamicCities = useMemo(() => {
    const counts = {};
    activeProperties.forEach(p => {
      if (p.city) counts[p.city] = (counts[p.city] || 0) + 1;
    });
    return cities.map(c => ({
      ...c,
      count: counts[c.name] || 0
    }));
  }, [activeProperties]);

  const heroImageMap = {
    "heroImg": heroImg,
    "prop1": prop1,
    "prop2": prop2,
    "prop3": prop3
  };

  const activeBanners = heroBanners.map(b => ({ 
    ...b, 
    imageUrl: b.isDefaultAsset && heroImageMap[b.assetKey] ? heroImageMap[b.assetKey] : b.imageUrl 
  }));

  useEffect(() => {
    const timer = setInterval(() => {
      setBgIndex((prev) => (prev + 1) % activeBanners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [activeBanners.length]);

  return (
    <div>
      {/* HERO */}
      {/* HERO */}
      <section className="relative overflow-hidden h-[60vh] md:h-[calc(100vh-64px)] flex md:items-center">
        <div className="absolute inset-0">
          {activeBanners.map((b, index) => (
            <div
              key={index}
              className={`absolute inset-0 h-full w-full transition-all duration-[5000ms] ease-out ${
                index === bgIndex ? "opacity-100 scale-105" : "opacity-0 scale-100"
              }`}
            >
              {b.targetUrl ? (
                <a 
                  href={b.targetUrl} 
                  target="_blank" 
                  rel="noreferrer"
                  onClick={() => b._id && api.put(`/banners/${b._id}/click`).catch(e=>console.log(e))}
                  className="absolute inset-0 z-10"
                >
                  <span className="sr-only">{b.title || 'Promotional Banner'}</span>
                </a>
              ) : null}
              <img
                src={b.imageUrl}
                alt={b.title || `Kashmir valley villa slide ${index + 1}`}
                width={1920}
                height={1080}
                className="h-full w-full object-cover"
              />
            </div>
          ))}
          <div className="absolute inset-0 bg-gradient-to-b from-foreground/50 via-foreground/35 to-foreground/85 pointer-events-none" />
          {/* Navigation Dots */}
          <div className="absolute bottom-6 right-6 flex gap-2 z-20 pointer-events-auto">
            {activeBanners.map((_, i) => (
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
        <div className="relative container-px mx-auto w-full max-w-7xl pb-12 pt-20 md:pb-16 md:pt-28 z-20 pointer-events-none flex flex-col justify-end md:justify-center h-full">
          <div className="max-w-3xl text-background pointer-events-auto inline-block min-h-[220px] md:min-h-[280px] flex flex-col justify-end md:justify-center">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="inline-flex items-center gap-2 rounded-full border border-background/30 bg-background/20 px-3 py-1.5 text-xs font-semibold backdrop-blur shadow-sm">
                {/* <Sparkles className="h-3.5 w-3.5 text-accent" /> */}
                 J&amp;K's most trusted marketplace
              </span>
            </motion.div>
            
            <div className="relative mt-4">
              <AnimatePresence mode="wait">
                <motion.div
                  key={bgIndex}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.4 }}
                >
                  <h1 className="font-display text-3xl font-extrabold tracking-tight leading-[1.1] sm:text-4xl md:text-6xl lg:text-7xl">
                    {formatTitle(activeBanners[bgIndex]?.title) || (
                      <>Find your place<br />in the <span className="text-accent">valley.</span></>
                    )}
                  </h1>
                  <p className="mt-4 max-w-xl text-sm text-background/90 sm:text-base md:text-lg font-medium drop-shadow-md">
                    {activeBanners[bgIndex]?.description || "Verified villas, apartments, plots and commercial spaces across Jammu & Kashmir — handpicked, transparent, real."}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          <div className="hidden md:block mt-8 md:mt-12 pointer-events-auto">
            <SearchBar />
          </div>

          {/* 
          <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3 text-sm text-background/90 pointer-events-auto">
            {[
              [platformStats.properties, "Verified listings"],
              [platformStats.dealers, "Trusted dealers"],
              [platformStats.users, "Happy customers"],
              [`${platformStats.rating}★`, "User rating"],
            ].map(([n, l]) => (
              <div key={l}>
                <div className="font-display text-xl font-bold md:text-2xl">{n}</div>
                <div className="text-[10px] text-background/70 md:text-xs">{l}</div>
              </div>
            ))}
          </div> 
          */}
        </div>
      </section>

      {/* MOBILE SEARCH BAR */}
      <div className="md:hidden container-px mx-auto relative z-30 -mt-10 mb-10">
        <SearchBar />
      </div>

      {/* CATEGORIES — premium image cards */}
      <section className="container-px mx-auto max-w-7xl py-14 md:py-20">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">What are you looking for?</span>
            <h2 className="mt-2 font-display text-3xl font-bold md:text-4xl">Browse by purpose</h2>
          </div>
        </div>
        <PaginatedSlider 
          items={purposeCategories}
          renderItem={(c, i) => (
            <motion.div
              key={i}
              whileHover={{ scale: 1.03 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="shrink-0 block"
            >
              <Link
                to={`/properties?${c.query}`}
                className="group relative block aspect-[4/5] w-[240px] sm:w-[280px] lg:w-[300px] h-full overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-card"
              >
                <motion.img
                  src={c.img}
                  alt={c.label}
                  loading="lazy"
                  width={800}
                  height={1000}
                  className="absolute inset-0 h-full w-full object-cover"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.6 }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/85 via-foreground/30 to-transparent pointer-events-none" />
                <div className="absolute inset-x-0 bottom-0 p-4 text-background pointer-events-none">
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
            </motion.div>
          )}
        />
      </section>

      {/* FEATURED */}
      {allFeatured && allFeatured.length > 0 && (
        <section className="container-px mx-auto max-w-7xl py-12 overflow-hidden">
          <SectionHeader title="Featured Listings" sub="Top picks from your community" link="/properties?featured=true" linkText="View All" />
          
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {paginatedFeatured.map((p, i) => (
              <PropertyCard key={p._id || p.id || i} p={p} />
            ))}
          </div>

          {totalFeaturedPages > 1 && (
            <div className="mt-10 flex justify-center gap-2">
              {Array.from({ length: totalFeaturedPages }).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setFeaturedPage(idx + 1);
                    document.getElementById('featured-listings')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className={`grid h-9 w-9 place-items-center rounded-full text-sm font-bold transition-all ${
                    featuredPage === idx + 1 
                      ? "bg-primary text-primary-foreground shadow-sm" 
                      : "bg-card text-foreground hover:bg-secondary border border-border"
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
          )}
        </section>
      )}


      {/* CITIES */}
      <section className="container-px mx-auto max-w-7xl py-16 overflow-hidden">
        <SectionHeader title="Explore by city" sub="From the lakes of Srinagar to the meadows of Sonmarg" />
        <PaginatedSlider 
          items={dynamicCities}
          renderItem={(c, i) => (
            <motion.div
              key={i}
              whileHover={{ scale: 1.04 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="shrink-0 block"
            >
              <Link
                to={`/properties?city=${c.name}`}
                className="group/card relative block aspect-[3/4] w-[180px] sm:w-[220px] lg:w-[240px] h-full overflow-hidden rounded-2xl shadow-sm hover:shadow-card transition-shadow"
              >
                <motion.img
                  src={c.image}
                  alt={c.name}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover"
                  whileHover={{ scale: 1.08 }}
                  transition={{ duration: 0.6 }}
                />
                <div className="absolute inset-0 bg-gradient-overlay pointer-events-none" />
                <div className="absolute inset-x-0 bottom-0 p-4 text-background pointer-events-none">
                  <h3 className="font-display text-xl font-bold leading-none">{c.name}</h3>
                  <p className="mt-1 text-[11px] font-medium text-background/80">{c.count} properties</p>
                </div>
              </Link>
            </motion.div>
          )}
        />
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

      {/* LATEST LISTINGS */}
      {allLatest && allLatest.length > 0 && (
        <section className="container-px mx-auto max-w-7xl py-16 overflow-hidden border-t border-border bg-secondary/30">
          <SectionHeader title="Latest Properties" sub="Freshly added to our marketplace" link="/properties?sort=newest" linkText="View All" />
          
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {paginatedLatest.map((p, i) => (
              <PropertyCard key={p._id || p.id || i} p={p} />
            ))}
          </div>

          {totalLatestPages > 1 && (
            <div className="mt-10 flex justify-center gap-2">
              {Array.from({ length: totalLatestPages }).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setLatestPage(idx + 1);
                    document.getElementById('latest-listings')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className={`grid h-9 w-9 place-items-center rounded-full text-sm font-bold transition-all ${
                    latestPage === idx + 1 
                      ? "bg-primary text-primary-foreground shadow-sm" 
                      : "bg-card text-foreground hover:bg-secondary border border-border"
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
          )}
        </section>
      )}

      {/* TESTIMONIALS */}
      <section className="container-px mx-auto max-w-7xl py-16 overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <SectionHeader title="Loved by families across J&K" sub="Real stories from real buyers" link="/reviews" linkText="View all reviews" />
          <button 
            onClick={() => user ? setReviewModalOpen(true) : toast.error("Please login to leave a review")}
            className="shrink-0 bg-primary/10 text-primary hover:bg-primary/20 transition-colors px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2"
          >
            <Star className="h-4 w-4 fill-primary" /> Leave a Review
          </button>
        </div>
        
        <div className="flex gap-4 overflow-x-auto pb-6 snap-x snap-mandatory" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {featuredReviews.map((r, idx) => (
            <div key={idx} className="shrink-0 w-[85vw] sm:w-[350px] snap-center rounded-2xl border border-border bg-card p-6 flex flex-col shadow-sm">
              <Quote className="h-6 w-6 text-accent mb-3 opacity-80" />
              <p className="text-sm leading-relaxed flex-grow italic text-foreground/90">"{r.comment}"</p>
              <div className="mt-5 pt-4 border-t border-border/50">
                <div className="flex items-center gap-1 text-accent mb-2">
                  {Array.from({ length: r.rating || 5 }).map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-current" />
                  ))}
                </div>
                <div className="font-bold text-sm text-foreground">{r.user?.name || "Verified User"}</div>
                <div className="text-xs text-muted-foreground mt-0.5">JKPLOT Platform Review</div>
              </div>
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
                  {/* <Sparkles className="h-3.5 w-3.5" /> */}
                   List For Free
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

      {/* REVIEW MODAL */}
      {reviewModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-xl animate-in zoom-in-95 duration-200">
            <form onSubmit={handleReviewSubmit} className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-900">Rate Your Experience</h3>
                <button type="button" onClick={() => setReviewModalOpen(false)} className="text-slate-400 hover:text-slate-600 bg-slate-100 p-2 rounded-full">
                  <X className="h-4 w-4" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">Rating</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                        className="focus:outline-none transition-transform hover:scale-110"
                      >
                        <Star className={`h-8 w-8 ${reviewForm.rating >= star ? 'fill-amber-500 text-amber-500' : 'text-slate-300'}`} />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">Your Feedback</label>
                  <textarea
                    required
                    maxLength="500"
                    rows="4"
                    value={reviewForm.comment}
                    onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                    placeholder="Tell us what you loved about JKPlot..."
                    className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-medium resize-none"
                  ></textarea>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                {hasExistingReview && (
                  <button
                    type="button"
                    onClick={handleDeleteReview}
                    className="bg-red-100 hover:bg-red-200 text-red-600 font-bold py-3 px-6 rounded-xl shadow-sm transition flex items-center gap-2"
                  >
                    Delete
                  </button>
                )}
                <button
                  type="submit"
                  disabled={submittingReview || !reviewForm.comment.trim()}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 px-6 rounded-xl shadow-lg transition disabled:opacity-50 flex items-center gap-2"
                >
                  {submittingReview ? 'Saving...' : (hasExistingReview ? 'Update Review' : 'Submit Review')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function SectionHeader({ title, sub, link, linkText = "View All" }) {
  return (
    <div className="flex flex-col items-start gap-4 md:flex-row md:items-end md:justify-between w-full">
      <div>
        <h2 className="font-display text-[22px] sm:text-[26px] md:text-3xl font-extrabold tracking-tight">{title}</h2>
        <p className="mt-1 text-sm font-medium text-muted-foreground">{sub}</p>
      </div>
      {link && (
        <Link
          to={link}
          className="shrink-0 flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-bold text-primary shadow-sm transition-all hover:bg-primary hover:text-primary-foreground md:px-5 md:py-2"
        >
          {linkText} <ChevronRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}

function PaginatedSlider({ items, renderItem }) {
  const scrollRef = useRef(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    const maxScroll = scrollWidth - clientWidth;
    if (maxScroll <= 0) setScrollProgress(0);
    else setScrollProgress(scrollLeft / maxScroll);
  };

  const scrollLeft = () => {
    if (scrollRef.current) scrollRef.current.scrollBy({ left: -320, behavior: 'smooth' });
  };
  
  const scrollRight = () => {
    if (scrollRef.current) scrollRef.current.scrollBy({ left: 320, behavior: 'smooth' });
  };

  // Determine number of dots based on items and a rough screen estimate (e.g. 5 dots max)
  const totalDots = Math.max(1, Math.min(items.length, 5));
  const activeDot = Math.round(scrollProgress * (totalDots - 1));

  return (
    <div className="relative mt-6 group -mx-4 px-4 sm:mx-0 sm:px-0">
      <button 
        onClick={scrollLeft}
        className="absolute left-2 top-[40%] -translate-y-1/2 z-10 grid h-10 w-10 place-items-center rounded-full border border-border bg-background/95 text-foreground shadow-card opacity-100 md:opacity-0 transition-all duration-300 md:group-hover:opacity-100 hover:scale-110 sm:-left-5"
        aria-label="Scroll left"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      <div 
        ref={scrollRef} 
        onScroll={handleScroll}
        className="flex gap-4 overflow-x-auto py-4 scrollbar-none snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
      >
        {items.map((item, i) => (
          <div key={i} className="snap-start shrink-0 h-full">
            {renderItem(item, i)}
          </div>
        ))}
      </div>

      <button 
        onClick={scrollRight}
        className="absolute right-2 top-[40%] -translate-y-1/2 z-10 grid h-10 w-10 place-items-center rounded-full border border-border bg-background/95 text-foreground shadow-card opacity-100 md:opacity-0 transition-all duration-300 md:group-hover:opacity-100 hover:scale-110 sm:-right-5"
        aria-label="Scroll right"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      {/* Pagination Dots */}
      <div className="flex items-center justify-center gap-2 mt-2">
        {Array.from({ length: totalDots }).map((_, i) => (
          <div 
            key={i} 
            className={`h-1.5 rounded-full transition-all duration-300 ${i === activeDot ? "w-6 bg-primary" : "w-1.5 bg-border/80"}`} 
          />
        ))}
      </div>
    </div>
  );
}
