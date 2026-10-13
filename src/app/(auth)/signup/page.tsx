import { AuthForm } from "@/components/auth/auth-form";
import { signUp } from "../actions";

export default function SignupPage() {
  return <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-12"><p className="text-sm font-semibold tracking-[0.2em] text-orange-500">GRIND</p><h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">Create your account</h1><p className="mt-2 text-slate-600">Begin with a truthful record of the work you do.</p><AuthForm action={signUp} mode="sign-up" /></main>;
}
