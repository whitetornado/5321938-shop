import { LoginForm } from "@/components/admin/LoginForm";
import { site } from "@/lib/config";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <div className="flex min-h-dvh items-center justify-center px-4">
      <div className="card w-full max-w-sm p-8">
        <div className="flex items-center gap-2">
          <span className="font-display text-2xl font-extrabold">{site.name}</span>
          <span className="size-2.5 rounded-full bg-brand" />
        </div>
        <p className="mt-1 text-sm text-zinc-500">Beheer</p>
        <LoginForm next={next ?? "/admin"} />
      </div>
    </div>
  );
}
