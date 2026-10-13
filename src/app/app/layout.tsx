import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/(auth)/actions";
import Image from "next/image";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return <div className="min-h-screen"><header className="border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3"><Image alt="GRIND" className="h-auto w-24" height={60} src="/grind-logo.png" width={102} /><form action={signOut}><button className="rounded border border-slate-500 px-3 py-1.5 text-sm font-medium text-slate-200 hover:border-red-600 hover:text-red-300" type="submit">Sign out</button></form></div></header>{children}</div>;
}
