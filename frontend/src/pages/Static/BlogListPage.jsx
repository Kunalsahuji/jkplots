import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Search, Calendar, User, ArrowRight, BookOpen, Loader2 } from "lucide-react";
import api from "../../utils/api";

export default function BlogListPage() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchBlogs();
  }, [searchQuery]);

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const url = searchQuery ? `/blogs?search=${searchQuery}` : `/blogs`;
      const { data } = await api.get(url);
      if (data.success) {
        setBlogs(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = "Real Estate Blog & Market Insights | JKPlot Haven";
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 pb-20">

      {/* Hero Section */}
      <div className="bg-indigo-900 text-white pt-24 pb-16 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500 via-indigo-900 to-transparent"></div>
        <div className="container-px mx-auto max-w-7xl relative z-10 text-center">
          <BookOpen className="h-12 w-12 mx-auto text-indigo-300 mb-6" />
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight">
            Insights & Market Trends
          </h1>
          <p className="text-lg md:text-xl text-indigo-200 max-w-2xl mx-auto mb-10 leading-relaxed">
            Discover expert advice, real estate market analysis, and tips for buying, selling, or renting properties in Jammu.
          </p>
          
          <div className="max-w-xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-indigo-900/50" />
            <input
              type="text"
              placeholder="Search articles, guides, and news..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white text-indigo-900 font-medium placeholder:text-indigo-900/40 focus:outline-none focus:ring-4 focus:ring-indigo-500/30 shadow-xl transition-all"
            />
          </div>
        </div>
      </div>

      <div className="container-px mx-auto max-w-7xl py-16">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-10 w-10 text-indigo-500 animate-spin mb-4" />
            <p className="text-slate-500 font-medium">Loading articles...</p>
          </div>
        ) : blogs.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
              <Search className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">No articles found</h3>
            <p className="text-slate-500">We couldn't find any articles matching your search.</p>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {blogs.map(blog => (
              <Link 
                key={blog._id} 
                to={`/blog/${blog.slug}`}
                className="group flex flex-col bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all duration-300 transform hover:-translate-y-1"
              >
                <div className="relative h-56 overflow-hidden bg-slate-100">
                  <img 
                    src={blog.coverImage.startsWith('http') ? blog.coverImage : `http://localhost:5000${blog.coverImage}`}
                    alt={blog.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {blog.tags && blog.tags.length > 0 && (
                    <div className="absolute top-4 left-4">
                      <span className="px-3 py-1 bg-white/90 backdrop-blur-md text-indigo-700 text-xs font-bold uppercase tracking-wider rounded-full shadow-sm">
                        {blog.tags[0]}
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex items-center gap-4 text-xs font-semibold text-slate-400 mb-4 uppercase tracking-wider">
                    <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {new Date(blog.publishedAt || blog.createdAt).toLocaleDateString()}</span>
                  </div>
                  <h3 className="font-display text-xl font-bold text-slate-900 leading-tight mb-3 group-hover:text-indigo-600 transition-colors line-clamp-2">
                    {blog.title}
                  </h3>
                  <p className="text-slate-500 text-sm leading-relaxed line-clamp-3 mb-6 flex-1">
                    {blog.excerpt}
                  </p>
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-auto">
                    <div className="flex items-center gap-2">
                      {blog.author?.avatar ? (
                        <img src={blog.author.avatar.startsWith('http') ? blog.author.avatar : `http://localhost:5000${blog.author.avatar}`} alt="Author" className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center text-xs">
                          {blog.author?.name?.charAt(0) || 'U'}
                        </div>
                      )}
                      <span className="text-sm font-semibold text-slate-700">{blog.author?.name || 'Guest'}</span>
                    </div>
                    <span className="text-indigo-600 font-semibold text-sm flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      Read <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
