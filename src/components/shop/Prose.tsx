export function Prose({ title, intro, children }: { title: string; intro?: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <h1 className="font-display text-4xl font-extrabold uppercase sm:text-5xl">{title}</h1>
      {intro && <p className="mt-3 text-lg text-zinc-600">{intro}</p>}
      <div className="mt-8 space-y-4 text-[15px] leading-relaxed text-zinc-700 [&_a]:underline [&_h2]:mt-10 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-ink [&_li]:ml-5 [&_li]:list-disc [&_strong]:text-ink">
        {children}
      </div>
    </div>
  );
}
