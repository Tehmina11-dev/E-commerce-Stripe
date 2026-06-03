import Link from "next/link";

const columns = [
  { title: "Get to Know Us", links: ["About Luxmart", "Careers", "Press", "Sustainability"] },
  { title: "Make Money with Us", links: ["Sell products", "Become an affiliate", "Advertise", "Partner program"] },
  { title: "Payment Products", links: ["Luxmart Card", "Shop with Points", "Reload balance", "Gift cards"] },
  { title: "Let Us Help You", links: ["Your account", "Track orders", "Shipping rates", "Returns & refunds"] },
];

export function Footer() {
  return (
    <footer className="mt-16 bg-night text-zinc-300">
      <Link
        href="#top"
        className="block bg-night-600 py-3 text-center text-sm font-medium text-white transition hover:bg-night-700"
      >
        Back to top
      </Link>

      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-6 py-12 md:grid-cols-4">
        {columns.map((col) => (
          <div key={col.title}>
            <h4 className="mb-3 text-sm font-bold text-white">{col.title}</h4>
            <ul className="space-y-2 text-sm">
              {col.links.map((link) => (
                <li key={link}>
                  <Link href="/" className="text-zinc-400 transition hover:text-gold">
                    {link}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-white/10 py-6 text-center text-xs text-zinc-500">
        <p className="flex items-center justify-center gap-1">
          <span className="text-base font-extrabold tracking-tight text-white">
            Lux<span className="text-gold">mart</span>
          </span>
        </p>
        <p className="mt-2">
          © {new Date().getFullYear()} Luxmart — a demo storefront for a NestJS + Stripe backend.
        </p>
      </div>
    </footer>
  );
}
