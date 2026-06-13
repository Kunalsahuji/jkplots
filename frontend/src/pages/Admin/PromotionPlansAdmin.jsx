import { useState, useEffect } from "react";
import { Plus, Trash2, Edit, Loader2 } from "lucide-react";
import api from "@/utils/api";
import { toast } from "sonner";

export default function PromotionPlansAdmin() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    durationInDays: "",
    price: "",
    description: "",
  });
  const [editingId, setEditingId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const { data } = await api.get("/promotions/admin/plans");
      if (data.success) {
        setPlans(data.data);
      }
    } catch (err) {
      toast.error("Failed to load plans");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Parse multiline description into array
    const descArray = formData.description
      .split('\n')
      .map(d => d.trim())
      .filter(d => d.length > 0);

    const payload = {
      name: formData.name,
      durationInDays: Number(formData.durationInDays),
      price: Number(formData.price),
      description: descArray
    };

    try {
      if (editingId) {
        await api.put(`/promotions/admin/plans/${editingId}`, payload);
        toast.success("Plan updated successfully");
      } else {
        await api.post("/promotions/admin/plans", payload);
        toast.success("Plan created successfully");
      }
      setFormData({ name: "", durationInDays: "", price: "", description: "" });
      setEditingId(null);
      fetchPlans();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to save plan");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (plan) => {
    setEditingId(plan._id);
    setFormData({
      name: plan.name,
      durationInDays: plan.durationInDays,
      price: plan.price,
      description: plan.description.join('\n')
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this plan?")) return;
    try {
      await api.delete(`/promotions/admin/plans/${id}`);
      toast.success("Plan deleted");
      fetchPlans();
    } catch (err) {
      toast.error("Failed to delete plan");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold font-display text-gray-900">Manage Promotion Plans</h2>
        <p className="text-sm text-gray-500">Create and update plans that dealers can purchase to boost properties.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="font-semibold mb-4 text-gray-900">
            {editingId ? "Edit Plan" : "Add New Plan"}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Plan Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full mt-1 border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-black outline-none"
                placeholder="e.g. Gold Plan"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Duration (Days)</label>
                <input
                  type="number"
                  name="durationInDays"
                  value={formData.durationInDays}
                  onChange={handleInputChange}
                  required
                  min="1"
                  className="w-full mt-1 border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-black outline-none"
                  placeholder="e.g. 30"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Price (₹)</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  required
                  min="0"
                  className="w-full mt-1 border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-black outline-none"
                  placeholder="e.g. 999"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Features (1 per line)</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="4"
                className="w-full mt-1 border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-black outline-none resize-none"
                placeholder="Top of search&#10;Featured badge&#10;10x views"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-black text-white rounded-lg py-2 text-sm font-semibold hover:bg-gray-800 transition flex items-center justify-center"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : editingId ? "Update Plan" : "Create Plan"}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setFormData({ name: "", durationInDays: "", price: "", description: "" });
                  }}
                  className="px-4 border border-gray-200 rounded-lg text-sm font-semibold hover:bg-gray-50"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* List */}
        <div className="lg:col-span-2">
          {loading ? (
            <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
          ) : plans.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-500 text-sm">
              No promotion plans found. Add one to get started.
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {plans.map((plan) => (
                <div key={plan._id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-gray-900">{plan.name}</h4>
                      <p className="text-sm font-semibold text-primary mt-1">₹{plan.price} / {plan.durationInDays} days</p>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => handleEdit(plan)} className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-md">
                        <Edit size={16} />
                      </button>
                      <button onClick={() => handleDelete(plan._id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <ul className="mt-4 space-y-1">
                    {plan.description.map((desc, i) => (
                      <li key={i} className="text-xs text-gray-600 flex items-center gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-gray-300 shrink-0"></span>
                        {desc}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
