import { useEffect, useState } from "react";
import { Loader2, FileText, Save, Eye, Edit3 } from "lucide-react";
import api from "@/utils/api";
import { toast } from "sonner";

export default function AdminLegalPage() {
  const [slug, setSlug] = useState("privacy-policy");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [updatedBy, setUpdatedBy] = useState("");
  const [updatedAt, setUpdatedAt] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  const fetchPageDetails = async (currentSlug) => {
    setLoading(true);
    try {
      const { data } = await api.get(`/legal/${currentSlug}`);
      if (data.success) {
        setTitle(data.data.title);
        setContent(data.data.content);
        setUpdatedBy(data.data.updatedBy);
        setUpdatedAt(data.data.updatedAt);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load legal document content");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPageDetails(slug);
  }, [slug]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      return toast.error("Please provide both title and document content.");
    }

    setSaving(true);
    try {
      const { data } = await api.put(`/legal/${slug}`, { title, content });
      if (data.success) {
        toast.success("Legal document updated successfully!");
        setUpdatedBy(data.data.updatedBy);
        setUpdatedAt(data.data.updatedAt);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to update page");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 relative text-slate-800 max-w-6xl">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-slate-900 tracking-tight">
            Legal Pages CMS
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Dynamically update privacy policy agreements and terms of service guidelines.
          </p>
        </div>

        {/* Document Switcher */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSlug("privacy-policy")}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border ${
              slug === "privacy-policy"
                ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
            }`}
          >
            Privacy Policy
          </button>
          <button
            onClick={() => setSlug("terms-of-service")}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border ${
              slug === "terms-of-service"
                ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
            }`}
          >
            Terms of Service
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          <p className="text-sm text-slate-500 font-medium mt-3">Fetching document content...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main workspace */}
          <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-slate-400" />
                <span className="font-bold text-slate-900 text-lg">Document Editor</span>
              </div>

              {/* View/Edit Toggle */}
              <div className="flex bg-slate-100 p-0.5 rounded-lg">
                <button
                  type="button"
                  onClick={() => setPreviewMode(false)}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition flex items-center gap-1.5 ${
                    !previewMode ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  Editor
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode(true)}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition flex items-center gap-1.5 ${
                    previewMode ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  <Eye className="h-3.5 w-3.5" />
                  Live Preview
                </button>
              </div>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              {!previewMode ? (
                <>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase">Document Title</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                      className="w-full mt-1 border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-slate-900 outline-none font-semibold text-slate-900"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-bold text-slate-400 uppercase">Document Content (HTML / Rich Text)</label>
                      <span className="text-[10px] text-slate-400">Wrap sections in &lt;h3&gt; and paragraphs in &lt;p&gt;</span>
                    </div>
                    <textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      required
                      rows={18}
                      className="w-full border border-slate-200 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-slate-900 outline-none font-mono resize-none leading-relaxed text-slate-700 bg-slate-50/50"
                    />
                  </div>
                </>
              ) : (
                <div className="space-y-6 min-h-[500px]">
                  <h1 className="text-3xl font-display font-bold text-slate-900 border-b border-slate-100 pb-3">{title}</h1>
                  <div 
                    className="prose prose-slate max-w-none text-slate-600 leading-relaxed text-sm space-y-4"
                    dangerouslySetInnerHTML={{ __html: content }}
                  />
                </div>
              )}

              <div className="flex justify-end pt-2 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl px-5 py-2.5 text-sm font-bold transition flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Save className="w-4 h-4" /> Save Agreement Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Sidebar Metadata */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-900 text-md">Document Metadata</h3>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-2 border-b border-slate-50">
                  <span className="text-slate-400 font-medium">Page Slug</span>
                  <span className="font-mono text-slate-600 bg-slate-50 px-2 py-0.5 rounded">{slug}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-50">
                  <span className="text-slate-400 font-medium">Updated By</span>
                  <span className="font-semibold text-slate-800">{updatedBy || "N/A"}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-400 font-medium">Last Modified</span>
                  <span className="font-semibold text-slate-800">
                    {updatedAt ? new Date(updatedAt).toLocaleString() : "N/A"}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-amber-50/70 border border-amber-100 p-5 rounded-2xl space-y-2">
              <h4 className="font-bold text-amber-900 text-sm">HTML Guidelines</h4>
              <p className="text-xs text-amber-800/80 leading-relaxed">
                You can write raw text or format using HTML tags. Standard tags supported:
              </p>
              <ul className="list-disc pl-4 text-xs text-amber-800/80 space-y-1">
                <li><code className="bg-amber-100/50 px-1 rounded">&lt;h3&gt;Section Title&lt;/h3&gt;</code></li>
                <li><code className="bg-amber-100/50 px-1 rounded">&lt;p&gt;Paragraph body text&lt;/p&gt;</code></li>
                <li><code className="bg-amber-100/50 px-1 rounded">&lt;ul&gt; &lt;li&gt;List item&lt;/li&gt; &lt;/ul&gt;</code></li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
