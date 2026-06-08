import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Upload, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import api from "@/utils/api";

export default function EditPropertyPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading } = useAuth();

  const [fetching, setFetching] = useState(true);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [purpose, setPurpose] = useState("Buy");
  const [type, setType] = useState("Apartment");
  const [city, setCity] = useState("Srinagar");
  const [locality, setLocality] = useState("");
  const [bedrooms, setBedrooms] = useState("3");
  const [area, setArea] = useState("1200");
  const [price, setPrice] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [photos, setPhotos] = useState([]);

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        navigate(`/auth?redirect=/edit-property/${id}`);
      }
    }
  }, [isAuthenticated, isLoading, navigate, id]);

  useEffect(() => {
    const fetchPropertyDetails = async () => {
      try {
        const { data } = await api.get(`/properties/${id}`);
        if (data.success) {
          const p = data.data;
          // Verify ownership: must be the dealer who created it, or admin
          if (p.dealerPhone !== user?.phone && user?.role !== "admin") {
            toast.error("You are not authorized to edit this listing.");
            navigate("/dashboard");
            return;
          }
          setTitle(p.title || "");
          setDescription(p.description || "");
          setPurpose(p.purpose || "Buy");
          setType(p.type || "Apartment");
          setCity(p.city || "Srinagar");
          setLocality(p.locality || "");
          setBedrooms(String(p.bedrooms || 0));
          setArea(String(p.area || 0));
          setPrice(String(p.price || ""));
          
          let initialContact = p.contactNumber || "";
          if (initialContact.startsWith("+91")) {
            initialContact = initialContact.slice(3);
          }
          setContactNumber(initialContact);
          setPhotos(p.photos || []);
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to load property details for editing.");
        navigate("/dashboard");
      } finally {
        setFetching(false);
      }
    };

    if (user) {
      fetchPropertyDetails();
    }
  }, [id, user, navigate]);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotos((prev) => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate contactNumber: 10 digits starting with 6-9
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(contactNumber)) {
      toast.error("Contact number must be exactly 10 digits starting with 6-9.");
      return;
    }

    const finalTitle = title.trim() || `${bedrooms > 0 ? bedrooms + ' BHK ' : ''}${type} in ${locality}`;
    const numericPrice = Number(String(price).replace(/\D/g, "")) || 0;

    try {
      const { data } = await api.put(`/properties/${id}`, {
        title: finalTitle,
        description,
        purpose,
        type,
        city,
        locality,
        bedrooms: Number(bedrooms) || 0,
        area: Number(area) || 0,
        price: numericPrice,
        contactNumber: `+91${contactNumber}`,
        photos,
        dealerPhone: user?.phone
      });

      if (data.success) {
        toast.success("Property updated successfully!");
        navigate(user?.role === "admin" ? "/admin/dashboard" : "/dashboard");
      } else {
        toast.error(data.error || "Failed to update property.");
      }
    } catch (err) {
      const data = err.response?.data;
      toast.error(data?.error || "Failed to connect to backend server.");
    }
  };

  if (fetching || isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container-px mx-auto max-w-5xl py-12">
      <div className="text-center">
        <h1 className="font-display text-4xl font-bold md:text-5xl">Edit Property Listing</h1>
        <p className="mt-3 text-muted-foreground">Modify details or update photos for your property.</p>
      </div>

      <div className="mt-10 rounded-3xl border border-border bg-card p-6 md:p-10">
        <h2 className="font-display text-2xl font-bold">Property Details</h2>
        <p className="mt-1 text-sm text-muted-foreground">Change details of your listed property</p>

        <form onSubmit={handleSubmit} className="mt-6 grid gap-5 md:grid-cols-2">
          <div className="md:col-span-2">
            <Field label="Property Title (Optional)">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
                placeholder="e.g. Elegant 3 BHK Villa in Srinagar (leave empty to auto-generate)"
              />
            </Field>
          </div>

          <div className="md:col-span-2">
            <Field label="Description / Details">
              <textarea
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary resize-none"
                placeholder="Describe your property in detail (e.g., location advantages, facilities, condition)..."
              />
            </Field>
          </div>

          <Field label="I want to">
            <div className="flex gap-2">
              {[
                { label: "Sell", value: "Buy" },
                { label: "Rent", value: "Rent" }
              ].map((v) => (
                <button
                  key={v.value}
                  type="button"
                  onClick={() => setPurpose(v.value)}
                  className={`flex-1 rounded-xl border-2 py-3 text-sm font-semibold transition ${
                    purpose === v.value
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card hover:bg-secondary"
                  }`}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Property type">
            <select
              value={type}
              onChange={(e) => {
                const val = e.target.value;
                setType(val);
                if (val === "Plot" || val === "Commercial") {
                  setBedrooms("0");
                }
              }}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm"
            >
              <option value="Apartment">Apartment</option>
              <option value="Villa">Villa</option>
              <option value="Plot">Plot</option>
              <option value="Commercial">Commercial</option>
            </select>
          </Field>
          <Field label="City">
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm"
            >
              <option value="Srinagar">Srinagar</option>
              <option value="Jammu">Jammu</option>
              <option value="Gulmarg">Gulmarg</option>
              <option value="Pahalgam">Pahalgam</option>
            </select>
          </Field>
          <Field label="Locality / Area">
            <input
              required
              value={locality}
              onChange={(e) => setLocality(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
              placeholder="e.g. Rajbagh"
            />
          </Field>
          {(type === "Apartment" || type === "Villa") && (
            <Field label="Bedrooms">
              <input
                type="number"
                value={bedrooms}
                onChange={(e) => setBedrooms(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
                placeholder="3"
              />
            </Field>
          )}
          <Field label="Area (sqft)">
            <input
              type="number"
              required
              value={area}
              onChange={(e) => setArea(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
              placeholder="1200"
            />
          </Field>
          <Field label="Expected price">
            <input
              required
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
              placeholder="e.g. 9500000"
            />
          </Field>
          <Field label="Contact number">
            <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-3 text-sm focus-within:border-primary">
              <span className="text-muted-foreground font-medium select-none">+91</span>
              <input
                required
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                className="flex-1 bg-transparent outline-none"
                maxLength={10}
                placeholder="10-digit mobile number"
              />
            </div>
          </Field>

          <div className="md:col-span-2 mt-4">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Upload photos
            </div>
            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-secondary/40 py-12 text-center transition hover:border-primary hover:bg-primary-soft/30">
              <Upload className="h-8 w-8 text-muted-foreground" />
              <div className="text-sm font-medium">Drop photos or click to upload</div>
              <div className="text-xs text-muted-foreground">JPG, PNG up to 10MB · Add multiple photos</div>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>

            {photos.length > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-6">
                {photos.map((p, i) => (
                  <div key={i} className="group relative aspect-square overflow-hidden rounded-xl border border-border bg-muted">
                    <img src={p} alt="Preview" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setPhotos((prev) => prev.filter((_, idx) => idx !== i))}
                      className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-destructive/80 text-white opacity-90 transition hover:bg-destructive hover:scale-105"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="md:col-span-2 mt-8 flex flex-wrap items-center justify-between gap-3">
            <Button type="submit" className="rounded-full bg-primary px-8 py-6 text-base font-semibold">
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
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
