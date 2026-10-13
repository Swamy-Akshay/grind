"use client";

import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { useActionState, useState } from "react";
import type { AuthFormState } from "@/app/(auth)/actions";

type AuthFormProps = {
  action: (state: AuthFormState, formData: FormData) => Promise<AuthFormState>;
  mode: "sign-in" | "sign-up";
};

const initialState: AuthFormState = {};

export function AuthForm({ action, mode }: AuthFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const [showPassword, setShowPassword] = useState(false);
  const isSignIn = mode === "sign-in";

  return (
    <form action={formAction} className="mt-8 space-y-5" noValidate>
      <label className="block text-sm font-medium text-slate-800">
        Email
        <input autoComplete="email" className="mt-1.5 block w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-slate-950 outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200" name="email" required type="email" />
      </label>
      <label className="block text-sm font-medium text-slate-800">
        Password
        <span className="relative mt-1.5 block">
          <input autoComplete={isSignIn ? "current-password" : "new-password"} className="block w-full rounded-md border border-slate-300 bg-white py-2.5 pl-3 pr-11 text-slate-950 outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200" minLength={8} name="password" required type={showPassword ? "text" : "password"} />
          <button aria-label={showPassword ? "Hide password" : "Show password"} className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-600 hover:text-slate-950" onClick={() => setShowPassword((visible) => !visible)} type="button">
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </span>
      </label>
      {state.error ? <p aria-live="polite" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p> : null}
      {state.message ? <p aria-live="polite" className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{state.message}</p> : null}
      <button className="w-full rounded-md bg-slate-950 px-4 py-2.5 font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-400" disabled={pending} type="submit">
        {pending ? "Please wait…" : isSignIn ? "Sign in" : "Create account"}
      </button>
      <p className="text-center text-sm text-slate-600">
        {isSignIn ? "New here?" : "Already have an account?"}{" "}
        <Link className="font-medium text-slate-950 underline" href={isSignIn ? "/signup" : "/login"}>{isSignIn ? "Create an account" : "Sign in"}</Link>
      </p>
    </form>
  );
}
