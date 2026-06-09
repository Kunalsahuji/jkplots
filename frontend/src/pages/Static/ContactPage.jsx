import React, { useState } from "react";
import { Mail, Phone, MapPin, Send } from "lucide-react";
import { motion } from "framer-motion";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simulate form submission
    alert("Message sent successfully! We will get back to you soon.");
    setFormData({ name: "", email: "", subject: "", message: "" });
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-primary/5 py-16 border-b border-border">
        <div className="container-px mx-auto max-w-7xl text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-display font-bold text-foreground"
          >
            Get in Touch
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-4 text-muted-foreground"
          >
            Have questions about a property or need support? Our team is here to help.
          </motion.p>
        </div>
      </div>

      <div className="container-px mx-auto max-w-7xl mt-16">
        <div className="grid lg:grid-cols-[1fr_2fr] gap-12">
          {/* Contact Info Sidebar */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-8">
              <h3 className="font-display text-xl font-bold border-b border-border pb-4">Contact Information</h3>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground text-sm">Office Address</h4>
                    <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                      123 Business Avenue, <br />
                      Sector 4, Srinagar, <br />
                      Jammu & Kashmir 190001
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                    <Phone className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground text-sm">Phone</h4>
                    <p className="mt-1 text-sm text-muted-foreground">
                      +91 1800 123 4567<br />
                      Mon-Fri, 9am to 6pm
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground text-sm">Email</h4>
                    <p className="mt-1 text-sm text-muted-foreground">
                      support@jkplot.in<br />
                      sales@jkplot.in
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Contact Form */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
              <h2 className="text-2xl font-display font-bold mb-6">Send us a Message</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Your Name</label>
                    <input 
                      required
                      type="text" 
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition"
                      placeholder="John Doe"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email Address</label>
                    <input 
                      required
                      type="email" 
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition"
                      placeholder="john@example.com"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Subject</label>
                  <input 
                    required
                    type="text" 
                    value={formData.subject}
                    onChange={(e) => setFormData({...formData, subject: e.target.value})}
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition"
                    placeholder="How can we help?"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Message</label>
                  <textarea 
                    required
                    rows={5}
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition resize-none"
                    placeholder="Provide details about your inquiry..."
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-primary px-8 py-3.5 text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90 transition"
                >
                  <Send className="h-4 w-4" /> Send Message
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
