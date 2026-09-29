import { STATUS_LABEL, type OrderStatus } from "@/lib/types";

const COLORS: Record<OrderStatus, string> = {
  pending: "bg-zinc-100 text-zinc-600",
  paid: "bg-amber-100 text-amber-800",
  processing: "bg-blue-100 text-blue-800",
  shipped: "bg-violet-100 text-violet-800",
  delivered: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-zinc-200 text-zinc-600",
  refunded: "bg-zinc-200 text-zinc-600",
  expired: "bg-zinc-100 text-zinc-400",
  failed: "bg-red-100 text-red-700",
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${COLORS[status]}`}>{STATUS_LABEL[status]}</span>;
}
