import React from "react";
import { Shield } from "lucide-react";
import { motion } from "framer-motion";

export default function PrivacyPage() {
  const sections = [
    {
      title: "1. Information We Collect",
      content: (
        <>
          <p className="mb-3">We collect information to provide better services to all our users. The types of information we collect include:</p>
          <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
            <li>Personal identification information (Name, email address, phone number, etc.)</li>
            <li>Property preferences and search history on our platform</li>
            <li>Communication records when you contact our support or dealers</li>
            <li>Device and usage information (IP address, browser type, interactions)</li>
          </ul>
        </>
      )
    },
    {
      title: "2. How We Use Your Information",
      content: (
        <>
          <p className="mb-3">We use the information we collect for the following purposes:</p>
          <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
            <li>To provide, maintain, and improve our services</li>
            <li>To process your property inquiries and connect you with verified dealers</li>
            <li>To personalize your experience and deliver tailored content and property recommendations</li>
            <li>To communicate with you about updates, security alerts, and support messages</li>
          </ul>
        </>
      )
    },
    {
      title: "3. Information Sharing and Disclosure",
      content: (
        <>
          <p className="mb-3">We do not sell your personal information. We may share your information only in the following circumstances:</p>
          <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
            <li><strong>With Dealers:</strong> Only when you explicitly request a callback or submit an inquiry for a specific property.</li>
            <li><strong>For Legal Reasons:</strong> If required by law, regulation, or legal process to protect the rights, property, and safety of JKPlot, our users, or the public.</li>
            <li><strong>Service Providers:</strong> We may use third-party vendors to help operate our business, subject to strict confidentiality agreements.</li>
          </ul>
        </>
      )
    },
    {
      title: "4. Data Security",
      content: (
        <p>
          We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. We use industry-standard encryption for data transmission and secure servers for storage.
        </p>
      )
    },
    {
      title: "5. Your Privacy Rights",
      content: (
        <p>
          Depending on your location, you may have rights to access, correct, or delete your personal data. You can manage your preferences or request data deletion by contacting our support team or updating your profile settings in your dashboard.
        </p>
      )
    }
  ];

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
            Privacy Policy
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-4 text-muted-foreground"
          >
            Last updated: October 1, 2026. <br />
            We care about your privacy and are committed to protecting your personal data.
          </motion.p>
        </div>
      </div>

      <div className="container-px mx-auto max-w-4xl mt-12">
        <div className="rounded-3xl border border-border bg-card p-8 sm:p-12 shadow-sm space-y-12">
          {sections.map((section, idx) => (
            <motion.section 
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              className="space-y-4"
            >
              <h2 className="text-2xl font-display font-bold text-foreground border-b border-border pb-2">{section.title}</h2>
              <div className="text-muted-foreground leading-relaxed text-[15px]">
                {section.content}
              </div>
            </motion.section>
          ))}

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
