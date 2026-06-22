import React, { useState, useEffect } from "react";
import { 
  FileText, Plus, Search, CheckCircle2, XCircle, Clock, 
  Edit, Trash2, Eye, ExternalLink, Image as ImageIcon,
  Upload, Loader2, ArrowLeft
} from "lucide-react";
import { toast } from "sonner";
import api from "../../utils/api";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function DealerBlogsTab() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  // Pagination
  const [page, setPage] = useState(1);
  const itemsPerPage = 6;

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
      const { data } = await api.get('/blogs/author/my-blogs');
      if (data.success) {
        setBlogs(data.data);
      }
    } catch (err) {
      toast.error("Failed to load your articles");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this article?")) return;
    try {
      const { data } = await api.delete(`/blogs/author/${id}`);
      if (data.success) {
        toast.success("Article deleted successfully");
        setBlogs(blogs.filter(b => b._id !== id));
      }
    } catch (err) {
      toast.error("Failed to delete article");
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
        toast.success("Article updated! Status is now pending review.");
        setBlogs(blogs.map(b => b._id === data.data._id ? data.data : b));
      } else {
        const { data } = await api.post('/blogs/author', payload);
        toast.success("Article submitted for review!");
        setBlogs([data.data, ...blogs]);
      }
      setIsEditing(false);
      setCurrentBlog(null);
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to save article");
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
    const matchesSearch = b.title.toLowerCase().includes(searchQuery.toLowerCase());
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
      <motion.div 
        key="blog-editor"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="space-y-6 max-w-4xl"
      >
        <div className="flex items-center gap-4 border-b border-border pb-4">
          <button 
            onClick={() => setIsEditing(false)}
            className="p-2 rounded-full hover:bg-secondary transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-muted-foreground" />
          </button>
          <h2 className="font-display text-2xl font-bold">
            {currentBlog ? 'Edit Article' : 'Write New Article'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="bg-card p-6 rounded-2xl border border-border shadow-sm space-y-6">
            <div className="bg-primary-soft/30 border border-primary/20 text-primary p-4 rounded-xl text-sm font-medium mb-6">
              Note: All articles submitted by dealers undergo a mandatory review process by the administration team before being published live to the public blog.
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-bold border-b border-border pb-2">Basic Details</h3>
              <div className="grid gap-6">
                <div>
                  <label className="block text-sm font-semibold text-muted-foreground mb-1.5">Article Title</label>
                  <input
                    type="text"
                    required
                    maxLength={150}
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:border-primary outline-none transition-all"
                    placeholder="E.g., Top 10 Places to Invest in Jammu"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-muted-foreground mb-1.5">Short Excerpt</label>
                  <textarea
                    required
                    maxLength={300}
                    rows={2}
                    value={formData.excerpt}
                    onChange={e => setFormData({...formData, excerpt: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:border-primary outline-none transition-all resize-none"
                    placeholder="A brief summary of the article..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-muted-foreground mb-1.5">Cover Image</label>
                  <div className="flex items-center gap-6">
                    {formData.coverImage && (
                      <div className="relative w-32 h-20 rounded-lg overflow-hidden border border-border shrink-0">
                        <img src={formData.coverImage.startsWith('http') || formData.coverImage.startsWith('data:') ? formData.coverImage : `http://localhost:5000${formData.coverImage}`} alt="Cover" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <label className="flex-1 flex flex-col items-center justify-center p-6 border-2 border-dashed border-border rounded-xl hover:bg-secondary transition-colors cursor-pointer group">
                      <Upload className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors mb-2" />
                      <span className="text-sm font-medium">Click to upload image</span>
                      <span className="text-xs text-muted-foreground mt-1">JPG, PNG, WebP (Max 5MB)</span>
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-bold border-b border-border pb-2">Article Content</h3>
              <p className="text-xs text-muted-foreground -mt-2">Supports basic HTML tags for formatting (&lt;b&gt;, &lt;i&gt;, &lt;br&gt;, &lt;h2&gt;).</p>
              <textarea
                required
                rows={15}
                value={formData.content}
                onChange={e => setFormData({...formData, content: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:border-primary outline-none transition-all font-mono text-sm leading-relaxed"
                placeholder="<p>Start writing your article here...</p>"
              />
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-bold border-b border-border pb-2">SEO & Discovery</h3>
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-muted-foreground mb-1.5">Tags</label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={e => setFormData({...formData, tags: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:border-primary outline-none transition-all"
                    placeholder="real estate, investment, jammu (comma separated)"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-8 border-t border-border pt-6">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-6 py-2.5 rounded-xl border border-border bg-card font-semibold hover:bg-secondary transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-70 flex items-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
              {currentBlog ? 'Save Changes' : 'Submit Article'}
            </button>
          </div>
        </form>
      </motion.div>
    );
  }

  return (
    <motion.div 
      key="dealer-blogs"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-bold flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            My Articles
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">Publish articles and news to grow your audience</p>
        </div>
        <button
          onClick={() => openEditor()}
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl font-semibold hover:bg-primary/90 transition-colors shadow-sm text-sm"
        >
          <Plus className="w-4 h-4" />
          Write Article
        </button>
      </div>

      <div className="bg-card p-4 rounded-2xl border border-border shadow-sm flex flex-col md:flex-row gap-3 justify-between">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search your articles..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-4 py-2 text-sm bg-secondary border-none focus:ring-2 focus:ring-primary/20 rounded-xl outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="text-sm bg-secondary border-none rounded-xl px-4 py-2 font-semibold outline-none focus:ring-2 focus:ring-primary/20"
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
          className="text-sm bg-secondary border-none rounded-xl px-4 py-2 font-semibold outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="views">Most Viewed</option>
        </select>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-48 bg-card rounded-2xl border border-border shadow-sm">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mb-4" />
          <p className="text-muted-foreground font-medium text-sm">Loading articles...</p>
        </div>
      ) : paginatedBlogs.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 bg-card rounded-2xl border border-dashed border-border text-center px-6">
          <FileText className="w-8 h-8 text-muted-foreground mb-3" />
          <h3 className="text-sm font-bold">No articles found</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm">Write articles to attract more clients and boost your dealer profile visibility.</p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2">
          {paginatedBlogs.map(blog => (
            <div key={blog._id} className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm flex">
              <div className="w-1/3 min-w-[120px] relative bg-secondary">
                <img 
                  src={blog.coverImage.startsWith('http') ? blog.coverImage : `http://localhost:5000${blog.coverImage}`} 
                  alt={blog.title} 
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 left-2">
                  <span className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded border shadow-sm backdrop-blur-md ${
                    blog.status === 'Published' ? 'bg-emerald-500/90 text-white border-emerald-400' :
                    blog.status === 'Pending' ? 'bg-amber-500/90 text-white border-amber-400' :
                    blog.status === 'Rejected' ? 'bg-red-500/90 text-white border-red-400' :
                    'bg-slate-800/90 text-white border-slate-700'
                  }`}>
                    {blog.status}
                  </span>
                </div>
              </div>
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-sm line-clamp-2 leading-snug mb-1">
                    {blog.title}
                  </h3>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground mb-3">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(blog.createdAt).toLocaleDateString()}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {blog.views}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-border flex items-center justify-between">
                  <div className="flex gap-1.5">
                    <button 
                      onClick={() => openEditor(blog)}
                      className="w-7 h-7 rounded bg-secondary text-muted-foreground hover:bg-primary-soft hover:text-primary flex items-center justify-center transition-colors"
                      title="Edit"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => handleDelete(blog._id)}
                      className="w-7 h-7 rounded bg-secondary text-muted-foreground hover:bg-destructive/10 hover:text-destructive flex items-center justify-center transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  
                  {blog.status === 'Published' && (
                    <Link
                      to={`/blog/${blog.slug}`}
                      target="_blank"
                      className="px-2 py-1 bg-secondary text-muted-foreground hover:bg-secondary/70 rounded text-[10px] font-bold flex items-center gap-1"
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
        <div className="flex items-center justify-between px-5 py-3 bg-card rounded-2xl border border-border shadow-sm">
          <span className="text-xs text-muted-foreground font-medium">Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded-lg border border-border text-xs font-semibold hover:bg-secondary disabled:opacity-50 transition"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 rounded-lg border border-border text-xs font-semibold hover:bg-secondary disabled:opacity-50 transition"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
