import Link from "next/link";

export default function PresentationsDebugPage() {
  return (
    <div className="flex h-full flex-col gap-3 p-4 pt-0">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Reveal Debug</h1>
        <Link
          className="text-sm underline underline-offset-4"
          href="/presentations/debug/raw"
          target="_blank"
          rel="noreferrer"
        >
          Open raw HTML
        </Link>
      </div>
      <div className="min-h-0 flex-1 overflow-hidden rounded-xl border bg-card">
        <iframe
          title="Reveal.js debug deck"
          src="/presentations/debug/raw"
          className="h-full w-full border-0"
        />
      </div>
    </div>
  );
}

