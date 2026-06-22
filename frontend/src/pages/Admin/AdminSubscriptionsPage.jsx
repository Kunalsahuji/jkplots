import { useState, useEffect } from "react";
import { Plus, Trash2, Edit, Loader2 } from "lucide-react";
import api from "@/utils/api";
import { toast } from "sonner";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

export default function AdminSubscriptionsPage() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    durationDays: "",
    price: "",
    listingLimit: "",
    features: "",
    isActive: true,
  });
  const [editingId, setEditingId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {}
  });

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const { data } = await api.get("/subscription-plans");
      if (data.success) {
        setPlans(data.data);
      }
    } catch (err) {
      toast.error("Failed to load subscription plans");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const featuresArray = formData.features
      .split('\n')
      .map(d => d.trim())
      .filter(d => d.length > 0);

    const payload = {
      name: formData.name,
      durationDays: Number(formData.durationDays),
      price: Number(formData.price),
      listingLimit: Number(formData.listingLimit),
      features: featuresArray,
      isActive: formData.isActive
    };

    try {
      if (editingId) {
        await api.put(`/subscription-plans/${editingId}`, payload);
        toast.success("Subscription plan updated successfully");
      } else {
        await api.post("/subscription-plans", payload);
        toast.success("Subscription plan created successfully");
      }
      resetForm();
      fetchPlans();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save plan");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({ 
      name: "", durationDays: "", price: "", listingLimit: "", features: "", isActive: true 
    });
  }

  const handleEdit = (plan) => {
    setEditingId(plan._id);
    setFormData({
      name: plan.name,
      durationDays: plan.durationDays,
      price: plan.price,
      listingLimit: plan.listingLimit,
      features: plan.features.join('\n'),
      isActive: plan.isActive !== undefined ? plan.isActive : true
    });
  };

  const handleDeleteClick = (id) => {
    setConfirmDialog({
      isOpen: true,
      title: "Delete Subscription Plan",
      message: "Are you sure you want to permanently delete this plan?",
      onConfirm: () => handleDelete(id)
    });
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/subscription-plans/${id}`);
      toast.success("Plan deleted");
      fetchPlans();
    } catch (err) {
      toast.error("Failed to delete plan");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold font-display text-gray-900">Manage Subscription Plans</h2>
        <p className="text-sm text-gray-500">Create dealer plans dictating how many properties they can list.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm self-start">
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
                placeholder="e.g. Platinum Dealer"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Duration (Days)</label>
                <input
                  type="number"
                  name="durationDays"
                  value={formData.durationDays}
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
                  placeholder="e.g. 1999"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Listing Limit</label>
              <input
                type="number"
                name="listingLimit"
                value={formData.listingLimit}
                onChange={handleInputChange}
                required
                min="1"
                className="w-full mt-1 border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-black outline-none"
                placeholder="Number of active properties allowed"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Features (1 per line)</label>
              <textarea
                name="features"
                value={formData.features}
                onChange={handleInputChange}
                rows="4"
                className="w-full mt-1 border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-black outline-none resize-none"
                placeholder="Up to 50 active listings&#10;Priority support&#10;Dealer badge"
              />
            </div>
            <div className="flex items-center gap-2 pt-2">
                <input type="checkbox" id="isActive" name="isActive" checked={formData.isActive} onChange={handleInputChange} className="w-4 h-4 rounded text-black" />
                <label htmlFor="isActive" className="text-sm font-semibold text-gray-700">Is Plan Active?</label>
            </div>
            <div className="flex gap-2 pt-2">
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
                  onClick={resetForm}
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
              No subscription plans found. Add one to get started.
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {plans.map((plan) => (
                <div key={plan._id} className={`bg-white rounded-2xl border ${plan.isActive ? 'border-gray-200' : 'border-red-200 bg-red-50/30'} p-5 shadow-sm`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-gray-900 flex items-center gap-2">
                          {plan.name} 
                          {!plan.isActive && <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Inactive</span>}
                      </h4>
                      <p className="text-sm font-semibold text-primary mt-1">
                          {plan.price === 0 ? 'Free' : `₹${plan.price}`} / {plan.durationDays} days
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 font-medium bg-secondary/50 inline-block px-2 py-1 rounded-md">
                          Limit: {plan.listingLimit} Properties
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => handleEdit(plan)} className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-md">
                        <Edit size={16} />
                      </button>
                      <button onClick={() => handleDeleteClick(plan._id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <ul className="mt-4 space-y-1">
                    {plan.features?.map((desc, i) => (
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

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
      />
    </div>
  );
}
