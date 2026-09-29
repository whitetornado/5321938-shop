"use client";
export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="text-2xl font-bold">Er ging iets mis</h1>
      <p className="mt-2 text-zinc-600">Probeer het opnieuw. Blijft het misgaan? Mail ons even.</p>
      <button onClick={reset} className="btn-dark mt-8">Opnieuw proberen</button>
    </div>
  );
}
