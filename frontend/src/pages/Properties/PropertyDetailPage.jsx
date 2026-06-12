import { useParams, Link, Navigate } from "react-router-dom";
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
  Flame,
  Car,
  Dumbbell,
  Wind,
  Zap,
  Droplets,
  PhoneCall,
  Compass,
  CloudRain,
  Sparkles,
  ArrowUp,
  Star,
  User,
  Shield,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import api from "@/utils/api";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";


const formatPrice = (val) => {
  if (!val) return "₹—";
  if (typeof val === "string") return val;
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(1)} L`;
  return `₹${val.toLocaleString()}`;
};

const getAmenityIcon = (name) => {
  const norm = name.toLowerCase();
  if (norm.includes("security") || norm.includes("fire")) return Shield;
  if (norm.includes("parking")) return Car;
  if (norm.includes("gym") || norm.includes("fitness")) return Dumbbell;
  if (norm.includes("air condition") || norm.includes("ac")) return Wind;
  if (norm.includes("power") || norm.includes("backup") || norm.includes("electricity")) return Zap;
  if (norm.includes("water") || norm.includes("harvesting")) return Droplets;
  if (norm.includes("intercom")) return PhoneCall;
  if (norm.includes("garden") || norm.includes("park") || norm.includes("green")) return Sparkles;
  if (norm.includes("vaastu")) return Compass;
  if (norm.includes("rain water")) return CloudRain;
  if (norm.includes("renovated")) return Sparkles;
  if (norm.includes("ceiling")) return ArrowUp;
  if (norm.includes("maintenance")) return Shield;
  return Sparkles; // Fallback
};

const resolveImage = (img) => {
  if (!img) return "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80";
  if (img.startsWith("http") || img.startsWith("data:")) return img;
  return `http://localhost:5000${img}`;
};

function PropertyDetailSkeleton() {
  return (
    <div className="container-px mx-auto max-w-7xl py-12 animate-pulse space-y-8">
      <div className="h-6 w-32 bg-secondary rounded" />
      <div className="grid gap-3 md:grid-cols-[2fr_1fr]">
        <div className="aspect-[16/10] bg-secondary rounded-2xl" />
        <div className="grid grid-cols-3 gap-3 md:grid-cols-1">
          <div className="aspect-[4/3] bg-secondary rounded-xl" />
          <div className="aspect-[4/3] bg-secondary rounded-xl" />
          <div className="aspect-[4/3] bg-secondary rounded-xl" />
        </div>
      </div>
      <div className="h-10 w-2/3 bg-secondary rounded" />
      <div className="h-20 w-full bg-secondary rounded-2xl" />
    </div>
  );
}

