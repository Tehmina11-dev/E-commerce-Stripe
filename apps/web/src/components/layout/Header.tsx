"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { MapPin, Search, ShoppingCart } from "lucide-react";
import { useCart } from "@/components/cart/CartProvider";

function HeaderSearchInput() {
  const params = useSearchParams();
  const router = useRouter();

  function onSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = new FormData(e.currentTarget).get("q")?.toString().trim() ?? "";
    router.push(q ? `/?q=${encodeURIComponent(q)}` : "/");
  }

  return (
    <form onSubmit={onSearch} className="flex flex-1">
      <input
        name="q"
        defaultValue={params.get("q") ?? ""}
        placeholder="Search Luxmart for premium goods…"
        className="w-full rounded-l-full border-0 bg-white px-4 py-2 text-sm text-ink outline-none ring-gold focus:ring-2"
      />
      <button
        type="submit"
        aria-label="Search"
        className="rounded-r-full bg-gold px-4 text-ink transition hover:bg-gold-600"
      >
        <Search size={18} />
      </button>
    </form>
  );
}

export function Header() {
  const { count, hydrated } = useCart();
  const [isMounted, setIsMounted] = useState(false);

  // Trigger client-side synchronization post-mounting to terminate hydration variances
  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-night text-white shadow-lg">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2.5 sm:gap-5">
        {/* Logo */}
        <Link href="/" className="flex shrink-0 items-baseline gap-0.5">
          <span className="text-xl font-extrabold tracking-tight">Lux</span>
          <span className="text-xl font-extrabold tracking-tight text-gold">
            mart
          </span>
        </Link>

        {/* Deliver to */}
        <div className="hidden items-center gap-1 text-xs text-zinc-300 lg:flex">
          <MapPin size={16} className="text-gold" />
          <div className="leading-tight">
            <p className="text-[11px] text-zinc-400">Deliver to</p>
            <p className="font-semibold text-white">Your City</p>
          </div>
        </div>

        {/* Search wrapped inside Suspense for Next.js searchParams compliance */}
        <Suspense fallback={<div className="flex-1 bg-white/10 h-9 rounded-full animate-pulse" />}>
          <HeaderSearchInput />
        </Suspense>

        {/* Account */}
        <div className="hidden text-xs leading-tight sm:block">
          <p className="text-[11px] text-zinc-400">Hello, sign in</p>
          <p className="font-semibold">Account &amp; Lists</p>
        </div>

        {/* Cart */}
        <Link
          href="/cart"
          className="relative flex items-center gap-1.5 rounded-lg px-2 py-1 transition hover:bg-white/10"
        >
          <span className="relative">
            <ShoppingCart size={26} strokeWidth={1.6} />
            <span 
              suppressHydrationWarning
              className="absolute -right-2 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-gold px-1 text-xs font-bold text-ink"
            >
              {isMounted && hydrated ? count : 0}
            </span>
          </span>
          <span className="hidden text-sm font-semibold sm:inline">Cart</span>
        </Link>
      </div>

      {/* Sub-nav */}
      <div className="bg-night-700">
        <div className="mx-auto flex max-w-7xl items-center gap-5 overflow-x-auto px-4 py-1.5 text-sm text-zinc-200">
          <Link href="/" className="font-semibold hover:text-gold">
            All
          </Link>
          {["Today's Deals", "Electronics", "Home", "Fashion", "Gifts", "Sell"].map(
            (item) => (
              <Link
                key={item}
                href="/"
                className="whitespace-nowrap hover:text-gold"
              >
                {item}
              </Link>
            ),
          )}
        </div>
      </div>
    </header>
  );
}