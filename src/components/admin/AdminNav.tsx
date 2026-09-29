"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/admin", label: "Overzicht" },
  { href: "/admin/producten", label: "Shirts" },
  { href: "/admin/bestellingen", label: "Bestellingen" },
  { href: "/admin/instellingen", label: "Instellingen" },
];

export function AdminNav() {
  const path = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto text-sm">
      {items.map((i) => {
        const active = i.href === "/admin" ? path === "/admin" : path.startsWith(i.href);
        return (
          <Link key={i.href} href={i.href} className={`whitespace-nowrap rounded-full px-3 py-1.5 font-medium ${active ? "bg-ink text-white" : "text-zinc-600 hover:bg-zinc-100"}`}>
            {i.label}
          </Link>
        );
      })}
    </nav>
  );
}
