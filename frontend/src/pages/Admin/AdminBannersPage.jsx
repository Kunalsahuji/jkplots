import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Link as LinkIcon, Image as ImageIcon, CheckCircle2, XCircle, MousePointerClick, CalendarClock, MousePointer2 } from "lucide-react";
import { toast } from "sonner";
import api from "@/utils/api";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

export default function AdminBannersPage() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, id: null });
  
  const [formData, setFormData] = useState({
    title: "",
    imageUrl: "",
    targetUrl: "",
    placement: "homepage_hero",
    isActive: true,
    endDate: ""
  });

  const fetchBanners = async () => {
    try {
      const { data } = await api.get("/banners/admin");
      if (data.success) {
        setBanners(data.data);
      }
    } catch (err) {
      toast.error("Failed to fetch banners");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const openAddModal = () => {
    setEditMode(false);
    setFormData({
      title: "",
      imageUrl: "",
      targetUrl: "",
      placement: "homepage_hero",
      isActive: true,
      endDate: ""
    });
    setModalOpen(true);
  };

  const openEditModal = (b) => {
    setEditMode(true);
    setFormData({
      _id: b._id,
      title: b.title,
      imageUrl: b.imageUrl,
      targetUrl: b.targetUrl,
      placement: b.placement,
      isActive: b.isActive,
      endDate: b.endDate ? new Date(b.endDate).toISOString().split("T")[0] : ""
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const submitData = { ...formData };
    if (!submitData.endDate) delete submitData.endDate;
    
    try {
      if (editMode) {
        const { data } = await api.put(`/banners/admin/${formData._id}`, submitData);
        if (data.success) {
          toast.success("Banner updated");
          setBanners(banners.map(b => b._id === formData._id ? data.data : b));
        }
      } else {
        const { data } = await api.post("/banners/admin", submitData);
        if (data.success) {
          toast.success("Banner created");
          setBanners([data.data, ...banners]);
        }
      }
      setModalOpen(false);
    } catch (err) {
      toast.error(err?.response?.data?.error || "An error occurred");
    }
  };

  const confirmDelete = async () => {
    try {
      const { data } = await api.delete(`/banners/admin/${deleteDialog.id}`);
      if (data.success) {
        toast.success("Banner deleted");
        setBanners(banners.filter(b => b._id !== deleteDialog.id));
      }
    } catch (err) {
      toast.error("Failed to delete banner");
    } finally {
      setDeleteDialog({ isOpen: false, id: null });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Ad Banners</h1>
          <p className="text-sm text-slate-500">Manage promotional banners across the platform</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-slate-800"
        >
          <Plus className="h-4 w-4" /> Add Banner
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <p className="text-slate-500 col-span-full">Loading banners...</p>
        ) : banners.length === 0 ? (
          <p className="text-slate-500 col-span-full">No banners found. Create one to get started.</p>
        ) : (
          banners.map((b) => (
            <div key={b._id} className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm flex flex-col relative group">
              {/* Image Preview */}
              <div className="h-32 w-full bg-slate-100 relative overflow-hidden">
                <img src={b.imageUrl} alt={b.title} className="w-full h-full object-cover" />
                <div className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 backdrop-blur-md shadow-sm ${b.isActive ? 'bg-green-500/90 text-white' : 'bg-slate-500/90 text-white'}`}>
                  {b.isActive ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                  {b.isActive ? 'Active' : 'Hidden'}
                </div>
              </div>
              
              <div className="p-4 flex flex-col flex-grow">
                <h3 className="font-bold text-slate-900 line-clamp-1" title={b.title}>{b.title}</h3>
                
                <div className="mt-3 space-y-2 text-xs text-slate-600 flex-grow">
                  <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg">
                    <ImageIcon className="h-4 w-4 text-slate-400" />
                    <span className="font-medium text-slate-700 capitalize">{b.placement.replace('_', ' ')}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg truncate">
                    <LinkIcon className="h-4 w-4 text-slate-400 shrink-0" />
                    <a href={b.targetUrl} target="_blank" rel="noreferrer" className="truncate text-blue-600 hover:underline">{b.targetUrl || 'No Link'}</a>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-2 bg-blue-50/50 p-2 rounded-lg">
                      <MousePointer2 className="h-4 w-4 text-blue-500" />
                      <span className="font-bold text-blue-700">{b.clicks} clicks</span>
                    </div>
                    {b.endDate && (
                      <div className="flex items-center gap-2 bg-amber-50/50 p-2 rounded-lg">
                        <CalendarClock className="h-4 w-4 text-amber-500" />
                        <span className="font-medium text-amber-700">{new Date(b.endDate).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-2">
                  <button onClick={() => openEditModal(b)} className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition-colors">
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </button>
                  <button onClick={() => setDeleteDialog({ isOpen: true, id: b._id })} className="flex items-center justify-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-100 transition-colors">
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="mb-4 text-xl font-bold text-slate-900">{editMode ? "Edit Banner" : "Create New Banner"}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">Banner Title</label>
                <input required type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full rounded-xl border border-slate-300 px-4 py-2 text-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900" placeholder="Independence Day Promo" />
              </div>
              
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">Image URL</label>
                <input required type="url" value={formData.imageUrl} onChange={e => setFormData({ ...formData, imageUrl: e.target.value })} className="w-full rounded-xl border border-slate-300 px-4 py-2 text-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900" placeholder="https://example.com/banner.jpg" />
                {formData.imageUrl && <img src={formData.imageUrl} alt="Preview" className="mt-2 h-20 rounded-lg object-cover border border-slate-200" />}
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">Target Link URL</label>
                <input type="url" value={formData.targetUrl} onChange={e => setFormData({ ...formData, targetUrl: e.target.value })} className="w-full rounded-xl border border-slate-300 px-4 py-2 text-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900" placeholder="https://jkplot.com/promotions" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">Placement</label>
                  <select value={formData.placement} onChange={e => setFormData({ ...formData, placement: e.target.value })} className="w-full rounded-xl border border-slate-300 px-4 py-2 text-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 bg-white">
                    <option value="homepage_hero">Homepage Hero Carousel</option>
                    <option value="dashboard_top">Dashboard Top</option>
                    <option value="property_list">Property List Interstitial</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">End Date (Optional)</label>
                  <input type="date" value={formData.endDate} onChange={e => setFormData({ ...formData, endDate: e.target.value })} className="w-full rounded-xl border border-slate-300 px-4 py-2 text-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900" />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input type="checkbox" id="isActive" checked={formData.isActive} onChange={e => setFormData({ ...formData, isActive: e.target.checked })} className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900" />
                <label htmlFor="isActive" className="text-sm font-semibold text-slate-700 cursor-pointer">Banner is active and visible</label>
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setModalOpen(false)} className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100 transition-colors">Cancel</button>
                <button type="submit" className="rounded-xl bg-slate-900 px-6 py-2 text-sm font-semibold text-white hover:bg-slate-800 transition-colors">{editMode ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        title="Delete Banner"
        message="Are you sure you want to permanently delete this banner? It will instantly be removed from all public pages."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteDialog({ isOpen: false, id: null })}
      />
    </div>
  );
}
