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
import { useState, useEffect } from "react";
import api from "@/utils/api";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

const formatPrice = (val) => {
  if (!val) return "₹—";
  if (typeof val === "string") return val;
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(1)} L`;
  return `₹${val.toLocaleString()}`;
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
  const { user, isAuthenticated } = useAuth();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(0);
  const [loanAmt, setLoanAmt] = useState(0);
  const [years, setYears] = useState(20);
  const [rate, setRate] = useState(8.5);

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
    const mock = properties.find((x) => x.id === id);
    if (mock) {
      setProperty(mock);
      setLoading(false);
      return;
    }

    const fetchDetail = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/properties/${id}`);
        if (data.success) {
          setProperty(data.data);
        }
      } catch (err) {
        console.error("Failed to load property details:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

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

  const handleEnquirySubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error("Please login to request a callback.");
      return;
    }
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
          <span className="text-foreground">{title}</span>
        </nav>
        <div className="grid gap-3 md:grid-cols-[2fr_1fr]">
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-muted md:aspect-[16/10]">
            <img src={photos[active] || resolveImage(null)} alt={title} className="h-full w-full object-cover" />
            {(p.verified || p.isActive) && (
              <span className="absolute left-4 top-4 flex items-center gap-1 rounded-full bg-success px-3 py-1.5 text-xs font-semibold text-success-foreground">
                <BadgeCheck className="h-3.5 w-3.5" /> Verified
              </span>
            )}
          </div>
          <div className="grid grid-cols-3 gap-3 md:grid-cols-1">
            {photos.slice(0, 3).map((g, i) => (
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
                  For {purpose} · {type}
                </span>
                <h1 className="mt-3 font-display text-3xl font-bold md:text-4xl">{title}</h1>
                <p className="mt-2 flex items-center gap-1.5 text-muted-foreground">
                  <MapPin className="h-4 w-4" /> {locality}, {city}
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
              [Bath, p.baths || "—", "Bathrooms"],
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
          {(bedrooms > 0 || p.bathrooms > 0 || p.balconies > 0 || p.furnishing || p.parking || p.washrooms || p.contactNumber) && (
            <Section title="Property Specifications">
              <div className="grid grid-cols-2 gap-4 rounded-2xl border border-border bg-card p-5 sm:grid-cols-3">
                {bedrooms > 0 && (
                  <div>
                    <span className="text-muted-foreground block text-xs uppercase tracking-wider font-semibold">Bedrooms</span>
                    <span className="text-sm font-semibold text-foreground">{bedrooms}</span>
                  </div>
                )}
                {p.bathrooms > 0 && (
                  <div>
                    <span className="text-muted-foreground block text-xs uppercase tracking-wider font-semibold">Bathrooms</span>
                    <span className="text-sm font-semibold text-foreground">{p.bathrooms}</span>
                  </div>
                )}
                {p.balconies > 0 && (
                  <div>
                    <span className="text-muted-foreground block text-xs uppercase tracking-wider font-semibold">Balconies</span>
                    <span className="text-sm font-semibold text-foreground">{p.balconies}</span>
                  </div>
                )}
                {p.furnishing && (
                  <div>
                    <span className="text-muted-foreground block text-xs uppercase tracking-wider font-semibold">Furnishing</span>
                    <span className="text-sm font-semibold text-foreground">{p.furnishing}</span>
                  </div>
                )}
                {p.parking && (
                  <div>
                    <span className="text-muted-foreground block text-xs uppercase tracking-wider font-semibold">Parking</span>
                    <span className="text-sm font-semibold text-foreground">{p.parking}</span>
                  </div>
                )}
                {p.washrooms && (
                  <div>
                    <span className="text-muted-foreground block text-xs uppercase tracking-wider font-semibold">Washrooms</span>
                    <span className="text-sm font-semibold text-foreground">{p.washrooms}</span>
                  </div>
                )}
                {p.contactNumber && (
                  <div>
                    <span className="text-muted-foreground block text-xs uppercase tracking-wider font-semibold">Contact Phone</span>
                    <span className="text-sm font-semibold text-foreground">{p.contactNumber}</span>
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
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {amenities.map((a) => (
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
                  {locality}, {city}
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
        </div>

        {/* Sticky contact */}
        <aside>
          <div className="sticky top-24 space-y-4">
            <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-full bg-gradient-hero text-primary-foreground font-bold">
                  {dealerInitial}
                </div>
                <div className="flex-1">
                  <div className="font-semibold">{dealerName}</div>
                  {isDealerVerified && (
                    <div className="flex items-center gap-1 text-xs text-success">
                      <BadgeCheck className="h-3 w-3" /> Verified Dealer
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-5 space-y-2">
                <Button onClick={handleWhatsApp} className="w-full gap-2 rounded-xl bg-success text-success-foreground hover:bg-success/90">
                  <MessageCircle className="h-4 w-4" /> WhatsApp Dealer
                </Button>
                <Button onClick={handleCall} variant="outline" className="w-full gap-2 rounded-xl">
                  <Phone className="h-4 w-4" /> {dealerPhone}
                </Button>
              </div>
              <form onSubmit={handleEnquirySubmit} className="mt-4 space-y-2 border-t border-border pt-4">
                <input
                  required
                  placeholder="Your name"
                  value={enquiryName}
                  onChange={(e) => setEnquiryName(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
                />
                <input
                  required
                  placeholder="Phone number"
                  value={enquiryPhone}
                  onChange={(e) => setEnquiryPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
                />
                <textarea
                  required
                  placeholder="I'm interested in this property..."
                  rows={3}
                  value={enquiryMsg}
                  onChange={(e) => setEnquiryMsg(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
                />
                <Button disabled={submittingEnquiry} type="submit" className="w-full rounded-xl bg-primary">
                  {submittingEnquiry ? "Sending Request..." : "Request a callback"}
                </Button>
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
