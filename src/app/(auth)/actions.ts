"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { credentialsSchema } from "@/lib/validation/auth";

export type AuthFormState = { error?: string; message?: string };

function getCredentials(formData: FormData) {
  return credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
}

export async function signIn(_: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const credentials = getCredentials(formData);
  if (!credentials.success) return { error: credentials.error.issues[0]?.message ?? "Enter valid credentials." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(credentials.data);
  if (error) return { error: "Unable to sign in with those credentials." };

  redirect("/daily");
}

export async function signUp(_: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const credentials = getCredentials(formData);
  if (!credentials.success) return { error: credentials.error.issues[0]?.message ?? "Enter valid credentials." };

  const origin = (await headers()).get("origin") ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    ...credentials.data,
    options: { emailRedirectTo: new URL("/auth/confirm", origin).toString() },
  });

  if (error) return { error: "Unable to create the account. Please try again." };
  return { message: "Check your email to confirm your account, then sign in." };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
