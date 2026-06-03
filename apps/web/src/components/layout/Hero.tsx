import Link from "next/link";
import Image from "next/image";
import { Truck, ShieldCheck, RotateCcw, Star } from "lucide-react";
import heroImage from "@/assets/images/hero.svg";

export function Hero() {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-night via-night-700 to-night-600 px-6 py-12 text-white shadow-xl sm:px-12 sm:py-16">
      {/* glow accents */}
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-gold/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 left-10 h-72 w-72 rounded-full bg-teal/20 blur-3xl" />

      <div className="relative grid items-center gap-10 lg:grid-cols-2">
        {/* Copy */}
        <div className="max-w-xl animate-fade-up">
          <span className="inline-flex items-center rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-gold">
            Premium Selection · Free Prime Delivery
          </span>
          <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            Everything you love,
            <br />
            <span className="text-gold">delivered beautifully.</span>
          </h1>
          <p className="mt-4 max-w-lg text-zinc-300">
            Discover a hand-picked catalog of premium goods with secure Stripe
            checkout and lightning-fast delivery.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="#catalog"
              className="rounded-full bg-gold px-6 py-3 text-sm font-bold text-ink shadow-lg transition hover:bg-gold-600 active:scale-[0.98]"
            >
              Shop the catalog
            </Link>
            <Link
              href="#catalog"
              className="rounded-full border border-white/25 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Today&apos;s deals
            </Link>
          </div>

          <div className="mt-9 flex flex-wrap gap-x-8 gap-y-3 text-sm text-zinc-200">
            <span className="flex items-center gap-2">
              <Truck size={18} className="text-gold" /> Free fast delivery
            </span>
            <span className="flex items-center gap-2">
              <ShieldCheck size={18} className="text-gold" /> Secure Stripe checkout
            </span>
            <span className="flex items-center gap-2">
              <RotateCcw size={18} className="text-gold" /> 30-day returns
            </span>
          </div>
        </div>

        {/* Visual */}
        <div className="relative mx-auto w-full max-w-md animate-fade-up lg:max-w-none">
          <div className="relative aspect-[5/4] w-full">
            <Image
              src={heroImage}
              alt="A premium shopping experience"
              fill
              priority
              unoptimized
              sizes="(max-width: 1024px) 90vw, 40vw"
              className="object-contain drop-shadow-2xl"
            />
          </div>

          {/* floating rating badge */}
          <div className="absolute -bottom-3 left-2 flex items-center gap-2 rounded-2xl bg-white/95 px-4 py-2.5 text-ink shadow-xl backdrop-blur sm:left-6">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-gold/20">
              <Star size={18} className="text-gold-600" fill="currentColor" />
            </span>
            <div className="leading-tight">
              <p className="text-sm font-bold">4.9 / 5 rating</p>
              <p className="text-[11px] text-zinc-500">12,400+ happy customers</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
