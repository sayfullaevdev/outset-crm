import type { OrderStatus } from "@/lib/types";

type OrderFlags = {
  prepaymentReceived: boolean;
  orderedOnPinduoduo: boolean;
  inTransit: boolean;
  arrived: boolean;
  finalPaymentReceived: boolean;
};

export function deriveOrderStatus(flags: OrderFlags): OrderStatus {
  if (flags.finalPaymentReceived) {
    return "completed";
  }

  if (flags.arrived) {
    return "arrived";
  }

  if (flags.inTransit) {
    return "in_transit";
  }

  if (flags.orderedOnPinduoduo) {
    return "ordered";
  }

  if (flags.prepaymentReceived) {
    return "prepayment_received";
  }

  return "awaiting_prepayment";
}
