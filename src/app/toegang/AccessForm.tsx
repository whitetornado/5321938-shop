"use client";
import { useActionState } from "react";
import { enterCode } from "./actions";

export function AccessForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(enterCode, {});
  return (
    <form action={action} className="mt-6 space-y-3">
      <input type="hidden" name="next" value={next} />
      <label className="label" htmlFor="code">Toegangscode</label>
      <input
        id="code"
        name="code"
        required
        autoFocus
        autoComplete="off"
        autoCapitalize="characters"
        spellCheck={false}
        placeholder="GHC-XXXXXX"
        className="input text-center font-mono text-lg tracking-widest uppercase"
      />
      {state?.error && <p className="text-sm font-medium text-red-600">{state.error}</p>}
      <button disabled={pending} className="btn-dark w-full">{pending ? "Controleren…" : "Naar de shop"}</button>
    </form>
  );
}
