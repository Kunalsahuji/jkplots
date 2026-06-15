import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Upload, Check, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import api from "@/utils/api";

const locations = [
  {
    district: "Jammu",
    cities: [
      "Jammu",
      "Akhnoor",
      "R.S. Pura",
      "Bishnah"
    ]
  },
  {
    district: "Srinagar",
    cities: [
      "Srinagar"
    ]
  },
  {
    district: "Kathua",
    cities: [
      "Kathua",
      "Lakhanpur",
      "Billawar"
    ]
  },
  {
    district: "Udhampur",
    cities: [
      "Udhampur",
      "Chenani",
      "Ramnagar"
    ]
  },
  {
    district: "Anantnag",
    cities: [
      "Anantnag",
      "Pahalgam",
      "Bijbehara"
    ]
  },
  {
    district: "Baramulla",
    cities: [
      "Baramulla",
      "Sopore",
      "Uri"
    ]
  }
];

const predefinedAmenities = [
  "Security / Fire Alarm",
  "Visitor Parking",
  "Fitness Centre / GYM",
  "Centrally Air Conditioned",
  "Intercom Facility",
  "Maintenance Staff",
  "Vaastu Compliant",
  "Rain Water Harvesting",
  "Piped-gas",
  "Bank Attached Property",
  "Recently Renovated",
  "High Ceiling Height",
  "False Ceiling Lighting"
];

