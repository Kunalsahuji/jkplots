import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import api from "@/utils/api";
import { Star, ChevronLeft, Loader2, Home as HomeIcon, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PropertyReviewsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPropertyAndReviews = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/properties/${id}`);
        if (data.success) {
          setProperty(data.data);
        }
      } catch (err) {
        console.error("Failed to load property reviews:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPropertyAndReviews();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground font-medium">Loading reviews...</p>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-4">
        <p className="text-sm text-muted-foreground">Property listing not found</p>
        <Button onClick={() => navigate("/properties")}>Back to Listings</Button>
      </div>
    );
  }

  const reviewsList = property.reviews || [];
  const averageRating = reviewsList.length > 0
    ? (reviewsList.reduce((acc, r) => acc + r.rating, 0) / reviewsList.length).toFixed(1)
    : "0.0";

  return (
    <div className="min-h-screen bg-muted/30 pt-8 pb-20 text-slate-800">
      <div className="container-px mx-auto max-w-5xl">
        {/* Breadcrumb */}
        <div className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground">
            <HomeIcon className="h-4 w-4" />
          </Link>
          <ChevronLeft className="h-3.5 w-3.5 shrink-0" />
          <Link to="/properties" className="hover:text-foreground">Properties</Link>
          <ChevronLeft className="h-3.5 w-3.5 shrink-0" />
          <Link to={`/properties/${id}`} className="hover:text-foreground line-clamp-1 max-w-[200px]">{property.title}</Link>
          <ChevronLeft className="h-3.5 w-3.5 shrink-0" />
          <span className="font-semibold text-foreground">Reviews</span>
        </div>

        {/* Property Summary Header */}
        <div className="bg-background rounded-2xl border border-border p-6 shadow-sm mb-8 flex flex-col sm:flex-row gap-5 items-start sm:items-center justify-between">
          <div className="flex gap-4 items-center">
            <div className="h-16 w-20 overflow-hidden rounded-xl border border-border shrink-0 bg-muted">
              <img
                src={property.photos && property.photos[0] ? (property.photos[0].startsWith('http') ? property.photos[0] : `http://localhost:5000${property.photos[0]}`) : "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80"}
                alt={property.title}
                className="h-full w-full object-cover"
              />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold text-slate-900">{property.title}</h1>
              <p className="text-xs text-muted-foreground mt-0.5">{property.locality || property.area}, {property.city}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-xl">
            <span className="text-xl font-bold">{averageRating}</span>
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${i < Math.round(Number(averageRating)) ? "text-accent fill-accent" : "text-border"}`}
                />
              ))}
            </div>
            <span className="text-xs text-muted-foreground font-semibold">({reviewsList.length} reviews)</span>
          </div>
        </div>

        {/* Reviews Feed */}
        {reviewsList.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border p-12 text-center bg-background/50">
            <Star className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <h3 className="text-lg font-bold">No reviews yet</h3>
            <p className="text-xs text-muted-foreground mt-1">Be the first to leave a review directly on the property page.</p>
            <div className="mt-4">
              <Button onClick={() => navigate(`/properties/${id}`)} variant="outline">Go back to property</Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {reviewsList.map((r, i) => (
              <div key={i} className="rounded-2xl border border-border bg-card p-5 space-y-3 flex flex-col justify-between shadow-sm">
                <div>
                  <Quote className="h-5 w-5 text-accent opacity-60 mb-2" />
                  <p className="text-sm leading-relaxed text-slate-700 italic">"{r.comment}"</p>
                </div>
                <div className="pt-3 border-t border-border/50 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-sm text-foreground">{r.userName || "Anonymous User"}</div>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(r.createdAt).toLocaleDateString("en-IN", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, idx) => (
                      <Star
                        key={idx}
                        className={`h-3 w-3 ${idx < r.rating ? "text-accent fill-accent" : "text-border"}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
