"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [{ href: "/gym", label: "Today" }, { href: "/gym/routines", label: "Routines" }, { href: "/gym/history", label: "History" }, { href: "/gym/progress", label: "Progress" }];

export function GymNav({ rightSlot }: { rightSlot?: React.ReactNode }) {
  const path = usePathname();
  return <nav aria-label="Gym tracker" className="mt-6 border-y border-zinc-800"><div className="flex min-h-12 flex-wrap items-center justify-between gap-x-4"><div className="flex min-h-12 items-center gap-5 overflow-x-auto py-2"><Link className="rounded-md border border-blue-700 bg-blue-950 px-3 py-1.5 text-sm font-semibold text-blue-100 hover:bg-blue-900" href="/daily">Daily</Link>{items.map((item) => { const active = path === item.href || (item.href !== "/gym" && path.startsWith(`${item.href}/`)); return <Link className={`whitespace-nowrap border-b-2 py-3 text-sm font-semibold ${active ? "border-orange-400 text-white" : "border-transparent text-zinc-400 hover:border-zinc-600 hover:text-zinc-100"}`} href={item.href} key={item.href}>{item.label}</Link>; })}</div>{rightSlot ? <div className="ml-auto py-2">{rightSlot}</div> : null}</div></nav>;
}
