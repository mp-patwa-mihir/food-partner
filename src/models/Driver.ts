import mongoose, { Document, Model, Schema } from "mongoose";

export interface IDriver extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  phone: string;
  vehicleType: string;
  availability: boolean;
  currentOrder: mongoose.Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const DriverSchema = new Schema<IDriver>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
    },
    vehicleType: {
      type: String,
      required: [true, "Vehicle type is required"],
      trim: true,
    },
    availability: {
      type: Boolean,
      default: true,
    },
    currentOrder: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Driver: Model<IDriver> =
  mongoose.models.Driver ?? mongoose.model<IDriver>("Driver", DriverSchema);

export default Driver;
