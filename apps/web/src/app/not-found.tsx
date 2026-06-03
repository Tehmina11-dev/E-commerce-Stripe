import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <p className="text-6xl font-extrabold tracking-tight text-gold">404</p>
      <h1 className="mt-3 text-2xl font-bold text-ink">Page not found</h1>
      <p className="mt-2 text-sm text-zinc-500">
        The product or page you&apos;re looking for doesn&apos;t exist.
      </p>
      <Link
        href="/"
        className="mt-6 inline-block rounded-full bg-gold px-6 py-2.5 text-sm font-bold text-ink transition hover:bg-gold-600"
      >
        Back to home
      </Link>
    </div>
  );
}
