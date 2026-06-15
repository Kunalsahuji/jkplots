import React, { useEffect, useState } from "react";
import { Shield, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import api from "@/utils/api";

export default function PrivacyPage() {
  const [pageData, setPageData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPage = async () => {
      try {
        const { data } = await api.get("/legal/privacy-policy");
        if (data.success) {
          setPageData(data.data);
        }
      } catch (err) {
        console.error("Failed to load privacy policy from DB", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPage();
  }, []);

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-primary/5 py-16 border-b border-border">
        <div className="container-px mx-auto max-w-4xl text-center">
          <div className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 text-primary">
            <Shield className="h-8 w-8" />
          </div>
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-display font-bold text-foreground"
          >
            {pageData?.title || "Privacy Policy"}
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-4 text-muted-foreground text-sm"
          >
            {pageData?.updatedAt ? `Last updated: ${new Date(pageData.updatedAt).toLocaleDateString()}` : "Loading..."} <br />
            We care about your privacy and are committed to protecting your personal data.
          </motion.p>
        </div>
      </div>

      <div className="container-px mx-auto max-w-4xl mt-12">
        <div className="rounded-3xl border border-border bg-card p-8 sm:p-12 shadow-sm min-h-[300px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading agreement details...</p>
            </div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="prose prose-slate max-w-none text-muted-foreground leading-relaxed text-[15px] space-y-6"
              dangerouslySetInnerHTML={{ __html: pageData?.content || "<p>Privacy policy content is currently empty.</p>" }}
            />
          )}

          <motion.section 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mt-12 rounded-2xl bg-secondary/30 p-6 border border-border"
          >
            <h3 className="font-bold text-foreground mb-2">Questions about our Privacy Policy?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              If you have any questions, concerns, or requests regarding this Privacy Policy, please contact our Data Protection Officer.
            </p>
            <a href="mailto:privacy@jkplot.in" className="text-sm font-semibold text-primary hover:underline">
              privacy@jkplot.in
            </a>
          </motion.section>
        </div>
      </div>
    </div>
  );
}
