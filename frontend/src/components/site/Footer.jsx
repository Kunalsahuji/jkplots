import { Link } from "react-router-dom";
import { Home, Mail, Phone } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-border bg-secondary/40">
      <div className="container-px mx-auto max-w-7xl py-12">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-hero text-primary-foreground">
                <Home className="h-4 w-4" />
              </span>
              <span className="font-display text-xl font-bold">
                JK<span className="text-primary">PLOT</span>
              </span>
            </Link>
            <p className="mt-4 max-w-sm text-sm text-muted-foreground">
              Jammu &amp; Kashmir's most trusted property marketplace. Verified listings, transparent pricing, real dealers.
            </p>

          </div>

          {[
            {
              title: "Explore",
              links: [
                ["Buy", "/properties?purpose=Buy"],
                ["Rent", "/properties?purpose=Rent"],
                ["Plots", "/properties?type=Plot"],
                ["Commercial", "/properties?purpose=Commercial"],
              ],
            },
            {
              title: "Company",
              links: [
                ["About", "/about"],
                ["Dealers", "/dealers"],
                ["Blog", "/blog"],
                ["Contact", "/contact"],
              ],
            },
            {
              title: "Support",
              links: [
                ["Help Center", "/help"],
                ["Report Listing", "/report"],
                ["Terms", "/terms"],
                ["Privacy", "/privacy"],
              ],
            },
          ].map((col) => (
            <div key={col.title}>
              <h4 className="text-sm font-semibold">{col.title}</h4>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                {col.links.map(([label, href]) => (
                  <li key={label}>
                    <Link to={href} className="hover:text-foreground">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-border pt-6 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} JKPLOT. All rights reserved.</p>
          <div className="flex flex-wrap gap-4">
            <span className="flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5" />
              <span>+91 1800 000 000</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5" />
              <span>Jkplot878@gmail.com</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
