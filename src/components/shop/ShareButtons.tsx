"use client";
import { Link2, Share2 } from "lucide-react";
import { toast } from "sonner";

export function ShareButtons({ url, title }: { url: string; title: string }) {
  const text = `${title} — bestel hem hier:`;
  const enc = encodeURIComponent;
  const links = [
    { name: "WhatsApp", href: `https://wa.me/?text=${enc(`${text} ${url}`)}`, bg: "#25D366" },
    { name: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`, bg: "#1877F2" },
    { name: "X", href: `https://x.com/intent/post?text=${enc(text)}&url=${enc(url)}`, bg: "#000000" },
  ];

  const native = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
      } catch {
        /* geannuleerd */
      }
    } else copy();
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link gekopieerd", { description: "Plak hem in je groepsapp 🙌" });
    } catch {
      toast.error("Kopiëren lukte niet");
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="mr-1 text-sm font-medium text-zinc-600">Deel met je clubgenoten:</span>
      <button onClick={native} className="inline-flex items-center gap-1.5 rounded-full border border-zinc-300 px-3 py-1.5 text-sm font-medium hover:border-ink sm:hidden">
        <Share2 className="size-4" /> Delen
      </button>
      {links.map((l) => (
        <a
          key={l.name}
          href={l.href}
          target="_blank"
          rel="noopener noreferrer"
          className={`${l.name === "WhatsApp" ? "inline-flex" : "hidden sm:inline-flex"} rounded-full px-3 py-1.5 text-sm font-semibold text-white transition hover:opacity-90`}
          style={{ background: l.bg }}
        >
          {l.name}
        </a>
      ))}
      <button onClick={copy} className="inline-flex items-center gap-1.5 rounded-full border border-zinc-300 px-3 py-1.5 text-sm font-medium hover:border-ink">
        <Link2 className="size-4" /> Kopieer link
      </button>
    </div>
  );
}
