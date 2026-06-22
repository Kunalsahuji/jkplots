import React, { useState, useEffect } from "react";
import { 
  FileText, Plus, Search, CheckCircle2, XCircle, Clock, 
  Edit, Trash2, Eye, Calendar, User, Upload, ArrowLeft, Loader2, ExternalLink
} from "lucide-react";
import { toast } from "sonner";
import api from "../../utils/api";
import { Link } from "react-router-dom";

export default function AdminBlogsPage() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  // Pagination
  const [page, setPage] = useState(1);
  const itemsPerPage = 8;

  // Edit/Create state
  const [isEditing, setIsEditing] = useState(false);
  const [currentBlog, setCurrentBlog] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    excerpt: "",
    content: "",
    tags: "",
    coverImage: "",
    metaTitle: "",
    metaDescription: "",
    keywords: ""
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/blogs/admin/all');
      if (data.success) {
        setBlogs(data.data);
      }
    } catch (err) {
      toast.error("Failed to load blogs");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      const { data } = await api.put(`/blogs/admin/${id}/status`, { status: newStatus });
      if (data.success) {
        toast.success(`Blog status updated to ${newStatus}`);
        setBlogs(blogs.map(b => b._id === id ? data.data : b));
      }
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to update status");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this blog?")) return;
    try {
      const { data } = await api.delete(`/blogs/author/${id}`);
      if (data.success) {
        toast.success("Blog deleted successfully");
        setBlogs(blogs.filter(b => b._id !== id));
      }
    } catch (err) {
      toast.error("Failed to delete blog");
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData({ ...formData, coverImage: reader.result });
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        title: formData.title,
        excerpt: formData.excerpt,
        content: formData.content,
        coverImage: formData.coverImage,
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
        seo: {
          metaTitle: formData.metaTitle || formData.title.substring(0, 60),
          metaDescription: formData.metaDescription || formData.excerpt.substring(0, 160),
          keywords: formData.keywords.split(',').map(k => k.trim()).filter(Boolean)
        }
      };

      if (currentBlog) {
        const { data } = await api.put(`/blogs/author/${currentBlog._id}`, payload);
        toast.success("Blog updated successfully");
        setBlogs(blogs.map(b => b._id === data.data._id ? data.data : b));
      } else {
        const { data } = await api.post('/blogs/author', payload);
        toast.success("Blog created successfully");
        setBlogs([data.data, ...blogs]);
      }
      setIsEditing(false);
      setCurrentBlog(null);
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to save blog");
    } finally {
      setSaving(false);
    }
  };

  const openEditor = (blog = null) => {
    if (blog) {
      setCurrentBlog(blog);
      setFormData({
        title: blog.title,
        excerpt: blog.excerpt,
        content: blog.content,
        coverImage: blog.coverImage,
        tags: blog.tags.join(', '),
        metaTitle: blog.seo?.metaTitle || "",
        metaDescription: blog.seo?.metaDescription || "",
        keywords: blog.seo?.keywords?.join(', ') || ""
      });
    } else {
      setCurrentBlog(null);
      setFormData({
        title: "", excerpt: "", content: "", tags: "", coverImage: "", metaTitle: "", metaDescription: "", keywords: ""
      });
    }
    setIsEditing(true);
  };

  // Filter and pagination
  const filteredBlogs = blogs.filter(b => {
    const matchesSearch = b.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          b.author?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || b.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    if (sortBy === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
    if (sortBy === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
    if (sortBy === 'views') return b.views - a.views;
    return 0;
  });

  const totalPages = Math.ceil(filteredBlogs.length / itemsPerPage);
  const paginatedBlogs = filteredBlogs.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  if (isEditing) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsEditing(false)}
              className="p-2 rounded-full hover:bg-slate-100 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-slate-600" />
            </button>
            <h1 className="font-display text-2xl font-bold text-slate-900">
              {currentBlog ? 'Edit Blog Article' : 'Write New Article'}
            </h1>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-100 shadow-sm space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-2">Basic Details</h3>
              <div className="grid gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Article Title</label>
                  <input
                    type="text"
                    required
                    maxLength={150}
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                    placeholder="E.g., Top 10 Places to Invest in Jammu"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Short Excerpt</label>
                  <textarea
                    required
                    maxLength={300}
                    rows={2}
                    value={formData.excerpt}
                    onChange={e => setFormData({...formData, excerpt: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all resize-none"
                    placeholder="A brief summary of the article..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Cover Image</label>
                  <div className="flex items-center gap-6">
                    {formData.coverImage && (
                      <div className="relative w-32 h-20 rounded-lg overflow-hidden border border-slate-200 shrink-0">
                        <img src={formData.coverImage.startsWith('http') || formData.coverImage.startsWith('data:') ? formData.coverImage : `http://localhost:5000${formData.coverImage}`} alt="Cover" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <label className="flex-1 flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group">
                      <Upload className="h-6 w-6 text-slate-400 group-hover:text-indigo-500 transition-colors mb-2" />
                      <span className="text-sm font-medium text-slate-600">Click to upload image</span>
                      <span className="text-xs text-slate-400 mt-1">JPG, PNG, WebP (Max 5MB)</span>
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-2">Article Content</h3>
              <p className="text-xs text-slate-500 -mt-2">Supports basic HTML tags for formatting (&lt;b&gt;, &lt;i&gt;, &lt;br&gt;, &lt;h2&gt;).</p>
              <textarea
                required
                rows={15}
                value={formData.content}
                onChange={e => setFormData({...formData, content: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-mono text-sm leading-relaxed"
                placeholder="<p>Start writing your article here...</p>"
              />
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-2">SEO & Discovery</h3>
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Tags</label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={e => setFormData({...formData, tags: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                    placeholder="real estate, investment, jammu (comma separated)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Meta Title</label>
                  <input
                    type="text"
                    maxLength={60}
                    value={formData.metaTitle}
                    onChange={e => setFormData({...formData, metaTitle: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                    placeholder="Leave empty to use article title"
                  />
                  <div className="text-[10px] text-right text-slate-400 mt-1">{formData.metaTitle.length}/60</div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Meta Keywords</label>
                  <input
                    type="text"
                    value={formData.keywords}
                    onChange={e => setFormData({...formData, keywords: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                    placeholder="keyword1, keyword2"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Meta Description</label>
                  <textarea
                    rows={2}
                    maxLength={160}
                    value={formData.metaDescription}
                    onChange={e => setFormData({...formData, metaDescription: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all resize-none"
                    placeholder="Leave empty to use excerpt"
                  />
                  <div className="text-[10px] text-right text-slate-400 mt-1">{formData.metaDescription.length}/160</div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-8 border-t border-slate-200 pt-6">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-6 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold hover:bg-slate-50 transition-colors shadow-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-70 flex items-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              {currentBlog ? 'Save Changes' : 'Publish Article'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="h-6 w-6 text-indigo-600" />
            Editorial & Blog CMS
          </h1>
          <p className="text-sm text-slate-500 mt-1">Manage platform content, approve dealer articles, and optimize SEO.</p>
        </div>
        <button
          onClick={() => openEditor()}
          className="inline-flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Write Article
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 justify-between">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by title or author..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 hover:bg-slate-100/50 focus:bg-white border-none focus:ring-2 focus:ring-indigo-500/20 rounded-xl outline-none transition-all"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="text-sm bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl px-4 py-2 font-semibold outline-none"
        >
          <option value="all">All Statuses</option>
          <option value="published">Published</option>
          <option value="pending">Pending Review</option>
          <option value="draft">Drafts</option>
          <option value="rejected">Rejected</option>
        </select>
        <select
          value={sortBy}
          onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
          className="text-sm bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl px-4 py-2 font-semibold outline-none"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="views">Most Viewed</option>
        </select>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400 mb-4" />
          <p className="text-slate-500 font-medium">Loading articles...</p>
        </div>
      ) : paginatedBlogs.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 bg-white rounded-2xl border border-slate-100 shadow-sm text-center px-6">
          <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-4">
            <FileText className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">No articles found</h3>
          <p className="text-slate-500 mt-1 max-w-md">There are no articles matching your current filters. Click "Write Article" to publish new content.</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {paginatedBlogs.map(blog => (
            <div key={blog._id} className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col group">
              <div className="relative h-40 bg-slate-100 overflow-hidden shrink-0">
                <img 
                  src={blog.coverImage.startsWith('http') ? blog.coverImage : `http://localhost:5000${blog.coverImage}`} 
                  alt={blog.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3 flex gap-2">
                  <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg shadow-sm backdrop-blur-md ${
                    blog.status === 'Published' ? 'bg-emerald-500/90 text-white' :
                    blog.status === 'Pending' ? 'bg-amber-500/90 text-white' :
                    blog.status === 'Rejected' ? 'bg-red-500/90 text-white' :
                    'bg-slate-800/90 text-white'
                  }`}>
                    {blog.status}
                  </span>
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                  <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {new Date(blog.createdAt).toLocaleDateString()}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {blog.views}</span>
                </div>
                <h3 className="font-bold text-slate-800 line-clamp-2 leading-snug mb-2 flex-1">
                  {blog.title}
                </h3>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 rounded-full bg-slate-100 overflow-hidden shrink-0">
                    {blog.author?.avatar ? (
                      <img src={blog.author.avatar.startsWith('http') ? blog.author.avatar : `http://localhost:5000${blog.author.avatar}`} alt="Author" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-indigo-100 text-indigo-700 text-[10px] font-bold">
                        {blog.author?.name?.charAt(0) || 'U'}
                      </div>
                    )}
                  </div>
                  <div className="text-xs">
                    <span className="font-semibold text-slate-700 truncate block max-w-[120px]">{blog.author?.name}</span>
                    <span className="text-slate-400 capitalize text-[10px] block -mt-0.5">{blog.author?.role}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex gap-1.5">
                    <button 
                      onClick={() => openEditor(blog)}
                      className="w-8 h-8 rounded-lg bg-slate-50 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 flex items-center justify-center transition-colors"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(blog._id)}
                      className="w-8 h-8 rounded-lg bg-slate-50 text-slate-600 hover:bg-red-50 hover:text-red-600 flex items-center justify-center transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  {blog.status === 'Pending' && (
                    <div className="flex gap-1.5">
                      <button 
                        onClick={() => handleUpdateStatus(blog._id, 'Published')}
                        className="px-3 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg text-xs font-semibold transition-colors"
                      >
                        Approve
                      </button>
                      <button 
                        onClick={() => handleUpdateStatus(blog._id, 'Rejected')}
                        className="px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-xs font-semibold transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                  {blog.status === 'Published' && (
                    <Link
                      to={`/blog/${blog.slug}`}
                      target="_blank"
                      className="px-3 py-1.5 bg-slate-50 text-slate-600 hover:bg-slate-100 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      View Live <ExternalLink className="w-3 h-3" />
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && !loading && (
        <div className="flex items-center justify-between px-6 py-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-sm text-slate-500 font-medium">Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50 transition"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50 transition"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
