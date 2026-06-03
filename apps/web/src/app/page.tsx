import Link from "next/link";
import { PackageSearch } from "lucide-react";
import { getProducts } from "@/lib/api";
import { Hero } from "@/components/layout/Hero";
import { ProductGrid } from "@/components/product/ProductGrid";

export const dynamic = "force-dynamic";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const products = await getProducts();

  const query = q?.trim().toLowerCase() ?? "";
  const filtered = query
    ? products.filter((p) =>
        `${p.name} ${p.description ?? ""}`.toLowerCase().includes(query),
      )
    : products;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      {!query && <Hero />}

      <section id="catalog" className="scroll-mt-28 pt-10">
        <div className="mb-5 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-ink">
              {query ? `Results for “${q}”` : "Featured for you"}
            </h2>
            <p className="text-sm text-zinc-500">
              {filtered.length} {filtered.length === 1 ? "item" : "items"}
            </p>
          </div>
          {query && (
            <Link
              href="/"
              className="text-sm font-semibold text-gold-700 hover:underline"
            >
              Clear search
            </Link>
          )}
        </div>

        {filtered.length > 0 ? (
          <ProductGrid products={filtered} />
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-white py-20 text-center">
            <PackageSearch size={40} className="text-zinc-400" />
            <h3 className="mt-4 text-lg font-semibold text-ink">
              {query ? "No matching products" : "No products available yet"}
            </h3>
            <p className="mt-1 max-w-md text-sm text-zinc-500">
              {query
                ? "Try a different search term."
                : "Make sure the NestJS backend is running on :3000 and has been seeded (npm run prisma:seed)."}
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
