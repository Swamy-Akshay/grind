import { AuthForm } from "@/components/auth/auth-form";
import { signIn } from "../actions";

export default function LoginPage() {
  return <AuthPage title="Welcome back" subtitle="Sign in to GRIND."><AuthForm action={signIn} mode="sign-in" /></AuthPage>;
}

function AuthPage({ children, subtitle, title }: { children: React.ReactNode; subtitle: string; title: string }) {
  return <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-12"><p className="text-sm font-semibold tracking-[0.2em] text-orange-500">GRIND</p><h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">{title}</h1><p className="mt-2 text-slate-600">{subtitle}</p>{children}</main>;
}
