import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Calendar, User, Eye, Share2, Loader2, Tag } from "lucide-react";
import api from "../../utils/api";

export default function BlogDetailsPage() {
  const { slug } = useParams();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/blogs/${slug}`);
        if (data.success) {
          setBlog(data.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchBlog();
  }, [slug]);

  useEffect(() => {
    if (!blog) return;

    const metaTitle = blog.seo?.metaTitle || blog.title;
    const metaDesc = blog.seo?.metaDescription || blog.excerpt;

    document.title = `${metaTitle} | JKPlot Haven Blog`;
    
    // Update meta description
    let metaDescriptionTag = document.querySelector('meta[name="description"]');
    if (!metaDescriptionTag) {
      metaDescriptionTag = document.createElement('meta');
      metaDescriptionTag.name = "description";
      document.head.appendChild(metaDescriptionTag);
    }
    metaDescriptionTag.content = metaDesc;

  }, [blog]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4">
        <h1 className="text-3xl font-bold text-slate-800 mb-4">Article Not Found</h1>
        <p className="text-slate-500 mb-8 text-center max-w-md">The article you are looking for does not exist or has been removed.</p>
        <Link to="/blog" className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors">
          Back to Blog
        </Link>
      </div>
    );
  }

  const metaTitle = blog.seo?.metaTitle || blog.title;
  const metaDesc = blog.seo?.metaDescription || blog.excerpt;
  const keywords = blog.seo?.keywords?.join(', ') || blog.tags?.join(', ');

  return (
    <div className="min-h-screen bg-slate-50 pb-24">

      {/* Hero Image Section */}
      <div className="w-full h-[50vh] md:h-[60vh] relative bg-slate-900">
        <img 
          src={blog.coverImage.startsWith('http') ? blog.coverImage : `http://localhost:5000${blog.coverImage}`} 
          alt={blog.title} 
          className="w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent"></div>
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12">
          <div className="container-px mx-auto max-w-4xl">
            <Link to="/blog" className="inline-flex items-center gap-2 text-white/80 hover:text-white font-semibold mb-6 transition-colors text-sm uppercase tracking-wider">
              <ArrowLeft className="w-4 h-4" /> Back to Articles
            </Link>
            
            {blog.tags && blog.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {blog.tags.map(tag => (
                  <span key={tag} className="px-3 py-1 bg-indigo-600/90 backdrop-blur-sm text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm">
                    {tag}
                  </span>
                ))}
              </div>
            )}
            
            <h1 className="font-display text-3xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6 max-w-4xl shadow-sm">
              {blog.title}
            </h1>
            
            <div className="flex flex-wrap items-center gap-6 text-white/80 text-sm font-medium">
              <div className="flex items-center gap-2">
                {blog.author?.avatar ? (
                  <img src={blog.author.avatar.startsWith('http') ? blog.author.avatar : `http://localhost:5000${blog.author.avatar}`} alt="Author" className="w-8 h-8 rounded-full object-cover border-2 border-white/20" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-white/10 border-2 border-white/20 text-white font-bold flex items-center justify-center text-xs">
                    {blog.author?.name?.charAt(0) || 'U'}
                  </div>
                )}
                <span className="text-white font-semibold">{blog.author?.name || 'Guest'}</span>
              </div>
              <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> {new Date(blog.publishedAt || blog.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
              <span className="flex items-center gap-1.5"><Eye className="w-4 h-4" /> {blog.views} Views</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="container-px mx-auto max-w-4xl pt-12">
        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-slate-100 -mt-24 relative z-10">
          {/* Excerpt */}
          <div className="text-xl md:text-2xl text-slate-600 font-medium leading-relaxed mb-10 pb-10 border-b border-slate-100 italic">
            "{blog.excerpt}"
          </div>
          
          {/* Main Content */}
          <div 
            className="prose prose-lg md:prose-xl prose-indigo max-w-none text-slate-700
                       prose-headings:font-display prose-headings:font-bold prose-headings:text-slate-900
                       prose-a:text-indigo-600 prose-a:no-underline hover:prose-a:underline
                       prose-img:rounded-2xl prose-img:shadow-sm"
            dangerouslySetInnerHTML={{ __html: blog.content }}
          />

          {/* Footer actions */}
          <div className="mt-16 pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Tag className="w-4 h-4" /> Tags:
              </span>
              <div className="flex gap-2 flex-wrap">
                {blog.tags?.map(tag => (
                  <span key={tag} className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            
            <button 
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: blog.title,
                    url: window.location.href
                  });
                } else {
                  navigator.clipboard.writeText(window.location.href);
                  alert("Link copied to clipboard!");
                }
              }}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-50 text-indigo-700 font-bold rounded-xl hover:bg-indigo-100 transition-colors"
            >
              <Share2 className="w-4 h-4" /> Share Article
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
