import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <p className="font-display text-8xl font-extrabold text-brand">404</p>
      <h1 className="mt-2 text-2xl font-bold">Deze pagina is buitenspel</h1>
      <p className="mt-2 text-zinc-600">Het shirt of de pagina die je zoekt bestaat niet (meer).</p>
      <Link href="/" className="btn-dark mt-8">Naar de shop</Link>
    </div>
  );
}
