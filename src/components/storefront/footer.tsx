import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Facebook, Mail, MapPin, MessageCircle, Phone } from "lucide-react";

import { logoImage } from "@/lib/images";
import { siteSettingsQueryOptions, whatsappLink } from "@/lib/queries";

export function Footer() {
  const { data: settings } = useQuery(siteSettingsQueryOptions());
  const business = settings?.business;

  return (
    <footer className="mt-16 border-t border-border/60 bg-secondary/40">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-8 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center overflow-hidden rounded-full">
              <img src={logoImage} alt="" className="h-full w-full object-cover" />
            </span>
            <span className="font-display text-[15px] font-bold text-foreground">
              {business?.name ?? "Ozee Electrical"}
            </span>
          </div>
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">
            Power, light and solar products for homes and businesses across Lagos.
          </p>
        </div>

        <div>
          <h3 className="font-display text-sm font-semibold text-foreground">Shop</h3>
          <div className="mt-3 flex flex-col gap-2 text-sm text-muted-foreground">
            <Link to="/shop" className="transition-colors hover:text-foreground">
              All products
            </Link>
            <Link to="/categories" className="transition-colors hover:text-foreground">
              Categories
            </Link>
            <Link to="/cart" className="transition-colors hover:text-foreground">
              Cart
            </Link>
          </div>
        </div>

        <div>
          <h3 className="font-display text-sm font-semibold text-foreground">Company</h3>
          <div className="mt-3 flex flex-col gap-2 text-sm text-muted-foreground">
            <Link to="/about" className="transition-colors hover:text-foreground">
              About
            </Link>
            <Link to="/services" className="transition-colors hover:text-foreground">
              Services
            </Link>
            <Link to="/contact" className="transition-colors hover:text-foreground">
              Contact
            </Link>
            <Link to="/faq" className="transition-colors hover:text-foreground">
              FAQ
            </Link>
          </div>
        </div>

        <div>
          <h3 className="font-display text-sm font-semibold text-foreground">Contact</h3>
          <div className="mt-3 flex flex-col gap-2.5 text-sm text-muted-foreground">
            {business?.address && (
              <span className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                {business.address}
              </span>
            )}
            {business?.phone_primary && (
              <a
                href={`tel:${business.phone_primary}`}
                className="flex items-center gap-2 hover:text-foreground"
              >
                <Phone className="h-4 w-4 shrink-0 text-brand" />
                {business.phone_primary}
                {business.phone_secondary ? ` / ${business.phone_secondary}` : ""}
              </a>
            )}
            {business?.email && (
              <a
                href={`mailto:${business.email}`}
                className="flex items-center gap-2 hover:text-foreground"
              >
                <Mail className="h-4 w-4 shrink-0 text-brand" />
                {business.email}
              </a>
            )}
            {business && (
              <a
                href={whatsappLink(business, "Hi, I'd like to ask about a product.")}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 hover:text-foreground"
              >
                <MessageCircle className="h-4 w-4 shrink-0 text-brand" />
                Chat on WhatsApp
              </a>
            )}
            {business?.facebook && (
              <span className="flex items-center gap-2">
                <Facebook className="h-4 w-4 shrink-0 text-brand" />
                {business.facebook}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="border-t border-border/60 px-4 py-4 sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
          <span>
            © {new Date().getFullYear()} {business?.name ?? "Ozee Electrical"}. All rights reserved.
          </span>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <Link to="/privacy-policy" className="hover:text-foreground">
              Privacy Policy
            </Link>
            <Link to="/terms" className="hover:text-foreground">
              Terms
            </Link>
            <Link to="/returns" className="hover:text-foreground">
              Returns
            </Link>
            <Link to="/warranty" className="hover:text-foreground">
              Warranty
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
