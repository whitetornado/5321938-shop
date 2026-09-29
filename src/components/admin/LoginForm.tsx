"use client";
import { useActionState } from "react";
import { login } from "@/app/admin/actions";

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(login, {});
  return (
    <form action={action} className="mt-6 space-y-4">
      <input type="hidden" name="next" value={next} />
      <div>
        <label className="label" htmlFor="password">Wachtwoord</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required autoFocus className="input" />
      </div>
      {state?.error && <p className="text-sm font-medium text-red-600">{state.error}</p>}
      <button disabled={pending} className="btn-dark w-full">{pending ? "Bezig…" : "Inloggen"}</button>
    </form>
  );
}
