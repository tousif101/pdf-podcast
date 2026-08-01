import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy & Terms — PDF Podcast",
};

export default function LegalPage() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-12 text-zinc-300">
      <a href="/" className="text-sm text-violet-400 hover:text-violet-300">
        ← Back
      </a>
      <h1 className="mt-6 text-2xl font-semibold text-zinc-50">
        Privacy &amp; Terms
      </h1>
      <p className="mt-2 text-sm text-zinc-500">Last updated: July 2026</p>

      <section className="mt-8 space-y-3 text-sm leading-relaxed">
        <h2 className="text-lg font-medium text-zinc-100">What we store</h2>
        <p>
          When you sign in we store your email address (via Supabase Auth). When
          you create an episode we store the uploaded PDF, the generated script,
          and the audio so you can play it back. You can delete any episode at
          any time, which removes its files.
        </p>

        <h2 className="pt-2 text-lg font-medium text-zinc-100">
          Third parties
        </h2>
        <p>
          Your document text is sent to AI providers (Google for speech, and an
          LLM for the script) solely to generate your episode. Payments, if you
          buy credits, are processed by Stripe — we never see your card details.
          We don&apos;t sell your data.
        </p>

        <h2 className="pt-2 text-lg font-medium text-zinc-100">
          Sharing &amp; feeds
        </h2>
        <p>
          Episodes are private by default. If you create a share link or a
          podcast feed, anyone with that URL can listen — treat those links as
          secret. Removing the share stops access.
        </p>

        <h2 className="pt-2 text-lg font-medium text-zinc-100">Terms</h2>
        <p>
          Use PDF Podcast only with documents you have the right to use. The
          service is provided as-is without warranty. Generated audio may
          contain errors — verify anything important against the source. Credits
          are non-refundable except where required by law.
        </p>

        <h2 className="pt-2 text-lg font-medium text-zinc-100">Contact</h2>
        <p>Questions? Reach out to the address on the account you signed up with.</p>
      </section>
    </main>
  );
}
