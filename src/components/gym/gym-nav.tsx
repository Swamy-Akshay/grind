"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
const items = [{ href: "/gym", label: "Today" }, { href: "/gym/routines", label: "Routines" }, { href: "/gym/history", label: "History" }, { href: "/gym/progress", label: "Progress" }];
export function GymNav() { const path = usePathname(); return <nav className="mt-6 flex flex-wrap gap-2">{items.map((item) => <Link className={`rounded-md px-3 py-2 text-sm font-medium ${path === item.href ? "bg-zinc-600 text-zinc-50" : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"}`} href={item.href} key={item.href}>{item.label}</Link>)}</nav>; }
