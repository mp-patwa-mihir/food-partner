import mongoose, { Document, Model, Schema } from "mongoose";

export type OrderStatus =
  | "PENDING"
  | "ACCEPTED"
  | "REJECTED"
  | "PREPARING"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED";

export interface IOrderItem {
  menuItemId: mongoose.Types.ObjectId;
  name: string;
  price: number;
  quantity: number;
}

export interface IOrder extends Document {
  user: mongoose.Types.ObjectId;
  restaurant: mongoose.Types.ObjectId;
  items: IOrderItem[];
  totalAmount: number;
  status: OrderStatus;
  deliveryAddress: {
    street: string;
    city: string;
    pincode: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>(
  {
    menuItemId: { type: Schema.Types.ObjectId, ref: "MenuItem", required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
  },
  { _id: false }
);

const OrderSchema = new Schema<IOrder>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    restaurant: { type: Schema.Types.ObjectId, ref: "Restaurant", required: true, index: true },
    items: [OrderItemSchema],
    totalAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: [
        "PENDING",
        "ACCEPTED",
        "REJECTED",
        "PREPARING",
        "OUT_FOR_DELIVERY",
        "DELIVERED",
        "CANCELLED",
      ],
      default: "PENDING",
    },
    deliveryAddress: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      pincode: { type: String, required: true },
    },
  },
  { timestamps: true }
);

// Immutability Hook: Enforce that only the status field can be updated
OrderSchema.pre("save", function () {
  if (!this.isNew) {
    const modifiedPaths = this.modifiedPaths();
    
    // If anything other than 'status' (or 'updatedAt') is modified, throw an error
    const illegalModifications = modifiedPaths.filter(
      (path) => path !== "status" && path !== "updatedAt"
    );

    if (illegalModifications.length > 0) {
      throw new Error(
        `Order is immutable. Illegal modifications attempted on fields: ${illegalModifications.join(
          ", "
        )}`
      );
    }
  }
});

// We also need to prevent updates via queries like findOneAndUpdate, updateOne, etc.
const immutableUpdateHook = function (this: any, next: (err?: mongoose.CallbackError) => void) {
  const update = this.getUpdate();
  if (!update) return next();

  const allowedUpdates = ["status", "updatedAt"];
  const updateKeys = Object.keys(update.$set || {}).concat(Object.keys(update));

  // Remove MongoDB operators like $set from our check
  const filteredKeys = updateKeys.filter((key) => !key.startsWith("$"));

  const hasIllegalUpdate = filteredKeys.some((key) => !allowedUpdates.includes(key));
  
  if (update.$set) {
      const setKeys = Object.keys(update.$set);
      const hasIllegalSet = setKeys.some((key) => !allowedUpdates.includes(key));
      if (hasIllegalSet) {
          return next(new Error("Order is immutable. Only status updates are allowed."));
      }
  }

  if (hasIllegalUpdate) {
    return next(new Error("Order is immutable. Only status updates are allowed."));
  }

  next();
};

(OrderSchema as any).pre("findOneAndUpdate", immutableUpdateHook);
(OrderSchema as any).pre("updateOne", immutableUpdateHook);
(OrderSchema as any).pre("updateMany", immutableUpdateHook);

const Order: Model<IOrder> =
  mongoose.models.Order ?? mongoose.model<IOrder>("Order", OrderSchema);

export default Order;
