import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "@/utils/api";
import { Star, Quote, ChevronLeft, ChevronRight, Loader2, Home as HomeIcon } from "lucide-react";

export default function ReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ratingFilter, setRatingFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 12;

  useEffect(() => {
    const fetchReviews = async () => {
      setLoading(true);
      try {
        let url = `/reviews?limit=${limit}&page=${page}`;
        if (ratingFilter !== "all") {
          url += `&rating=${ratingFilter}`;
        }
        
        const { data } = await api.get(url);
        if (data.success) {
          setReviews(data.data);
          // If backend supports pagination it should send total count or totalPages
          // We'll calculate simple pages if backend only sends 'count'
          const count = data.pagination?.total || data.count || 0;
          setTotalPages(Math.ceil(count / limit) || 1);
        }
      } catch (err) {
        console.error("Failed to load reviews:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, [page, ratingFilter]);

  return (
    <div className="min-h-screen bg-muted/30 pt-8 pb-20">
      <div className="container-px mx-auto max-w-7xl">
        {/* Breadcrumb */}
        <div className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground">
            <HomeIcon className="h-4 w-4" />
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-medium text-foreground">Platform Reviews</span>
        </div>

        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="font-display text-4xl font-bold tracking-tight md:text-5xl">
              Platform Reviews
            </h1>
            <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
              See what our community of buyers, sellers, and dealers are saying about JKPlot.
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2 bg-background p-2 rounded-2xl shadow-sm border border-border">
            <button
              onClick={() => { setRatingFilter("all"); setPage(1); }}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                ratingFilter === "all" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
              }`}
            >
              All
            </button>
            {[5, 4, 3, 2, 1].map(stars => (
              <button
                key={stars}
                onClick={() => { setRatingFilter(stars); setPage(1); }}
                className={`flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
                  ratingFilter === stars ? "bg-primary text-primary-foreground" : "hover:bg-muted text-foreground/80"
                }`}
              >
                {stars} <Star className={`h-3.5 w-3.5 ${ratingFilter === stars ? "fill-current" : "fill-accent text-accent"}`} />
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid place-items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : reviews.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border p-12 text-center bg-background/50">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-primary/10 text-primary">
              <Star className="h-8 w-8 fill-primary" />
            </div>
            <h3 className="mt-4 text-xl font-bold">No reviews found</h3>
            <p className="mt-2 text-muted-foreground">Try selecting a different star rating.</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {reviews.map((r, idx) => (
              <div key={idx} className="rounded-2xl border border-border bg-card p-6 flex flex-col shadow-sm hover:shadow-md transition">
                <Quote className="h-6 w-6 text-accent mb-3 opacity-80" />
                <p className="text-sm leading-relaxed flex-grow italic text-foreground/90">"{r.comment}"</p>
                <div className="mt-5 pt-4 border-t border-border/50">
                  <div className="flex items-center gap-1 text-accent mb-2">
                    {Array.from({ length: r.rating || 5 }).map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-current" />
                    ))}
                    {Array.from({ length: 5 - (r.rating || 5) }).map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 text-muted/30" />
                    ))}
                  </div>
                  <div className="font-bold text-sm text-foreground">{r.user?.name || "Verified User"}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {new Date(r.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="mt-12 flex justify-center items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-background hover:bg-muted disabled:opacity-50 transition"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="px-4 font-semibold text-sm">
              Page {page} of {totalPages}
            </div>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-background hover:bg-muted disabled:opacity-50 transition"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
