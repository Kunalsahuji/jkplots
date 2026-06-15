import { useEffect, useState } from "react";
import { Search, Loader2, MapPin, Trash2, Edit, Check, X, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, ArrowUpDown, Plus } from "lucide-react";
import api from "@/utils/api";
import { toast } from "sonner";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

export default function AdminCitiesPage() {
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [formData, setFormData] = useState({
    name: "",
    state: "Jammu and Kashmir",
    isActive: true
  });
  const [editingId, setEditingId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pagination & Sorting states
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState("name");
  const [sortDirection, setSortDirection] = useState("asc");
  const itemsPerPage = 10;

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {}
  });

  const fetchCities = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/cities?all=true");
      if (data.success) {
        setCities(data.data);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load cities list");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCities();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return toast.error("City name is required");

    setIsSubmitting(true);
    try {
      if (editingId) {
        const { data } = await api.put(`/cities/${editingId}`, formData);
        if (data.success) {
          toast.success("City updated successfully!");
          setCities(prev => prev.map(c => c._id === editingId ? data.data : c));
        }
      } else {
        const { data } = await api.post("/cities", formData);
        if (data.success) {
          toast.success("City created successfully!");
          setCities(prev => [...prev, data.data]);
        }
      }
      setFormData({ name: "", state: "Jammu and Kashmir", isActive: true });
      setEditingId(null);
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to save city");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (city) => {
    setEditingId(city._id);
    setFormData({
      name: city.name,
      state: city.state,
      isActive: city.isActive
    });
  };

  const handleToggleStatus = async (city) => {
    try {
      const updatedStatus = !city.isActive;
      const { data } = await api.put(`/cities/${city._id}`, { isActive: updatedStatus });
      if (data.success) {
        toast.success(`City "${city.name}" set to ${updatedStatus ? "Active" : "Inactive"}`);
        setCities(prev => prev.map(c => c._id === city._id ? { ...c, isActive: updatedStatus } : c));
      }
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  const handleDeleteClick = (id, name) => {
    setConfirmDialog({
      isOpen: true,
      title: "Delete City",
      message: `Are you sure you want to delete "${name}" from the systems? This may affect directory lookups.`,
      onConfirm: () => handleDelete(id)
    });
  };

  const handleDelete = async (id) => {
    try {
      const { data } = await api.delete(`/cities/${id}`);
      if (data.success) {
        toast.success("City deleted successfully!");
        setCities(prev => prev.filter(c => c._id !== id));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete city.");
    }
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const sortedCities = [...cities].sort((a, b) => {
    let valA = a[sortField];
    let valB = b[sortField];

    if (valA === undefined || valA === null) valA = "";
    if (valB === undefined || valB === null) valB = "";

    if (typeof valA === "string") valA = valA.toLowerCase();
    if (typeof valB === "string") valB = valB.toLowerCase();

    if (valA < valB) return sortDirection === "asc" ? -1 : 1;
    if (valA > valB) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  const filteredCities = sortedCities.filter((c) => {
    const nameMatch = c.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const stateMatch = c.state?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSearch = nameMatch || stateMatch;

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && c.isActive) ||
      (statusFilter === "inactive" && !c.isActive);

    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredCities.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredCities.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <div className="space-y-8 relative text-slate-800">
      {/* Title */}
      <div>
        <h1 className="font-display text-3xl font-bold text-slate-900 tracking-tight">
          Municipal Cities Configuration
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage municipalities and regional jurisdictions in Jammu and Kashmir active for listings.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Form panel */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-lg">
            {editingId ? "Edit Municipal Area" : "Add Municipal Area"}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">City / Location Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-slate-900 outline-none"
                placeholder="e.g. Jammu, Srinagar, Katra"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">State / Territory</label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleInputChange}
                required
                className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-slate-900 outline-none bg-slate-50"
              />
            </div>
            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="isActive"
                name="isActive"
                checked={formData.isActive}
                onChange={handleInputChange}
                className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 h-4 w-4"
              />
              <label htmlFor="isActive" className="text-sm font-semibold text-slate-700 select-none">
                Active for property registration
              </label>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg py-2.5 text-sm font-bold transition flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : editingId ? (
                  "Update Jurisdiction"
                ) : (
                  <>
                    <Plus className="w-4 h-4" /> Add City
                  </>
                )}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setFormData({ name: "", state: "Jammu and Kashmir", isActive: true });
                  }}
                  className="px-4 border border-slate-200 rounded-lg text-sm font-semibold hover:bg-slate-50 text-slate-600 transition"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* List panel */}
        <div className="lg:col-span-2 space-y-4">
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <div className="relative w-full md:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search municipal cities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 hover:bg-slate-100/50 focus:bg-white border-none focus:ring-2 focus:ring-slate-950 rounded-xl transition-all outline-none"
              />
            </div>
            <div className="flex gap-1.5">
              {["all", "active", "inactive"].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border ${
                    statusFilter === status
                      ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                      : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {status === "all" ? "All statuses" : status}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="flex flex-col items-center justify-center h-48 space-y-3 bg-white rounded-2xl border border-slate-100 shadow-sm">
              <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
              <p className="text-sm text-slate-500 font-medium">Fetching locations...</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50/75 border-b border-slate-100 text-xs uppercase font-bold text-slate-500 tracking-wider">
                    <tr>
                      <th 
                        className="px-6 py-4 cursor-pointer hover:bg-slate-100/80 transition group select-none"
                        onClick={() => handleSort("name")}
                      >
                        <div className="flex items-center gap-1.5">
                          City / Location Name
                          {sortField === "name" ? (
                            sortDirection === "asc" ? <ChevronUp className="h-3.5 w-3.5 text-slate-900" /> : <ChevronDown className="h-3.5 w-3.5 text-slate-900" />
                          ) : (
                            <ArrowUpDown className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-600 transition" />
                          )}
                        </div>
                      </th>
                      <th className="px-6 py-4 select-none">State / Territory</th>
                      <th 
                        className="px-6 py-4 cursor-pointer hover:bg-slate-100/80 transition group select-none"
                        onClick={() => handleSort("isActive")}
                      >
                        <div className="flex items-center gap-1.5">
                          Status
                          {sortField === "isActive" ? (
                            sortDirection === "asc" ? <ChevronUp className="h-3.5 w-3.5 text-slate-900" /> : <ChevronDown className="h-3.5 w-3.5 text-slate-900" />
                          ) : (
                            <ArrowUpDown className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-600 transition" />
                          )}
                        </div>
                      </th>
                      <th className="px-6 py-4 text-right select-none">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {currentItems.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="px-6 py-12 text-center text-slate-400 text-sm">
                          No matching municipal cities found.
                        </td>
                      </tr>
                    ) : (
                      currentItems.map((c) => (
                        <tr key={c._id} className="hover:bg-slate-50/40 transition">
                          <td className="px-6 py-4 font-semibold text-slate-900 flex items-center gap-1.5">
                            <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
                            {c.name}
                          </td>
                          <td className="px-6 py-4 text-slate-500">{c.state}</td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => handleToggleStatus(c)}
                              className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold transition border cursor-pointer ${
                                c.isActive
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100/75"
                                  : "bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100"
                              }`}
                            >
                              {c.isActive ? "Active" : "Inactive"}
                            </button>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleEdit(c)}
                                className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                                title="Edit Location"
                              >
                                <Edit size={15} />
                              </button>
                              <button
                                onClick={() => handleDeleteClick(c._id, c.name)}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                title="Delete Location"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <span className="text-xs text-slate-500">
                    Showing <span className="font-semibold text-slate-900">{indexOfFirstItem + 1}</span> to{" "}
                    <span className="font-semibold text-slate-900">
                      {Math.min(indexOfLastItem, filteredCities.length)}
                    </span>{" "}
                    of <span className="font-semibold text-slate-900">{filteredCities.length}</span> entries
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="inline-flex h-8 px-3 items-center gap-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" /> Previous
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`inline-flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold transition-all shadow-xs ${
                          currentPage === page
                            ? "bg-slate-900 text-white"
                            : "border border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="inline-flex h-8 px-3 items-center gap-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
                    >
                      Next <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
      />
    </div>
  );
}
