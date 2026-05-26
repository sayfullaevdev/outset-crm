import { ORDER_STATUS_LABELS } from "@/lib/constants";
import type { OrderStatus } from "@/lib/types";
import { Badge } from "@/components/ui/badge";

const STATUS_VARIANTS: Record<OrderStatus, "muted" | "warning" | "default" | "secondary" | "success"> = {
  awaiting_prepayment: "warning",
  prepayment_received: "default",
  ordered: "secondary",
  in_transit: "secondary",
  arrived: "success",
  completed: "success",
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return <Badge variant={STATUS_VARIANTS[status]}>{ORDER_STATUS_LABELS[status]}</Badge>;
}
