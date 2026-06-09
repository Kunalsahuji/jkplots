import React from "react";
import { FileText } from "lucide-react";
import { motion } from "framer-motion";

export default function TermsPage() {
  const sections = [
    {
      id: "acceptance",
      title: "1. Acceptance of Terms",
      content: "By accessing and using JKPlot (the 'Platform'), you agree to comply with and be bound by these Terms of Service. If you do not agree to these terms, please do not use our Platform. We reserve the right to update or modify these terms at any time without prior notice."
    },
    {
      id: "user-accounts",
      title: "2. User Accounts & Security",
      content: "To access certain features of the Platform, you must create an account. You are entirely responsible for maintaining the confidentiality of your login credentials and for any activities that occur under your account. JKPlot will not be liable for any loss or damage arising from your failure to protect your account information."
    },
    {
      id: "property-listings",
      title: "3. Property Listings & Accuracy",
      content: "While we strive to ensure that all property listings are accurate and up-to-date, JKPlot does not guarantee the exactness, completeness, or reliability of any property details provided by dealers or users. It is the responsibility of the buyer or tenant to independently verify all property information, including legal ownership, dimensions, and amenities, before making any financial commitments."
    },
    {
      id: "dealer-conduct",
      title: "4. Dealer Conduct & Verification",
      content: "Dealers listing properties on JKPlot must provide accurate information and hold the necessary rights or authorizations to advertise the respective properties. We reserve the right to suspend or terminate dealer accounts that engage in fraudulent activities, post misleading listings, or violate our community guidelines."
    },
    {
      id: "limitation-liability",
      title: "5. Limitation of Liability",
      content: "JKPlot acts purely as a digital intermediary platform connecting property seekers with dealers and sellers. We are not a party to any real estate transaction. Therefore, JKPlot shall not be held liable for any direct, indirect, incidental, or consequential damages resulting from transactions, disputes, or agreements made between users of the Platform."
    },
    {
      id: "governing-law",
      title: "6. Governing Law & Jurisdiction",
      content: "These Terms of Service shall be governed by and construed in accordance with the laws of India. Any disputes arising out of or related to these terms or the use of the Platform shall be subject to the exclusive jurisdiction of the courts located in Srinagar, Jammu & Kashmir."
    }
  ];

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -100; 
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-primary/5 py-16 border-b border-border">
        <div className="container-px mx-auto max-w-5xl text-center">
          <div className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 text-primary">
            <FileText className="h-8 w-8" />
          </div>
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-display font-bold text-foreground"
          >
            Terms of Service
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-4 text-muted-foreground"
          >
            Last updated: October 1, 2026. <br />
            Please read these terms carefully before using our platform.
          </motion.p>
        </div>
      </div>

      <div className="container-px mx-auto max-w-6xl mt-12">
        <div className="grid md:grid-cols-[1fr_3fr] gap-10 items-start">
          
          {/* Table of Contents - Sticky Sidebar */}
          <motion.aside 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="sticky top-24 hidden md:block rounded-2xl border border-border bg-card p-5 shadow-sm"
          >
            <h3 className="font-bold text-foreground mb-4 uppercase tracking-wider text-xs">Table of Contents</h3>
            <ul className="space-y-3">
              {sections.map((section) => (
                <li key={section.id}>
                  <button 
                    onClick={() => scrollToSection(section.id)}
                    className="text-sm text-muted-foreground hover:text-primary transition text-left"
                  >
                    {section.title}
                  </button>
                </li>
              ))}
            </ul>
          </motion.aside>

          {/* Content Area */}
          <div className="rounded-3xl border border-border bg-card p-8 sm:p-12 shadow-sm space-y-12">
            {sections.map((section, idx) => (
              <motion.section 
                key={section.id}
                id={section.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                className="scroll-mt-24 space-y-4"
              >
                <h2 className="text-2xl font-display font-bold text-foreground border-b border-border pb-2">{section.title}</h2>
                <div className="text-muted-foreground leading-relaxed text-[15px]">
                  <p>{section.content}</p>
                </div>
              </motion.section>
            ))}

            <motion.div 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="mt-12 pt-8 border-t border-border"
            >
              <p className="text-sm text-muted-foreground text-center">
                By continuing to use JKPlot, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
              </p>
            </motion.div>
          </div>

        </div>
      </div>
    </div>
  );
}
