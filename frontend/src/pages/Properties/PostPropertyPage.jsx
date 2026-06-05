import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Upload, Check } from "lucide-react";
import { toast } from "sonner";

export default function PostPropertyPage() {
  const navigate = useNavigate();

  const [purpose, setPurpose] = useState("Buy");
  const [type, setType] = useState("Apartment");
  const [city, setCity] = useState("Srinagar");
  const [locality, setLocality] = useState("");
  const [bedrooms, setBedrooms] = useState("3");
  const [area, setArea] = useState("1200");
  const [price, setPrice] = useState("₹95,00,000");
  const [contactNumber, setContactNumber] = useState("");

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      navigate("/auth?redirect=/post-property");
      return;
    }
    const user = JSON.parse(userStr);
    if (user.role !== "dealer") {
      toast.error("Only dealers can post properties.");
      navigate("/");
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const userStr = localStorage.getItem("user");
    const user = userStr ? JSON.parse(userStr) : null;

    const title = `${bedrooms > 0 ? bedrooms + ' BHK ' : ''}${type} in ${locality}`;

    try {
      const response = await fetch("http://localhost:5000/api/properties", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          title,
          purpose,
          type,
          city,
          locality,
          bedrooms: Number(bedrooms) || 0,
          area: Number(area) || 0,
          price,
          contactNumber,
          dealerPhone: user ? user.phone : ""
        })
      });

      const resData = await response.json();
      if (resData.success) {
        toast.success("Property listed successfully!");
        navigate("/");
      } else {
        toast.error(resData.error || "Failed to post property.");
      }
    } catch (err) {
      toast.error("Failed to connect to backend server.");
    }
  };

  const steps = ["Basic Details", "Location", "Property Info", "Photos & Pricing", "Publish"];

  return (
    <div className="container-px mx-auto max-w-5xl py-12">
      <div className="text-center">
        <span className="rounded-full bg-accent/20 px-3 py-1 text-xs font-semibold text-accent-foreground">
          100% FREE LISTING
        </span>
        <h1 className="mt-4 font-display text-4xl font-bold md:text-5xl">Sell or rent your property faster</h1>
        <p className="mt-3 text-muted-foreground">Reach thousands of verified buyers across J&amp;K in minutes.</p>
      </div>

      {/* Stepper */}
      <div className="mt-10 hidden items-center justify-between md:flex">
        {steps.map((s, i) => (
          <div key={s} className="flex flex-1 items-center">
            <div
              className={`grid h-9 w-9 place-items-center rounded-full text-xs font-bold ${
                i === 0 ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
              }`}
            >
              {i + 1}
            </div>
            <div className="ml-2 text-sm font-medium">{s}</div>
            {i < steps.length - 1 && <div className="mx-3 h-px flex-1 bg-border" />}
          </div>
        ))}
      </div>

      <div className="mt-10 rounded-3xl border border-border bg-card p-6 md:p-10">
        <h2 className="font-display text-2xl font-bold">Basic details</h2>
        <p className="mt-1 text-sm text-muted-foreground">Tell us about your property</p>

        <form onSubmit={handleSubmit} className="mt-6 grid gap-5 md:grid-cols-2">
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
                } else {
                  setBedrooms("3");
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
              placeholder="₹95,00,000"
            />
          </Field>
          <Field label="Contact number">
            <input
              required
              value={contactNumber}
              onChange={(e) => setContactNumber(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
              placeholder="+91"
            />
          </Field>

          <div className="md:col-span-2 mt-4">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Upload photos
            </div>
            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-secondary/40 py-12 text-center transition hover:border-primary hover:bg-primary-soft/30">
              <Upload className="h-8 w-8 text-muted-foreground" />
              <div className="text-sm font-medium">Drop photos or click to upload</div>
              <div className="text-xs text-muted-foreground">JPG, PNG up to 10MB · Add at least 5 photos</div>
            </label>
          </div>

          <div className="md:col-span-2 mt-8 flex flex-wrap items-center justify-between gap-3">
            <ul className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
              {["Free forever", "Verified listing badge", "WhatsApp leads"].map((f) => (
                <li key={f} className="flex items-center gap-1">
                  <Check className="h-3.5 w-3.5 text-success" /> {f}
                </li>
              ))}
            </ul>
            <Button type="submit" className="rounded-full bg-primary px-8 py-6 text-base font-semibold">
              Submit Property
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
