import { z } from "zod";

// ─── Order Schema ──────────────────────────────────────────────────────────

export const placeOrderSchema = z.object({
  restaurantId: z.string().min(1, "Restaurant is required"),
  items: z
    .array(
      z.object({
        foodItemId: z.string(),
        quantity: z.number().min(1),
      })
    )
    .min(1, "At least one item is required"),
  deliveryAddress: z.object({
    street: z.string().min(1, "Street is required"),
    city: z.string().min(1, "City is required"),
    pincode: z.string().regex(/^\d{6}$/, "Invalid pincode"),
  }),
  paymentMethod: z.enum(["cod", "online"]),
});

export type PlaceOrderInput = z.infer<typeof placeOrderSchema>;
