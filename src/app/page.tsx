import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center px-6 py-20 sm:px-10">
      <Image alt="GRIND" className="h-auto w-56" height={160} priority src="/grind-logo.png" width={272} />
      <p className="mt-8 text-sm font-semibold tracking-[0.2em] text-orange-500">EXECUTION SYSTEM</p>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
        Do the work. Track the proof.
      </h1>
      <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
        A private system for focused work, evidence, and truthful progress measurement.
      </p>
      <div className="mt-10 flex gap-3">
        <Link className="rounded-md bg-orange-600 px-4 py-2.5 font-semibold text-white hover:bg-orange-500" href="/login">
          Sign in →
        </Link>
        <Link className="rounded-md border border-slate-300 px-4 py-2.5 font-medium text-slate-900" href="/signup">
          Create account
        </Link>
      </div>
    </main>
  );
}