export default function EditPropertyPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading } = useAuth();

  const [fetching, setFetching] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [draggedIdx, setDraggedIdx] = useState(null);
  const fetchedRef = useRef(false);

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [purpose, setPurpose] = useState("Buy");
  const [type, setType] = useState("Flat/Apartment");
  
  // Location states
  const [stateName, setStateName] = useState("Jammu and Kashmir");
  const [division, setDivision] = useState("Kashmir");
  const [district, setDistrict] = useState("Srinagar");
  const [city, setCity] = useState("Srinagar");
  const [locality, setLocality] = useState("");
  const [dbCities, setDbCities] = useState([]);

  useEffect(() => {
    const fetchDbCities = async () => {
      try {
        const { data } = await api.get("/cities");
        if (data.success && data.data.length > 0) {
          setDbCities(data.data);
        }
      } catch (err) {
        console.error("Failed to load cities from DB", err);
      }
    };
    fetchDbCities();
  }, []);

  // Property info states
  const [bedrooms, setBedrooms] = useState("");
  const [bathrooms, setBathrooms] = useState("");
  const [balconies, setBalconies] = useState("");
  const [furnishing, setFurnishing] = useState("");
  const [parking, setParking] = useState("");
  const [washrooms, setWashrooms] = useState("");
  const [area, setArea] = useState("");

  // Amenities states
  const [amenitiesList, setAmenitiesList] = useState([]);
  const [customAmenity, setCustomAmenity] = useState("");
  const [customAmenities, setCustomAmenities] = useState([]);

  // Photos & Pricing states
  const [price, setPrice] = useState("");
  const [photos, setPhotos] = useState([]);
  const [video, setVideo] = useState("");

  // Contact / Publish states
  const [contactNumber, setContactNumber] = useState("");

  const [errors, setErrors] = useState({});

  const cleanNumeric = (val) => val.replace(/\D/g, "");
  const cleanTextOnly = (val) => val.replace(/[0-9]/g, "");

  const handleDragStart = (e, index) => {
    setDraggedIdx(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
  };

  const handleDrop = (e, targetIdx) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === targetIdx) return;
    setPhotos((prev) => {
      const copy = [...prev];
      const draggedItem = copy[draggedIdx];
      copy.splice(draggedIdx, 1);
      copy.splice(targetIdx, 0, draggedItem);
      return copy;
    });
  };

  const handleDragEnd = () => {
    setDraggedIdx(null);
  };

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        navigate(`/auth?redirect=/edit-property/${id}`);
      }
    }
  }, [isAuthenticated, isLoading, navigate, id]);

  useEffect(() => {
    const fetchPropertyDetails = async () => {
      if (fetchedRef.current) return;
      fetchedRef.current = true;
      try {
        const { data } = await api.get(`/properties/${id}`);
        if (data.success) {
          const p = data.data;
          // Verify ownership: must be the dealer who created it, or admin/superadmin
          if (p.dealerPhone !== user?.phone && user?.role !== "admin" && user?.role !== "superadmin") {
            toast.error("You are not authorized to edit this listing.");
            navigate("/dashboard");
            return;
          }
          setTitle(p.title || "");
          setDescription(p.description || "");
          setPurpose(p.purpose || "Buy");
          setType(p.type || "Flat/Apartment");
          
          setStateName(p.state || "Jammu and Kashmir");
          setDivision(p.division || "Kashmir");
          setDistrict(p.district || "Srinagar");
          setCity(p.city || "Srinagar");
          setLocality(p.locality || "");
          
          setBedrooms(p.bedrooms ? String(p.bedrooms) : "");
          setBathrooms(p.bathrooms ? String(p.bathrooms) : "");
          setBalconies(p.balconies ? String(p.balconies) : "");
          setFurnishing(p.furnishing || "");
          setParking(p.parking || "");
          setWashrooms(p.washrooms || "");
          setArea(p.area ? String(p.area) : "");
          
          // Split amenities into predefined and custom
          const loadedAmenities = p.amenities || [];
          const matched = loadedAmenities.filter(a => predefinedAmenities.includes(a));
          const customs = loadedAmenities.filter(a => !predefinedAmenities.includes(a));
          setAmenitiesList(matched);
          setCustomAmenities(customs);

          setPrice(p.price ? String(p.price) : "");
          setVideo(p.video || "");
          
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

  const isResidentialBuilding = ["Flat/Apartment", "Independent House / Villa", "Independent / Builder Floor"].includes(type);
  const isCommercialBuilding = ["Office", "Industry", "Retail"].includes(type);

  // Keep division, district, and city in sync
  const getDistrictsForDivision = (div) => {
    if (div === "Jammu") {
      return ["Jammu", "Kathua", "Udhampur"];
    } else {
      return ["Srinagar", "Anantnag", "Baramulla"];
    }
  };

  const getCitiesForDistrict = (dist) => {
    const found = locations.find(l => l.district === dist);
    return found ? found.cities : [];
  };

  const handleDivisionChange = (div) => {
    setDivision(div);
    const districts = getDistrictsForDivision(div);
    const defaultDist = districts[0];
    setDistrict(defaultDist);
    const cities = getCitiesForDistrict(defaultDist);
    setCity(cities[0] || "");
  };

  const handleDistrictChange = (dist) => {
    setDistrict(dist);
    const cities = getCitiesForDistrict(dist);
    setCity(cities[0] || "");
  };

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

  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) { // 50MB limit
        toast.error("Video size cannot exceed 50MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setVideo(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAmenityToggle = (amenity) => {
    if (amenitiesList.includes(amenity)) {
      setAmenitiesList((prev) => prev.filter((a) => a !== amenity));
    } else {
      setAmenitiesList((prev) => [...prev, amenity]);
    }
  };

  const handleAddCustomAmenity = () => {
    const trimmed = customAmenity.trim();
    if (!trimmed) return;
    if (customAmenities.includes(trimmed) || amenitiesList.includes(trimmed)) {
      toast.error("Amenity already added.");
      return;
    }
    setCustomAmenities((prev) => [...prev, trimmed]);
    setCustomAmenity("");
  };

  const validateStep = (step) => {
    const errs = {};
    if (step === 0) {
      if (!title.trim()) {
        errs.title = "Property title is required.";
      } else if (title.trim().length < 10 || title.trim().length > 120) {
        errs.title = "Title must be between 10–120 characters.";
      }
      if (!description.trim()) {
        errs.description = "Description is required.";
      } else if (description.trim().length < 30) {
        errs.description = "Description must be at least 30 characters.";
      } else if (description.trim().length > 2000) {
        errs.description = "Description cannot exceed 2000 characters.";
      }
    } else if (step === 1) {
      if (!locality.trim()) {
        errs.locality = "Locality / Area is required.";
      }
    } else if (step === 2) {
      if (isResidentialBuilding) {
        const beds = Number(bedrooms);
        if (bedrooms === "" || isNaN(beds) || beds < 0) {
          errs.bedrooms = "Bedrooms must be 0 or more.";
        }
        const baths = Number(bathrooms);
        if (bathrooms !== "" && (isNaN(baths) || baths < 0)) {
          errs.bathrooms = "Bathrooms must be 0 or more.";
        }
        const balcs = Number(balconies);
        if (balconies !== "" && (isNaN(balcs) || balcs < 0)) {
          errs.balconies = "Balconies must be 0 or more.";
        }
      }
      const sqft = Number(area);
      if (!area || isNaN(sqft) || sqft <= 0) {
        errs.area = "Area must be greater than 0.";
      }
      const numericPrice = Number(String(price).replace(/\D/g, ""));
      if (price === "" || isNaN(numericPrice) || numericPrice <= 0) {
        errs.price = "Price must be a positive number.";
      }
    } else if (step === 4) {
      if (photos.length === 0) {
        errs.photos = "Please upload at least one photo.";
      }
    } else if (step === 5) {
      const phoneRegex = /^[6-9]\d{9}$/;
      if (!phoneRegex.test(contactNumber)) {
        errs.contactNumber = "Enter a valid contact number.";
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleStepClick = (targetStep) => {
    if (targetStep < currentStep) {
      setCurrentStep(targetStep);
      return;
    }
    // Validate incrementally to reach the targetStep
    let valid = true;
    for (let s = currentStep; s < targetStep; s++) {
      if (!validateStep(s)) {
        valid = false;
        break;
      }
    }
    if (valid) {
      setCurrentStep(targetStep);
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => prev - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateStep(currentStep) || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    const numericPrice = Number(String(price).replace(/\D/g, ""));

    try {
      const { data } = await api.put(`/properties/${id}`, {
        title: title.trim(),
        description,
        purpose,
        type,
        propertyType: type,
        state: stateName,
        division,
        district,
        city,
        locality,
        bedrooms: isResidentialBuilding ? (Number(bedrooms) || 0) : 0,
        bathrooms: isResidentialBuilding ? (Number(bathrooms) || 0) : 0,
        balconies: isResidentialBuilding ? (Number(balconies) || 0) : 0,
        furnishing: (isResidentialBuilding || isCommercialBuilding) ? furnishing : "",
        parking: (isResidentialBuilding || isCommercialBuilding) ? parking : "",
        washrooms: isCommercialBuilding ? washrooms : "",
        amenities: [...amenitiesList, ...customAmenities],
        area: Number(area) || 0,
        price: numericPrice,
        contactNumber: `+91${contactNumber}`,
        photos,
        video,
        dealerPhone: user?.phone
      });

      if (data.success) {
        toast.success("Property updated successfully!");
        navigate(user?.role === "admin" || user?.role === "superadmin" ? "/admin/properties" : "/dashboard");
      } else {
        toast.error(data.error || "Failed to update property.");
      }
    } catch (err) {
      const data = err.response?.data;
      if (data?.errors) {
        const backendErrs = {};
        data.errors.forEach(e => {
          backendErrs[e.field] = e.message;
        });
        setErrors(backendErrs);
        // Map back to step with error
        if (backendErrs.title || backendErrs.description || backendErrs.purpose || backendErrs.type) {
          setCurrentStep(0);
        } else if (backendErrs.state || backendErrs.division || backendErrs.district || backendErrs.city || backendErrs.locality) {
          setCurrentStep(1);
        } else if (backendErrs.bedrooms || backendErrs.bathrooms || backendErrs.balconies || backendErrs.furnishing || backendErrs.parking || backendErrs.washrooms || backendErrs.area || backendErrs.price) {
          setCurrentStep(2);
        } else if (backendErrs.amenities) {
          setCurrentStep(3);
        } else if (backendErrs.photos || backendErrs.video) {
          setCurrentStep(4);
        } else if (backendErrs.contactNumber) {
          setCurrentStep(5);
        }
      } else {
        toast.error(data?.error || "Failed to connect to backend server.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = ["Basic Details", "Location", "Property Info", "Amenities", "Photos & Video", "Publish"];

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
        <p className="mt-3 text-muted-foreground">Modify details, pricing or update media files for your property.</p>
      </div>

      {/* Target & Property Type selectors above the box */}
      <div className="mt-8 rounded-3xl border border-border bg-card p-6 md:p-8 shadow-sm max-w-3xl mx-auto">
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">I want to</div>
            <div className="flex gap-2">
              {[
                { label: "Sell", value: "Buy" },
                { label: "Rent", value: "Rent" },
                { label: "Commercial", value: "Commercial" }
              ].map((v) => (
                <button
                  key={v.value}
                  type="button"
                  disabled={currentStep > 0}
                  onClick={() => {
                    setPurpose(v.value);
                    if (v.value === "Commercial") {
                      setType("Office");
                      setBedrooms("0");
                      setBathrooms("0");
                      setBalconies("0");
                      setWashrooms("Private");
                    } else {
                      setType("Flat/Apartment");
                      setBedrooms("");
                      setBathrooms("");
                      setBalconies("");
                    }
                  }}
                  className={`flex-1 rounded-xl border-2 py-3.5 text-sm font-semibold transition ${
                    currentStep > 0
                      ? "opacity-50 cursor-not-allowed border-border bg-background text-muted-foreground"
                      : purpose === v.value
                      ? "border-primary bg-primary text-primary-foreground shadow"
                      : "border-border bg-background text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  {v.label}
                </button>
              ))}
            </div>
            {currentStep > 0 && (
              <p className="mt-1 text-[10px] text-muted-foreground">Go back to Basic Details to change</p>
            )}
          </div>

          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Property Type</div>
            <select
              value={type}
              disabled={currentStep > 0}
              onChange={(e) => {
                const val = e.target.value;
                setType(val);
                if (!["Flat/Apartment", "Independent House / Villa", "Independent / Builder Floor"].includes(val)) {
                  setBedrooms("0");
                  setBathrooms("0");
                  setBalconies("0");
                } else {
                  setBedrooms("");
                  setBathrooms("");
                  setBalconies("");
                }
              }}
              className={`w-full rounded-xl border-2 border-border bg-background px-4 py-3.5 text-sm focus:border-primary outline-none font-semibold ${
                currentStep > 0 ? "opacity-50 cursor-not-allowed bg-muted" : ""
              }`}
            >
              {purpose === "Commercial" ? (
                <>
                  <option value="Office">Office</option>
                  <option value="Industry">Industry</option>
                  <option value="Retail">Retail</option>
                  <option value="Plot / Land">Plot / Land</option>
                </>
              ) : (
                <>
                  <option value="Flat/Apartment">Flat/Apartment</option>
                  <option value="Independent House / Villa">Independent House / Villa</option>
                  <option value="Independent / Builder Floor">Independent / Builder Floor</option>
                  <option value="Plot / Land">Plot / Land</option>
                </>
              )}
            </select>
          </div>
        </div>
      </div>

      {/* Stepper */}
      <div className="mt-10 flex items-center justify-between overflow-x-auto pb-4 md:overflow-visible">
        {steps.map((s, i) => (
          <div
            key={s}
            onClick={() => handleStepClick(i)}
            className="flex flex-1 items-center min-w-[120px] cursor-pointer group"
          >
            <div
              className={`grid h-9 w-9 place-items-center rounded-full text-xs font-bold transition-all group-hover:scale-105 ${
                i === currentStep
                  ? "bg-primary text-primary-foreground scale-110 shadow-md"
                  : i < currentStep
                  ? "bg-primary/20 text-primary"
                  : "bg-secondary text-muted-foreground"
              }`}
            >
              {i < currentStep ? <Check className="h-4 w-4" /> : i + 1}
            </div>
            <div className={`ml-2 text-xs font-semibold whitespace-nowrap md:text-sm transition-colors group-hover:text-primary ${i === currentStep ? "text-primary font-bold" : "text-muted-foreground font-medium"}`}>
              {s}
            </div>
            {i < steps.length - 1 && <div className="mx-3 hidden h-px flex-1 bg-border md:block" />}
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-3xl border border-border bg-card p-6 md:p-10 shadow-sm">
        <h2 className="font-display text-2xl font-bold">{steps[currentStep]}</h2>
        <p className="mt-1 text-sm text-muted-foreground">Please modify the details below</p>

        <form onSubmit={handleSubmit} className="mt-6">
          
          {/* Step 0: Basic Details */}
          {currentStep === 0 && (
            <div className="grid gap-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <Field label="Property Title" error={errors.title}>
                  <input
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
                    placeholder="e.g. Elegant 3 BHK Flat in Rajbagh (Title must be 10-120 chars)"
                  />
                </Field>
              </div>

              <div className="md:col-span-2">
                <Field label="Description / Details" error={errors.description}>
                  <textarea
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={5}
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary resize-none"
                    placeholder="Describe your property in detail (min 30 characters)..."
                  />
                </Field>
              </div>
            </div>
          )}

          {/* Step 1: Location */}
          {currentStep === 1 && (
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="State" error={errors.state}>
                <input
                  disabled
                  value={stateName}
                  className="w-full rounded-xl border border-border bg-muted/50 px-4 py-3 text-sm outline-none cursor-not-allowed"
                />
              </Field>

              <Field label="Division" error={errors.division}>
                <select
                  value={division}
                  onChange={(e) => handleDivisionChange(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:border-primary outline-none"
                >
                  <option value="Kashmir">Kashmir</option>
                  <option value="Jammu">Jammu</option>
                </select>
              </Field>

              <Field label="District" error={errors.district}>
                <select
                  value={district}
                  onChange={(e) => handleDistrictChange(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:border-primary outline-none"
                >
                  {getDistrictsForDivision(division).map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </Field>

              <Field label="City" error={errors.city}>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:border-primary outline-none"
                >
                  {dbCities.length > 0 ? (
                    dbCities.map((c) => (
                      <option key={c._id || c.name} value={c.name}>{c.name}</option>
                    ))
                  ) : (
                    <option value="Srinagar">Srinagar</option>
                  )}
                </select>
              </Field>

              <div className="md:col-span-2">
                <Field label="Locality / Area" error={errors.locality}>
                  <input
                    required
                    value={locality}
                    onChange={(e) => setLocality(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
                    placeholder="e.g. Rajbagh, Near Park"
                  />
                </Field>
              </div>
            </div>
          )}

          {/* Step 2: Property Info */}
          {currentStep === 2 && (
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Price (INR)" error={errors.price}>
                <input
                  required
                  value={price}
                  onChange={(e) => setPrice(cleanNumeric(e.target.value))}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
                  placeholder="e.g. 9500000"
                />
              </Field>

              <Field label="Area (sqft)" error={errors.area}>
                <input
                  required
                  value={area}
                  onChange={(e) => setArea(cleanNumeric(e.target.value))}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
                  placeholder="e.g. 1200"
                />
              </Field>

              {isResidentialBuilding && (
                <>
                  <Field label="Bedrooms" error={errors.bedrooms}>
                    <input
                      required
                      value={bedrooms}
                      onChange={(e) => setBedrooms(cleanNumeric(e.target.value))}
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
                      placeholder="e.g. 3"
                    />
                  </Field>

                  <Field label="Bathrooms" error={errors.bathrooms}>
                    <input
                      value={bathrooms}
                      onChange={(e) => setBathrooms(cleanNumeric(e.target.value))}
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
                      placeholder="e.g. 2"
                    />
                  </Field>

                  <Field label="Balconies" error={errors.balconies}>
                    <input
                      value={balconies}
                      onChange={(e) => setBalconies(cleanNumeric(e.target.value))}
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
                      placeholder="e.g. 1"
                    />
                  </Field>

                  <Field label="Furnishing Status" error={errors.furnishing}>
                    <select
                      value={furnishing}
                      onChange={(e) => setFurnishing(e.target.value)}
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:border-primary outline-none"
                    >
                      <option value="">Select furnishing...</option>
                      <option value="Unfurnished">Unfurnished</option>
                      <option value="Semi-Furnished">Semi-Furnished</option>
                      <option value="Furnished">Furnished</option>
                    </select>
                  </Field>

                  <Field label="Parking" error={errors.parking}>
                    <select
                      value={parking}
                      onChange={(e) => setParking(e.target.value)}
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:border-primary outline-none"
                    >
                      <option value="">Select parking...</option>
                      <option value="None">None</option>
                      <option value="Open">Open</option>
                      <option value="Covered">Covered</option>
                    </select>
                  </Field>
                </>
              )}

              {isCommercialBuilding && (
                <>
                  <Field label="Washrooms / Toilets" error={errors.washrooms}>
                    <select
                      value={washrooms}
                      onChange={(e) => setWashrooms(e.target.value)}
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:border-primary outline-none"
                    >
                      <option value="None">None</option>
                      <option value="Private">Private</option>
                      <option value="Sharing">Sharing</option>
                    </select>
                  </Field>

                  <Field label="Furnishing Status" error={errors.furnishing}>
                    <select
                      value={furnishing}
                      onChange={(e) => setFurnishing(e.target.value)}
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:border-primary outline-none"
                    >
                      <option value="">Select furnishing...</option>
                      <option value="Unfurnished">Unfurnished</option>
                      <option value="Semi-Furnished">Semi-Furnished</option>
                      <option value="Furnished">Furnished</option>
                    </select>
                  </Field>

                  <Field label="Parking" error={errors.parking}>
                    <select
                      value={parking}
                      onChange={(e) => setParking(e.target.value)}
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:border-primary outline-none"
                    >
                      <option value="">Select parking...</option>
                      <option value="None">None</option>
                      <option value="Open">Open</option>
                      <option value="Covered">Covered</option>
                    </select>
                  </Field>
                </>
              )}
            </div>
          )}

          {/* Step 3: Amenities */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Top Amenities</h3>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {[
                    "Security / Fire Alarm",
                    "Visitor Parking",
                    "Fitness Centre / GYM",
                    "Centrally Air Conditioned",
                    "Intercom Facility",
                    "Maintenance Staff",
                    "Vaastu Compliant",
                    "Rain Water Harvesting"
                  ].map((amenity) => {
                    const isChecked = amenitiesList.includes(amenity);
                    return (
                      <label key={amenity} className={`flex items-center gap-2 rounded-xl border p-3 cursor-pointer transition ${isChecked ? "border-primary bg-primary-soft/10 text-primary font-medium" : "border-border hover:bg-secondary"}`}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleAmenityToggle(amenity)}
                          className="rounded text-primary focus:ring-primary h-4 w-4"
                        />
                        <span className="text-xs">{amenity}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Other Amenities</h3>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {[
                    "Piped-gas",
                    "Bank Attached Property",
                    "Recently Renovated",
                    "High Ceiling Height",
                    "False Ceiling Lighting"
                  ].map((amenity) => {
                    const isChecked = amenitiesList.includes(amenity);
                    return (
                      <label key={amenity} className={`flex items-center gap-2 rounded-xl border p-3 cursor-pointer transition ${isChecked ? "border-primary bg-primary-soft/10 text-primary font-medium" : "border-border hover:bg-secondary"}`}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleAmenityToggle(amenity)}
                          className="rounded text-primary focus:ring-primary h-4 w-4"
                        />
                        <span className="text-xs">{amenity}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Custom Amenity Adder */}
              <div className="border-t border-border pt-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">Add Custom Amenities</h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customAmenity}
                    onChange={(e) => setCustomAmenity(cleanTextOnly(e.target.value))}
                    className="flex-1 rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
                    placeholder="e.g. Swimming Pool, Garden"
                  />
                  <Button type="button" onClick={handleAddCustomAmenity} className="rounded-xl px-5">Add</Button>
                </div>

                {/* Selected Custom Amenities list */}
                {customAmenities.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {customAmenities.map((amenity) => (
                      <span key={amenity} className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-foreground">
                        {amenity}
                        <button
                          type="button"
                          onClick={() => setCustomAmenities((prev) => prev.filter(a => a !== amenity))}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 4: Photos & Video */}
          {currentStep === 4 && (
            <div className="grid gap-5 md:grid-cols-2">
              {/* Photos upload */}
              <div className="md:col-span-2">
                <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Upload photos <span className="text-[10px] text-muted-foreground lowercase font-normal">(drag &amp; drop to reorder)</span>
                </div>
                <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-secondary/40 py-8 text-center transition hover:border-primary hover:bg-primary-soft/30">
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
                {errors.photos && <p className="mt-1 text-xs text-destructive">{errors.photos}</p>}

                {photos.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-6">
                    {photos.map((p, i) => (
                      <div
                        key={i}
                        draggable
                        onDragStart={(e) => handleDragStart(e, i)}
                        onDragOver={(e) => handleDragOver(e, i)}
                        onDrop={(e) => handleDrop(e, i)}
                        onDragEnd={handleDragEnd}
                        className={`group relative aspect-square overflow-hidden rounded-xl border border-border bg-muted cursor-grab active:cursor-grabbing transition-all ${
                          draggedIdx === i ? "opacity-45 scale-95 border-primary border-2" : ""
                        }`}
                      >
                        <img src={p} alt="Preview" className="h-full w-full object-cover pointer-events-none" />
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

              {/* Video upload */}
              <div className="md:col-span-2 mt-4">
                <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Upload video (Optional)
                </div>
                <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-secondary/40 py-8 text-center transition hover:border-primary hover:bg-primary-soft/30">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <div className="text-sm font-medium">Drop video or click to upload</div>
                  <div className="text-xs text-muted-foreground">MP4, WEBM up to 50MB</div>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleVideoChange}
                    className="hidden"
                  />
                </label>
                {errors.video && <p className="mt-1 text-xs text-destructive">{errors.video}</p>}

                {video && (
                  <div className="mt-4 relative aspect-video max-w-sm overflow-hidden rounded-xl border border-border bg-muted">
                    <video src={video} controls className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setVideo("")}
                      className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-destructive/80 text-white opacity-90 transition hover:bg-destructive hover:scale-105"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 5: Publish */}
          {currentStep === 5 && (
            <div className="grid gap-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <Field label="Contact number" error={errors.contactNumber}>
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
              </div>
            </div>
          )}

          {/* Step Navigation Controls */}
          <div className="mt-10 flex items-center justify-between border-t border-border pt-6">
            {currentStep > 0 ? (
              <Button
                type="button"
                onClick={handleBack}
                variant="outline"
                className="flex items-center gap-2 rounded-full px-6 py-5"
              >
                <ChevronLeft className="h-4 w-4" /> Back
              </Button>
            ) : (
              <div />
            )}

            {currentStep < steps.length - 1 ? (
              <Button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-2 rounded-full bg-primary px-6 py-5 text-primary-foreground font-semibold"
              >
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={isSubmitting}
                className="rounded-full bg-primary px-8 py-5 text-primary-foreground font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? "Saving Changes..." : "Save Changes"}
              </Button>
            )}
          </div>

        </form>
      </div>
    </div>
  );
}

function Field({ label, error, children }) {
  return (
    <div>
      <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
      {children}
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}
