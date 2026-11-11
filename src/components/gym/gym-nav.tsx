"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [{ href: "/daily", label: "Daily" }, { href: "/gym", label: "Today" }, { href: "/gym/routines", label: "Routines" }, { href: "/gym/history", label: "History" }, { href: "/gym/progress", label: "Progress" }];

export function GymNav() {
  const path = usePathname();
  return <nav aria-label="Gym tracker" className="mt-6 border-y border-zinc-800"><div className="flex min-h-12 items-center gap-6 overflow-x-auto px-1">{items.map((item) => { const active = path === item.href || (item.href !== "/gym" && path.startsWith(`${item.href}/`)); return <Link className={`whitespace-nowrap border-b-2 py-3 text-sm font-semibold ${active ? "border-orange-400 text-white" : "border-transparent text-zinc-400 hover:border-zinc-600 hover:text-zinc-100"}`} href={item.href} key={item.href}>{item.label}</Link>; })}</div></nav>;
}
