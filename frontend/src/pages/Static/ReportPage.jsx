import { ShieldAlert, Info, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function ReportPage() {
  return (
    <div className="container-px mx-auto max-w-3xl py-12 lg:py-20 space-y-10">
      <div className="text-center space-y-4">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-destructive/10 text-destructive">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h1 className="font-display text-4xl font-bold tracking-tight">Report a Listing</h1>
        <p className="text-lg text-muted-foreground">
          We take the safety and authenticity of our marketplace very seriously. 
          Learn how to report fraudulent or inaccurate listings.
        </p>
      </div>

      <div className="bg-card border border-border rounded-3xl p-6 md:p-10 shadow-sm space-y-6 text-foreground leading-relaxed">
        <h2 className="text-2xl font-bold font-display border-b border-border pb-4">How to Report</h2>
        
        <p>
          If you encounter a property listing that seems suspicious, inaccurate, or violates our terms of service, you can report it directly from the property's details page.
        </p>

        <div className="bg-secondary/50 rounded-2xl p-6 space-y-4 border border-border">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <Info className="h-5 w-5 text-primary" /> 
            Steps to report a property:
          </h3>
          <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
            <li>Navigate to the property's detail page.</li>
            <li>Scroll down to the "Fraud & Safety" section.</li>
            <li>Click the "Report this Property" button.</li>
            <li>Select the reason for reporting and provide any additional details.</li>
            <li>Submit the report.</li>
          </ol>
        </div>

        <h3 className="text-xl font-bold pt-4">What happens next?</h3>
        <p>
          Once a report is submitted, our moderation team will investigate the listing. We may contact the dealer for clarification. If the listing is found to be in violation of our policies, it will be removed and the dealer may face suspension.
        </p>

        <div className="pt-6 flex justify-center">
          <Link to="/explore" className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors">
            Back to Explore <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
