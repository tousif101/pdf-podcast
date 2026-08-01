import type { Metadata } from "next";
import Link from "next/link";
import SignIn from "@/components/SignIn";
import Mark from "@/components/ui/Mark";

export const metadata: Metadata = {
  title: "Sign in — Earshot",
};

export default function SignInPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-paper px-5">
      <header className="mx-auto flex w-full max-w-[1140px] items-center gap-2.5 py-5">
        <Link href="/" className="flex items-center gap-2.5">
          <Mark size={30} />
          <span className="font-display text-[21px] leading-none text-ink">
            Earshot
          </span>
        </Link>
      </header>
      <main className="flex flex-1 items-center justify-center pb-24">
        <SignIn />
      </main>
    </div>
  );
}