export default function PropertyDetailPage() {
  const { id } = useParams();
  const { user, isAuthenticated, refreshUser } = useAuth();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(0);
  const [loanAmt, setLoanAmt] = useState(0);
  const [years, setYears] = useState(20);
  const [rate, setRate] = useState(8.5);

  // Reviews States
  const [reviewsList, setReviewsList] = useState([]);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState(null);

  // Saved status check
  const isSaved = user?.savedProperties?.some(
    (savedId) => (savedId?._id || savedId) === (property?._id || property?.id)
  ) || false;

  const requireAuth = (actionName) => {
    if (!isAuthenticated || !user) {
      toast.error(`Please login first to ${actionName}. Redirecting to login...`);
      setTimeout(() => {
        window.location.href = "/auth";
      }, 1500);
      return false;
    }
    return true;
  };

  const handleSaveToggle = async () => {
    if (!requireAuth("save properties")) return;
    const propId = property?._id || property?.id;
    try {
      const { data } = await api.post(`/users/save-property/${propId}`);
      if (data.success) {
        toast.success(data.message);
        await refreshUser();
      }
    } catch (err) {
      toast.error("Failed to update shortlist.");
    }
  };

  // Enquiry Form States
  const [enquiryName, setEnquiryName] = useState("");
  const [enquiryPhone, setEnquiryPhone] = useState("");
  const [enquiryMsg, setEnquiryMsg] = useState("I'm interested in this property.");
  const [submittingEnquiry, setSubmittingEnquiry] = useState(false);

  // Auto-fill fields if user is authenticated
  useEffect(() => {
    if (user) {
      setEnquiryName(user.name || "");
      let cleanPhone = user.phone || "";
      if (cleanPhone.startsWith("+91")) {
        cleanPhone = cleanPhone.slice(3);
      }
      setEnquiryPhone(cleanPhone);
    }
  }, [user]);

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/properties/${id}`);
        if (data.success) {
          setProperty(data.data);
          setReviewsList(data.data.reviews || []);

          // Silently increment views without blocking
          api.put(`/properties/${id}/view`).catch(console.error);
        }
      } catch (err) {
        console.error("Failed to load property details:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  // Auto-scroll images in property detail page slider
  useEffect(() => {
    if (!property) return;
    const pPhotos = property.photos && property.photos.length > 0 ? property.photos : (property.gallery || []);
    if (pPhotos.length <= 1) return;
    const timer = setInterval(() => {
      setActive((prev) => (prev + 1) % pPhotos.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [property]);

  useEffect(() => {
    if (property) {
      const priceVal = property.price || 0;
      setLoanAmt(priceVal ? Math.round(priceVal * 0.8) : 5000000);
    }
  }, [property]);

  if (loading) {
    return <PropertyDetailSkeleton />;
  }

  const p = property;
  if (!p) {
    return <Navigate to="/" replace />;
  }

  // Unified schema fields
  const title = p.title;
  const purpose = p.purpose;
  const type = p.type;
  const city = p.city;
  const locality = p.locality || p.area;
  const photos = p.photos && p.photos.length > 0 ? p.photos.map(resolveImage) : (p.gallery || []);
  const bedrooms = p.bedrooms || p.beds || 0;
  const bathrooms = p.bathrooms || p.baths || 0;
  const areaSqft = p.area || p.sqft || 0;
  const priceVal = p.price || 0;
  const priceLabel = formatPrice(p.price || p.priceLabel);
  const description = p.description || `Excellent ${type} located in premium locality of ${locality}, ${city}. Ideal investment opportunity with verified details.`;
  const amenities = (p.amenities && p.amenities.length > 0) ? p.amenities : ["Water Supply", "Power Backup", "Security", "Parking Slot"];

  const dealerName = p.dealer?.name || "Verified Agent";
  const dealerPhone = p.contactNumber || p.dealerPhone || p.dealer?.phone || "9876543210";
  const dealerInitial = dealerName.charAt(0).toUpperCase();
  const isDealerVerified = p.dealer?.verified || true;

  const handleWhatsApp = () => {
    const cleanPhone = dealerPhone.replace(/\D/g, "");
    const text = encodeURIComponent(`Hi, I'm interested in your property "${title}" listed on JKPlot.`);
    window.open(`https://wa.me/91${cleanPhone}?text=${text}`, "_blank");
  };

  const handleCall = () => {
    window.open(`tel:${dealerPhone}`, "_self");
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: `Check out this property: ${title} in ${city} on JKPlot`,
          url: window.location.href,
        });
      } catch (err) {
        console.log("Error sharing property:", err);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Property link copied to clipboard!");
    }
  };

  const handleEnquirySubmit = async (e) => {
    e.preventDefault();
    if (!requireAuth("request a callback")) return;
    if (!enquiryName.trim()) {
      toast.error("Please enter your name.");
      return;
    }
    const phoneDigits = enquiryPhone.replace(/\D/g, "");
    if (phoneDigits.length !== 10) {
      toast.error("Please enter a valid 10-digit mobile number.");
      return;
    }

    setSubmittingEnquiry(true);
    try {
      const { data } = await api.post("/enquiries", {
        propertyId: p._id || p.id,
        name: enquiryName.trim(),
        phone: phoneDigits,
        message: enquiryMsg.trim(),
      });
      if (data.success) {
        toast.success("Callback request sent successfully! The dealer will contact you soon.");
        setEnquiryMsg("I'm interested in this property.");
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || "Failed to send enquiry. Please try again.");
    } finally {
      setSubmittingEnquiry(false);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!requireAuth("submit a review")) return;
    if (!newComment.trim()) {
      toast.error("Please add a comment.");
      return;
    }

    setSubmittingReview(true);
    try {
      const propId = property?._id || property?.id;
      if (editingReviewId) {
        const { data } = await api.put(`/properties/${propId}/reviews/${editingReviewId}`, {
          rating: newRating,
          comment: newComment
        });
        if (data.success) {
          toast.success("Review updated successfully!");
          setReviewsList(data.data);
          setNewComment("");
          setNewRating(5);
          setEditingReviewId(null);
        }
      } else {
        const { data } = await api.post(`/properties/${propId}/reviews`, {
          rating: newRating,
          comment: newComment
        });
        if (data.success) {
          toast.success("Review posted successfully!");
          setReviewsList(data.data);
          setNewComment("");
          setNewRating(5);
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to submit review. Please try again.");
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleReviewDelete = async (reviewId) => {
    if (!requireAuth("delete reviews")) return;

    try {
      const propId = property?._id || property?.id;
      const { data } = await api.delete(`/properties/${propId}/reviews/${reviewId}`);
      if (data.success) {
        toast.success("Review deleted successfully!");
        setReviewsList(data.data);
        if (editingReviewId === reviewId) {
          setEditingReviewId(null);
          setNewComment("");
          setNewRating(5);
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to delete review. Please try again.");
    }
  };

  const startEditReview = (review) => {
    setEditingReviewId(review._id || review.id);
    setNewRating(review.rating);
    setNewComment(review.comment);
    const formElement = document.getElementById("review-form-section");
    if (formElement) {
      formElement.scrollIntoView({ behavior: "smooth" });
    }
  };

  const cancelEditReview = () => {
    setEditingReviewId(null);
    setNewRating(5);
    setNewComment("");
  };

  const monthlyRate = rate / 12 / 100;
  const months = years * 12;
  const emi =
    loanAmt > 0
      ? (loanAmt * monthlyRate * Math.pow(1 + monthlyRate, months)) /
        (Math.pow(1 + monthlyRate, months) - 1)
      : 0;

  const similar = [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Gallery Hero Slider */}
      <section className="container-px mx-auto max-w-7xl pt-6">
        <nav className="mb-4 text-xs text-muted-foreground">
          <Link to="/" className="hover:text-foreground">Home</Link> /{" "}
          <Link to="/properties" className="hover:text-foreground">Properties</Link> /{" "}
          <span className="text-foreground">{title}</span>
        </nav>
        
        <div className="relative h-[320px] sm:h-[420px] md:h-[500px] overflow-hidden rounded-2xl bg-muted group shadow-md border border-border">
          {photos.map((img, index) => (
            <img
              key={index}
              src={img}
              alt={`${title} slide ${index + 1}`}
              className={`absolute inset-0 h-full w-full object-cover transition-all duration-1000 ease-in-out ${
                index === active ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
              }`}
            />
          ))}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
          
          {/* Verified Badge */}
          {(p.verified || p.isActive) && (
            <span className="absolute left-4 top-4 flex items-center gap-1 rounded-full bg-success px-3 py-1.5 text-xs font-semibold text-success-foreground shadow-md z-10">
              <BadgeCheck className="h-3.5 w-3.5" /> Verified Listing
            </span>
          )}

          {/* Navigation Controls */}
          {photos.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActive((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-background/85 hover:bg-background backdrop-blur shadow-md transition text-foreground font-semibold opacity-0 group-hover:opacity-100 z-10"
                aria-label="Previous image"
              >
                &larr;
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActive((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-background/85 hover:bg-background backdrop-blur shadow-md transition text-foreground font-semibold opacity-0 group-hover:opacity-100 z-10"
                aria-label="Next image"
              >
                &rarr;
              </button>
              
              {/* Dots Indicators */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10 bg-black/45 backdrop-blur px-3 py-1.5 rounded-full">
                {photos.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActive(i)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      i === active ? "bg-accent w-5" : "bg-white/50 w-2 hover:bg-white/80"
                    }`}
                    aria-label={`Go to slide ${i + 1}`}
                  />
                ))}
              </div>

              {/* Counter Indicator */}
              <span className="absolute right-4 top-4 rounded-full bg-black/50 backdrop-blur px-3 py-1.5 text-[10px] font-bold text-white uppercase tracking-wider shadow z-10">
                {active + 1} / {photos.length}
              </span>
            </>
          )}
        </div>
      </section>

      <div className="container-px mx-auto grid max-w-7xl gap-8 py-8 lg:grid-cols-[1fr_360px]">
        {/* Main */}
        <div className="space-y-8">
          <div>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">
                  For {purpose} · {type}
                </span>
                <h1 className="mt-3 font-display text-3xl font-bold md:text-4xl">{title}</h1>
                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary uppercase tracking-wider">
                    <MapPin className="h-3.5 w-3.5" /> {city}
                  </span>
                  {locality && (
                    <span className="text-sm font-semibold text-muted-foreground">
                      · {locality}
                    </span>
                  )}
                  <span className="text-sm text-muted-foreground/60">
                    · Jammu &amp; Kashmir
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-center">
                  <span className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-sm font-semibold text-muted-foreground shadow-sm border border-border/50">
                    <Eye className="h-4 w-4" /> {p.views || 0} views
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                  onClick={handleSaveToggle}
                  className="grid h-10 w-10 place-items-center rounded-full border border-border hover:bg-secondary transition-transform hover:scale-105 active:scale-95"
                  title={isSaved ? "Saved" : "Save Property"}
                >
                  <Heart className={`h-4 w-4 ${isSaved ? "fill-destructive text-destructive" : ""}`} />
                </button>
                <button
                  onClick={handleShare}
                  className="grid h-10 w-10 place-items-center rounded-full border border-border hover:bg-secondary transition-transform hover:scale-105 active:scale-95"
                  title="Share Property"
                >
                  <Share2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-baseline gap-3">
              <div className="font-display text-4xl font-bold text-primary">{priceLabel}</div>
              {areaSqft > 0 && priceVal > 0 && (
                <div className="text-sm text-muted-foreground">· {Math.round(priceVal / areaSqft).toLocaleString()}/sqft</div>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 rounded-2xl border border-border bg-card p-5 sm:grid-cols-4">
            {[
              [Bed, bedrooms || "—", "Bedrooms"],
              [Bath, bathrooms || "—", "Bathrooms"],
              [Maximize, areaSqft ? areaSqft.toLocaleString() : "—", "Sq ft"],
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

          {/* Property Specifications details */}
          {(p.balconies > 0 || p.furnishing || p.parking || p.washrooms || p.contactNumber) && (
            <Section title="Property Specifications">
              <div className="grid grid-cols-2 gap-4 rounded-2xl border border-border bg-card p-5 sm:grid-cols-3">
                {p.balconies > 0 && (
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary shrink-0">
                      <Maximize className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px] uppercase tracking-wider font-bold">Balconies</span>
                      <span className="text-sm font-bold text-foreground">{p.balconies}</span>
                    </div>
                  </div>
                )}
                {p.furnishing && (
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary shrink-0">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px] uppercase tracking-wider font-bold">Furnishing</span>
                      <span className="text-sm font-bold text-foreground capitalize">{p.furnishing}</span>
                    </div>
                  </div>
                )}
                {p.parking && (
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary shrink-0">
                      <Car className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px] uppercase tracking-wider font-bold">Parking</span>
                      <span className="text-sm font-bold text-foreground capitalize">{p.parking}</span>
                    </div>
                  </div>
                )}
                {p.washrooms && (
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary shrink-0">
                      <Bath className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px] uppercase tracking-wider font-bold">Washrooms</span>
                      <span className="text-sm font-bold text-foreground">{p.washrooms}</span>
                    </div>
                  </div>
                )}
                {p.contactNumber && (
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary shrink-0">
                      <Phone className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px] uppercase tracking-wider font-bold">Contact Phone</span>
                      <span className="text-sm font-bold text-foreground">{p.contactNumber}</span>
                    </div>
                  </div>
                )}
              </div>
            </Section>
          )}

          {/* Description */}
          <Section title="About this property">
            <p className="leading-relaxed text-muted-foreground">{description}</p>
          </Section>

          {/* Video */}
          {p.video && (
            <Section title="Property Video Tour">
              <div className="aspect-[16/9] overflow-hidden rounded-2xl border border-border bg-black">
                <video src={resolveImage(p.video)} controls className="h-full w-full object-contain" />
              </div>
            </Section>
          )}

          {/* Amenities */}
          <Section title="Amenities">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {amenities.map((a) => {
                const IconComponent = getAmenityIcon(a);
                return (
                  <div
                    key={a}
                    className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 text-sm font-medium transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm"
                  >
                    <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary shrink-0">
                      <IconComponent className="h-4 w-4" />
                    </div>
                    <span className="truncate" title={a}>{a}</span>
                  </div>
                );
              })}
            </div>
          </Section>

          {/* Live Google Maps Embed */}
          <Section title="Location">
            <div className="aspect-[16/9] overflow-hidden rounded-2xl border border-border bg-muted shadow-inner">
              <iframe
                title="Google Maps Location"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                src={`https://maps.google.com/maps?q=${encodeURIComponent(locality + ", " + city)}&t=&z=14&ie=UTF8&iwloc=&output=embed`}
                loading="lazy"
                allowFullScreen
              />
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
                    max={priceVal || 100000000}
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

          {/* Reviews Section */}
          <Section title="Ratings & Reviews" icon={Star}>
            <div className="space-y-6 rounded-2xl border border-border bg-card p-6">
              {/* Average Stats */}
              <div className="flex flex-wrap items-center gap-6 border-b border-border pb-6">
                <div className="text-center">
                  <div className="text-4xl font-extrabold text-foreground flex items-center justify-center gap-1">
                    {reviewsList.length > 0
                      ? (reviewsList.reduce((acc, r) => acc + r.rating, 0) / reviewsList.length).toFixed(1)
                      : "0.0"}
                    <Star className="h-6 w-6 text-accent fill-accent" />
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {reviewsList.length} {reviewsList.length === 1 ? "review" : "reviews"}
                  </div>
                </div>

                <div className="flex-1 min-w-[200px] space-y-1.5 border-l border-border pl-6">
                  {[5, 4, 3, 2, 1].map((stars) => {
                    const count = reviewsList.filter((r) => r.rating === stars).length;
                    const percent = reviewsList.length > 0 ? (count / reviewsList.length) * 100 : 0;
                    return (
                      <div key={stars} className="flex items-center gap-3 text-xs">
                        <span className="w-3 font-semibold text-muted-foreground">{stars}</span>
                        <div className="flex-1 h-2 rounded bg-secondary overflow-hidden">
                          <div
                            className="h-full bg-accent transition-all duration-300"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <span className="w-6 text-right text-muted-foreground">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Reviews Feed */}
              {reviewsList.length > 0 ? (
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                  {reviewsList.map((r, i) => (
                    <div key={i} className="rounded-xl border border-border/60 bg-secondary/15 p-4 space-y-2">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                          <div className="grid h-8 w-8 place-items-center rounded-full bg-primary/10 text-primary text-xs font-bold uppercase">
                            {r.userName?.charAt(0) || "U"}
                          </div>
                          <div>
                            <div className="text-sm font-semibold">{r.userName}</div>
                            <div className="flex gap-0.5 mt-0.5">
                              {[...Array(5)].map((_, idx) => (
                                <Star
                                  key={idx}
                                  className={`h-3 w-3 ${
                                    idx < r.rating ? "text-accent fill-accent" : "text-border"
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-muted-foreground">
                            {new Date(r.createdAt).toLocaleDateString("en-IN", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                          {(r.userName === user?.name || user?.role === 'admin') && (
                            <div className="flex gap-1.5 ml-2 border-l border-border/80 pl-2">
                              <button
                                onClick={() => startEditReview(r)}
                                className="text-[10px] text-primary hover:underline font-bold"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleReviewDelete(r._id)}
                                className="text-[10px] text-destructive hover:underline font-bold"
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      <p className="text-sm leading-relaxed text-muted-foreground">{r.comment}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground text-sm">
                  No reviews yet. Be the first to share your experience!
                </div>
              )}

              {/* Add/Edit Review Form */}
              <div id="review-form-section" className="border-t border-border pt-6 space-y-4">
                <h3 className="text-sm font-bold text-foreground">
                  {editingReviewId ? "Edit Your Review" : "Write a Review"}
                </h3>
                {isAuthenticated ? (
                  <form onSubmit={handleReviewSubmit} className="space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-muted-foreground">Your Rating:</span>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((stars) => (
                          <button
                            key={stars}
                            type="button"
                            onClick={() => setNewRating(stars)}
                            className="p-1 transition-transform hover:scale-110"
                          >
                            <Star
                              className={`h-6 w-6 ${
                                stars <= newRating ? "text-accent fill-accent" : "text-border"
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <textarea
                        required
                        placeholder="Write your review here..."
                        rows={3}
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button
                        disabled={submittingReview}
                        type="submit"
                        className="rounded-xl px-6 bg-primary"
                      >
                        {submittingReview ? "Saving..." : editingReviewId ? "Update Review" : "Submit Review"}
                      </Button>
                      {editingReviewId && (
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={cancelEditReview}
                          className="rounded-xl px-4"
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </form>
                ) : (
                  <div className="rounded-xl bg-secondary/20 p-4 text-center">
                    <p className="text-xs text-muted-foreground mb-3">
                      Please login to submit your rating and review.
                    </p>
                    <Link to="/auth">
                      <Button size="sm" variant="outline" className="rounded-xl">
                        Log In
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </Section>
        </div>

        {/* Sticky contact */}
        <aside>
          <div className="sticky top-24 space-y-4">
            <div className="rounded-2xl border border-border bg-card p-5 shadow-card space-y-5">
              <div className="text-xs uppercase tracking-wider text-muted-foreground font-bold">
                Listed By Agent
              </div>
              
              <div className="flex items-center gap-3 bg-secondary/25 p-3 rounded-xl border border-border/50">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gradient-hero text-primary-foreground font-bold text-lg shadow-sm">
                  {dealerInitial}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold truncate text-foreground text-sm">{dealerName}</div>
                  {isDealerVerified && (
                    <div className="flex items-center gap-1 text-xs text-success font-medium mt-0.5">
                      <BadgeCheck className="h-3.5 w-3.5" /> Verified Agent
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Button onClick={handleWhatsApp} className="w-full gap-2 rounded-xl bg-success text-success-foreground hover:bg-success/90">
                  <MessageCircle className="h-4 w-4" /> WhatsApp Dealer
                </Button>
                <Button onClick={handleCall} variant="outline" className="w-full gap-2 rounded-xl">
                  <Phone className="h-4 w-4" /> Call: {dealerPhone}
                </Button>
              </div>

              <form onSubmit={handleEnquirySubmit} className="space-y-3 border-t border-border pt-4">
                <div className="text-xs uppercase tracking-wider text-muted-foreground font-bold">
                  Request Callback
                </div>
                <input
                  required
                  placeholder="Your name"
                  value={enquiryName}
                  onChange={(e) => setEnquiryName(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary transition duration-150"
                />
                <input
                  required
                  placeholder="Phone number"
                  value={enquiryPhone}
                  onChange={(e) => setEnquiryPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary transition duration-150"
                />
                <textarea
                  required
                  placeholder="I'm interested in this property..."
                  rows={3}
                  value={enquiryMsg}
                  onChange={(e) => setEnquiryMsg(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary transition duration-150"
                />
                <Button disabled={submittingEnquiry} type="submit" className="w-full rounded-xl bg-primary">
                  {submittingEnquiry ? "Sending Request..." : "Request a callback"}
                </Button>
                <p className="text-[10px] text-muted-foreground text-center">
                  Your details will only be shared with the publisher.
                </p>
              </form>
            </div>
          </div>
        </aside>
      </div>

      {/* Similar */}
      {similar.length > 0 && (
        <section className="container-px mx-auto max-w-7xl py-10">
          <h2 className="font-display text-2xl font-bold md:text-3xl">Similar properties in {city}</h2>
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
            <div className="font-display text-lg font-bold text-primary">{priceLabel}</div>
          </div>
          <Button onClick={handleWhatsApp} className="flex-1 gap-2 rounded-xl bg-success text-success-foreground">
            <MessageCircle className="h-4 w-4" /> WhatsApp
          </Button>
          <Button onClick={handleCall} className="flex-1 gap-2 rounded-xl bg-primary">
            <Phone className="h-4 w-4" /> Call
          </Button>
        </div>
      </div>
    </motion.div>
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
