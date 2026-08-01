import Link from "next/link";
import Mark from "./ui/Mark";

const DEMO_BARS = [30, 56, 88, 44, 72, 36, 60, 26, 50, 80, 40, 64];

const STEPS = [
  {
    number: "01",
    title: "Drop the document",
    body: "One PDF or several. We read the text, not a summary of a summary.",
  },
  {
    number: "02",
    title: "Check the script",
    body: "Fix a name, cut the fluff, reorder a line — then make the audio.",
  },
  {
    number: "03",
    title: "Listen anywhere",
    body: "Lock-screen controls, offline download, headphone buttons. Screen off.",
  },
];

export default function Landing() {
  return (
    <div className="min-h-dvh bg-paper">
      <header className="mx-auto flex max-w-[1240px] items-center gap-2.5 px-5 py-5 lg:px-[60px]">
        <Mark size={30} />
        <span className="font-display text-[21px] leading-none text-ink">
          Earshot
        </span>
        <nav className="ml-auto flex items-center gap-5" aria-label="Main">
          <a
            href="#how-it-works"
            className="hidden text-[13px] font-medium text-ink-3 transition-colors hover:text-ink sm:block"
          >
            How it works
          </a>
          <Link
            href="/signin"
            className="text-[13px] font-medium text-ink-3 transition-colors hover:text-ink"
          >
            Sign in
          </Link>
          <Link
            href="/signin"
            className="inline-flex items-center justify-center rounded-full border border-ink px-5 py-[10px] text-[14px] font-medium text-ink transition-colors hover:bg-ink hover:text-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal"
          >
            Start free
          </Link>
        </nav>
      </header>

      <section className="mx-auto grid max-w-[1240px] items-center gap-10 px-5 pt-6 pb-14 lg:grid-cols-[1.05fr_.95fr] lg:gap-14 lg:px-[60px] lg:pt-10 lg:pb-[60px]">
        <div>
          <span className="inline-block rounded-full bg-signal-tint px-3 py-1.5 font-mono text-[11px] tracking-[.06em] text-signal-ink">
            5 FREE EPISODES · NO CARD
          </span>
          <h1 className="mt-5 font-display text-[38px] leading-[1.04] tracking-[-.015em] text-ink lg:text-[62px] lg:leading-[1.02] lg:tracking-[-.02em]">
            The reading pile you&apos;ll actually get through.
          </h1>
          <p className="mt-5 max-w-[460px] text-[17px] leading-[1.55] text-ink-2">
            Drop in a PDF — a paper, a board deck, a chapter — and get a real
            episode: two hosts, one narrator, or your document read word for
            word. Plays with the screen off.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-5">
            <Link
              href="/signin"
              className="inline-flex min-h-[52px] items-center justify-center rounded-full bg-signal px-7 py-[15px] text-[15px] font-medium text-white shadow-[0_2px_8px_rgba(232,72,31,.28)] transition-colors hover:bg-signal-press focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal"
            >
              Start free
            </Link>
            <span className="text-[12px] text-ink-4 sm:hidden">
              5 episodes free · no card
            </span>
          </div>
          <ul className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-ink-3">
            <li>✓ Lock-screen &amp; offline</li>
            <li>✓ Editable scripts</li>
            <li>✓ Word-for-word mode</li>
          </ul>
        </div>

        <div className="rounded-[24px] bg-dark p-[30px]">
          <p className="font-mono text-[10px] font-medium uppercase tracking-[.09em] text-dark-3xt">
            Made from a 15-page PDF
          </p>
          <p className="mt-2 font-display text-[26px] leading-[1.1] text-dark-text">
            Attention Is All You Need
          </p>
          <div
            className="mt-6 flex h-[110px] items-end gap-[6px]"
            aria-hidden="true"
          >
            {DEMO_BARS.map((height, index) => (
              <span
                key={index}
                className={`flex-1 rounded-[4px] ${
                  index === 2 || index === 3 ? "bg-signal" : "bg-dark-3"
                }`}
                style={{ height: `${height}%` }}
              />
            ))}
          </div>
          <div className="mt-6 flex items-center gap-4">
            <Link
              href="/signin"
              aria-label="Start free to make episodes like this"
              className="flex size-[52px] shrink-0 items-center justify-center rounded-full bg-signal transition-colors hover:bg-signal-press focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal"
            >
              <svg
                viewBox="0 0 16 16"
                className="size-[18px] translate-x-[1px] fill-white"
                aria-hidden="true"
              >
                <path d="M4.5 2.7c0-.9 1-1.5 1.8-1L13 6.9c.8.5.8 1.7 0 2.2l-6.7 5.2c-.8.5-1.8-.1-1.8-1V2.7z" />
              </svg>
            </Link>
            <div className="h-[3px] flex-1 rounded-full bg-dark-3" />
            <span className="font-mono text-[11px] tabular-nums text-dark-3xt">
              11:52
            </span>
          </div>
          <div className="mt-6 border-t border-dark-3 pt-5">
            <p className="text-[13px] leading-[1.6] text-dark-2xt">
              <span className="mr-2 font-mono text-[11px] uppercase tracking-[.05em] text-signal">
                Kore
              </span>
              So this paper threw out recurrence entirely — and that turned out
              to be the whole trick.
            </p>
          </div>
        </div>
      </section>

      <section
        id="how-it-works"
        className="border-t border-line bg-[#EFEBE4]"
      >
        <div className="mx-auto grid max-w-[1240px] gap-[30px] px-5 py-11 sm:grid-cols-3 lg:px-[60px]">
          {STEPS.map((step) => (
            <div key={step.number}>
              <p className="font-mono text-[15px] text-signal">{step.number}</p>
              <h3 className="mt-2 font-display text-[22px] leading-[1.15] text-ink">
                {step.title}
              </h3>
              <p className="mt-1.5 text-[13px] leading-[1.55] text-ink-3">
                {step.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <footer className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-2 px-5 py-8 lg:px-[60px]">
        <p className="text-[12px] text-ink-4">
          Earshot · Documents, out loud.
        </p>
        <Link
          href="/legal"
          className="text-[12px] text-ink-4 transition-colors hover:text-ink"
        >
          Privacy &amp; Terms
        </Link>
      </footer>
    </div>
  );
}
