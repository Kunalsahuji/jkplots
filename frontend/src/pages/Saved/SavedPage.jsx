import { useEffect, useState } from "react";
import { PropertyCard } from "@/components/site/PropertyCard";
import { useAuth } from "@/context/AuthContext";
import { Heart, Inbox } from "lucide-react";
import { Link } from "react-router-dom";
import api from "@/utils/api";
import { motion } from "framer-motion";
import { PropertyGridSkeleton } from "@/components/site/Skeletons";

export default function SavedPage() {
  const { user } = useAuth();
  const [allProperties, setAllProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const { data } = await api.get("/properties");
        if (data.success) {
          setAllProperties(data.data);
        }
      } catch (err) {
        console.error("Failed to load saved properties:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProperties();
  }, []);

  const savedList = allProperties.filter((p) =>
    user?.savedProperties?.some((savedId) => (savedId?._id || savedId) === p._id)
  );

  return (
    <div className="container-px mx-auto max-w-7xl py-10 min-h-[70vh]">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center gap-3"
      >
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-destructive/10 text-destructive">
          <Heart className="h-5 w-5 fill-current" />
        </div>
        <div>
          <h1 className="font-display text-3xl font-bold">Saved Properties</h1>
          <p className="mt-0.5 text-xs text-muted-foreground uppercase tracking-wider font-semibold">
            {savedList.length} {savedList.length === 1 ? "listing" : "listings"} favorited by you
          </p>
        </div>
      </motion.div>

      {loading ? (
        <div className="mt-8">
          <PropertyGridSkeleton count={4} />
        </div>
      ) : savedList.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="mt-12 rounded-3xl border border-dashed border-border bg-card p-12 text-center"
        >
          <Inbox className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm font-semibold text-foreground">Your shortlist is empty</p>
          <p className="text-xs text-muted-foreground mt-1">
            Tap the heart icon on properties while exploring to save them here.
          </p>
          <Link
            to="/properties"
            className="inline-flex items-center gap-1 mt-4 rounded-xl bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground shadow-md hover:scale-[1.02] transition-transform"
          >
            Explore Listings
          </Link>
        </motion.div>
      ) : (
        <motion.div
          initial="hidden"
          animate="show"
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: {
                staggerChildren: 0.08
              }
            }
          }}
          className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        >
          {savedList.map((p) => (
            <motion.div
              key={p._id || p.id}
              variants={{
                hidden: { opacity: 0, y: 15 },
                show: { opacity: 1, y: 0 }
              }}
            >
              <PropertyCard p={p} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
