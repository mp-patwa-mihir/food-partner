import mongoose, { Document, Model, Schema } from "mongoose";

// ─── Interface ──────────────────────────────────────────────────────────────

export interface IMenuItem extends Document {
  name: string;
  description?: string;
  price: number;
  image?: string;
  isVeg?: boolean;
  isAvailable: boolean;
  category: mongoose.Types.ObjectId;
  restaurant: mongoose.Types.ObjectId;
  stock: number | null;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Schema ─────────────────────────────────────────────────────────────────

const MenuItemSchema = new Schema<IMenuItem>(
  {
    name: {
      type: String,
      required: [true, "Item name is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    image: {
      type: String,
      trim: true,
    },
    isVeg: {
      type: Boolean,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: "MenuCategory",
      required: [true, "Category reference is required"],
      index: true, // Optimizes finding all items in a specific category
    },
    restaurant: {
      type: Schema.Types.ObjectId,
      ref: "Restaurant",
      required: [true, "Restaurant reference is required"],
      index: true, // Optimizes finding all items for a specific restaurant
    },
    stock: {
      type: Number,
      default: null, // null means unlimited stock
      min: [0, "Stock cannot be negative"],
    },
  },
  {
    timestamps: true, // Automatically manages createdAt and updatedAt
  }
);

// ─── Model (singleton) ──────────────────────────────────────────────────────

const MenuItem: Model<IMenuItem> =
  mongoose.models.MenuItem ?? mongoose.model<IMenuItem>("MenuItem", MenuItemSchema);

export default MenuItem;
