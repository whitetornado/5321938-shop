"use client";
export function Switch({ checked, onChange, disabled, label }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition disabled:opacity-60 ${checked ? "bg-emerald-500" : "bg-zinc-300"}`}
    >
      <span className={`inline-block size-5 rounded-full bg-white shadow transition ${checked ? "translate-x-5.5" : "translate-x-0.5"}`} />
    </button>
  );
}
