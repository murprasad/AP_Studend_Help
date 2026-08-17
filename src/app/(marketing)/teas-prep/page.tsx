import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Stethoscope, ShieldAlert, MessageSquareText } from "lucide-react";

export const metadata: Metadata = {
  title: "TEAS Prep — In Build | PrepLion",
  description:
    "TEAS prep is being built now. We are finishing the route, content fidelity, and launch checks before opening it publicly.",
  alternates: { canonical: "/teas-prep" },
};

export default function TeasPrepPage() {
  return (
    <main className="bg-white text-cb-indigo">
      <section className="bg-cb-cobalt text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <p className="text-sm font-medium uppercase tracking-wider text-white/70 mb-4">
            TEAS Prep
          </p>
          <h1 className="font-roboto-slab font-bold tracking-tight text-4xl sm:text-5xl lg:text-6xl leading-[1.05] max-w-3xl">
            TEAS is in build.
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-white/85 max-w-2xl leading-relaxed">
            We are finishing the public route, serving checks, and nursing-content
            fidelity before we open TEAS as a first-class product. The work is
            underway; the public launch is not yet certified.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 items-start">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-cb-yellow text-cb-indigo font-medium text-base hover:bg-yellow-400 transition-colors"
            >
              Contact us
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center px-7 py-3.5 rounded-full border border-white/30 text-white/90 hover:bg-white/10 transition-colors"
            >
              See current plans
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <h2 className="font-roboto-slab font-bold text-2xl sm:text-3xl mb-3">
            What’s happening now
          </h2>
          <p className="text-cb-muted text-base max-w-2xl mb-10">
            TEAS is not a placeholder. The content bank and serving path are
            being checked before we expose it as a fully supported product.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="rounded-2xl border border-cb-cardBorder p-6">
              <ShieldAlert className="h-6 w-6 text-cb-cobalt mb-3" aria-hidden />
              <h3 className="font-medium text-lg mb-1.5">Trust first</h3>
              <p className="text-cb-muted text-sm leading-relaxed">
                The route now exists, so the site no longer advertises a missing
                page. The launch copy will stay honest until the product is ready.
              </p>
            </div>
            <div className="rounded-2xl border border-cb-cardBorder p-6">
              <Stethoscope className="h-6 w-6 text-cb-cobalt mb-3" aria-hidden />
              <h3 className="font-medium text-lg mb-1.5">Nursing content</h3>
              <p className="text-cb-muted text-sm leading-relaxed">
                TEAS science and nursing-school prep need their own review pass.
                We are not shipping that surface until it passes the same bar as CLEP.
              </p>
            </div>
            <div className="rounded-2xl border border-cb-cardBorder p-6">
              <MessageSquareText className="h-6 w-6 text-cb-cobalt mb-3" aria-hidden />
              <h3 className="font-medium text-lg mb-1.5">Want updates?</h3>
              <p className="text-cb-muted text-sm leading-relaxed">
                Use the contact page if you want TEAS launch updates or need help
                finding the current nursing-related path.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
