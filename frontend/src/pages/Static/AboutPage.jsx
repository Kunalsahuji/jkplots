import React from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, Target, Users, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

export default function AboutPage() {
  const stats = [
    { label: "Properties Listed", value: "10K+" },
    { label: "Happy Customers", value: "5,000+" },
    { label: "Verified Dealers", value: "300+" },
    { label: "Cities Covered", value: "20+" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative bg-primary/5 py-24 sm:py-32 overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center opacity-10 mix-blend-overlay"></div>
        <div className="container-px mx-auto max-w-7xl relative z-10 text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-display font-bold tracking-tight text-foreground sm:text-6xl"
          >
            About <span className="text-primary">JKPlot</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-6 text-lg leading-8 text-muted-foreground max-w-2xl mx-auto"
          >
            We're building Jammu & Kashmir's most trusted real estate marketplace. 
            Our mission is to bring transparency, efficiency, and trust to property transactions.
          </motion.p>
        </div>
      </div>

      <div className="container-px mx-auto max-w-7xl py-16 sm:py-24">
        {/* Mission & Vision */}
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <h2 className="text-3xl font-display font-bold text-foreground">Our Vision</h2>
            <p className="text-muted-foreground leading-relaxed">
              Finding the perfect home or investment should be an exciting journey, not a stressful task. 
              At JKPlot, we envision a seamless ecosystem where buyers, sellers, and dealers can connect 
              with absolute confidence.
            </p>
            <div className="space-y-4 pt-4">
              <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">100% Verified Listings</h3>
                  <p className="text-sm text-muted-foreground mt-1">Every property undergoes strict quality checks.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Target className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Transparent Pricing</h3>
                  <p className="text-sm text-muted-foreground mt-1">No hidden fees or misleading estimates.</p>
                </div>
              </div>
            </div>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl">
              <img 
                src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1000&q=80" 
                alt="Modern Architecture" 
                className="w-full h-full object-cover"
              />
            </div>
          </motion.div>
        </div>

        {/* Stats */}
        <div className="mt-24 grid grid-cols-2 gap-8 sm:grid-cols-4 rounded-3xl bg-card border border-border p-8 shadow-sm">
          {stats.map((stat, idx) => (
            <div key={idx} className="text-center p-4">
              <div className="text-4xl font-display font-bold text-primary mb-2">{stat.value}</div>
              <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Call to action */}
        <div className="mt-24 text-center rounded-3xl bg-primary/5 border border-border/50 p-12 relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-3xl font-display font-bold text-foreground">Ready to find your dream property?</h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
              Join thousands of users who have successfully bought, sold, or rented properties through JKPlot.
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Link to="/properties" className="rounded-xl bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90 transition">
                Explore Properties
              </Link>
              <Link to="/contact" className="rounded-xl bg-secondary px-8 py-3 text-sm font-semibold text-foreground shadow-sm border border-border hover:bg-secondary/80 transition">
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
