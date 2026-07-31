"use client";

import SignIn from "./SignIn";

const FEATURES = [
  {
    title: "Listen anywhere",
    body: "Real lock-screen controls and background playback on your phone. Download for the commute, play with the screen off, control from your headphones.",
    icon: (
      <path d="M9 18V5l12-2v13M9 13l12-2M6 15a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm12-2a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" />
    ),
  },
  {
    title: "Your format, your voice",
    body: "A two-host discussion, a debate, a solo briefing, or a calm read-aloud of the full text. Pick the voices, length, and depth.",
    icon: <path d="M12 3v18M8 7v10M16 7v10M4 10v4M20 10v4" />,
  },
  {
    title: "Edit before it's made",
    body: "See the script first and fix a name, trim the fluff, or reword a line — then generate the audio. No other tool lets you do this on your phone.",
    icon: <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />,
  },
  {
    title: "No hallucinations",
    body: "Read-aloud speaks your document word-for-word — no AI making things up. Trust what you hear.",
    icon: <path d="m9 12 2 2 4-4M12 3l7 4v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V7l7-4Z" />,
  },
];

export default function Landing() {
  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex max-w-5xl items-center gap-3 px-5 py-5">
        <span
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/15 text-violet-400"
          aria-hidden="true"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            className="h-5 w-5"
          >
            <path d="M5 10v4m3.5-7v10M12 8v8m3.5-11v14M19 10v4" />
          </svg>
        </span>
        <span className="text-lg font-semibold tracking-tight text-zinc-50">
          PDF Podcast
        </span>
        <a
          href="#get-started"
          className="ml-auto rounded-lg bg-violet-500 px-4 py-2 text-sm font-medium text-white hover:bg-violet-400"
        >
          Get started
        </a>
      </header>

      <section className="mx-auto grid max-w-5xl items-center gap-10 px-5 pt-8 pb-16 md:grid-cols-2 md:pt-16">
        <div>
          <h1 className="text-4xl font-bold leading-tight tracking-tight text-zinc-50 sm:text-5xl">
            Turn anything you have to read into a podcast you can{" "}
            <span className="text-violet-400">actually listen to.</span>
          </h1>
          <p className="mt-5 text-lg text-zinc-400">
            Upload a PDF — a paper, a report, a chapter — and get a podcast
            episode you can play on your phone with the screen off, edit before
            it&apos;s made, and trust because it won&apos;t make things up.
          </p>
          <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-zinc-400">
            <li>✓ Lock-screen &amp; offline playback</li>
            <li>✓ Editable scripts</li>
            <li>✓ Multiple voices &amp; lengths</li>
          </ul>
          <div className="mt-8 md:hidden">
            <a
              href="#get-started"
              className="inline-block rounded-xl bg-violet-500 px-6 py-3 font-medium text-white hover:bg-violet-400"
            >
              Start free
            </a>
            <p className="mt-2 text-xs text-zinc-500">
              5 free episodes · no card required
            </p>
          </div>
        </div>

        <div id="get-started" className="mx-auto w-full max-w-sm scroll-mt-20">
          <SignIn />
          <p className="mt-3 text-center text-xs text-zinc-500">
            Best on Android Chrome — add to your home screen to install.
          </p>
        </div>
      </section>

      <section className="border-t border-zinc-900 bg-zinc-950/50">
        <div className="mx-auto grid max-w-5xl gap-4 px-5 py-14 sm:grid-cols-2">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5"
            >
              <span
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/15 text-violet-300"
                aria-hidden="true"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5"
                >
                  {f.icon}
                </svg>
              </span>
              <h3 className="mt-3 font-semibold text-zinc-100">{f.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-zinc-400">
                {f.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 py-16 text-center">
        <h2 className="text-2xl font-semibold text-zinc-50">
          Read less. Listen more.
        </h2>
        <p className="mx-auto mt-2 max-w-md text-zinc-400">
          Give it a PDF and take it on your walk. Your first five episodes are
          free.
        </p>
        <a
          href="#get-started"
          className="mt-6 inline-block rounded-xl bg-violet-500 px-6 py-3 font-medium text-white hover:bg-violet-400"
        >
          Get started free
        </a>
      </section>

      <footer className="border-t border-zinc-900 px-5 py-8 text-center text-xs text-zinc-600">
        PDF Podcast · Turn documents into audio you can listen to on the go.
      </footer>
    </div>
  );
}
