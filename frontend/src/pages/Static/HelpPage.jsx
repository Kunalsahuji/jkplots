import { HelpCircle, Mail, Phone, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function HelpPage() {
  const faqs = [
    {
      q: "How do I list my property?",
      a: "Simply click on the 'Post Property' button on the top right. You'll need to create an account as a Dealer or User. Fill in the property details, upload photos, and submit for verification.",
    },
    {
      q: "Is it free to list a property?",
      a: "Yes, you can list a certain number of properties for free. For higher volume listings, we offer premium dealer subscriptions.",
    },
    {
      q: "How do I contact a seller?",
      a: "Click on any property listing to view its details. You'll find a 'Contact Dealer' or 'Send Message' button to get in touch directly.",
    },
    {
      q: "How are properties verified?",
      a: "Our team reviews listings and verifies them through documentation and sometimes physical checks to ensure authenticity.",
    },
    {
      q: "I forgot my password, what do I do?",
      a: "We use an OTP (One-Time Password) based login system for standard users and dealers. You simply need your registered phone number to log in.",
    },
  ];

  return (
    <div className="container-px mx-auto max-w-4xl py-12 lg:py-20 space-y-12">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 text-primary">
          <HelpCircle className="h-8 w-8" />
        </div>
        <h1 className="font-display text-4xl font-bold tracking-tight">Help Center</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          We're here to help. Browse our most frequently asked questions or get in touch with our support team.
        </p>
      </div>

      {/* FAQs */}
      <div className="bg-card border border-border rounded-3xl p-6 md:p-10 shadow-sm space-y-8">
        <h2 className="text-2xl font-bold font-display">Frequently Asked Questions</h2>
        <div className="divide-y divide-border">
          {faqs.map((faq, i) => (
            <div key={i} className="py-6 first:pt-0 last:pb-0">
              <h3 className="text-lg font-semibold text-foreground mb-2">{faq.q}</h3>
              <p className="text-muted-foreground leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Still need help? */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-secondary/40 rounded-3xl p-8 border border-border flex flex-col items-start text-left">
          <Mail className="h-8 w-8 text-primary mb-4" />
          <h3 className="text-xl font-bold mb-2">Email Support</h3>
          <p className="text-muted-foreground mb-6">
            Send us an email anytime and our team will get back to you within 24 hours.
          </p>
          <Link to="/contact" className="mt-auto text-primary font-semibold flex items-center gap-2 hover:gap-3 transition-all">
            Contact Us <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        
        <div className="bg-secondary/40 rounded-3xl p-8 border border-border flex flex-col items-start text-left">
          <Phone className="h-8 w-8 text-primary mb-4" />
          <h3 className="text-xl font-bold mb-2">Call Us</h3>
          <p className="text-muted-foreground mb-6">
            Prefer talking to a human? Our support line is open Monday to Saturday, 10 AM to 6 PM.
          </p>
          <a href="tel:+911800000000" className="mt-auto text-primary font-semibold flex items-center gap-2 hover:gap-3 transition-all">
            +91 1800 000 000 <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </div>
  );
}
