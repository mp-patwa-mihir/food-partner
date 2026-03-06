export const ORDER_STATUSES = [
  "PENDING",
  "ACCEPTED",
  "REJECTED",
  "PREPARING",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];
