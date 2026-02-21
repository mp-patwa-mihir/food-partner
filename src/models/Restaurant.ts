import mongoose, { Document, Model, Schema } from "mongoose";

export interface IRestaurant extends Document {
  name: string;
  owner: mongoose.Types.ObjectId;
  description: string;
  image: string;
  cuisine: string[];
  rating: number;
  totalRatings: number;
  deliveryTime: number; // in minutes
  minimumOrder: number;
  isOpen: boolean;
  address: {
    street: string;
    city: string;
    pincode: string;
    coordinates?: { lat: number; lng: number };
  };
  createdAt: Date;
  updatedAt: Date;
}

const RestaurantSchema = new Schema<IRestaurant>(
  {
    name: { type: String, required: true, trim: true },
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
    description: { type: String },
    image: { type: String },
    cuisine: [{ type: String }],
    rating: { type: Number, default: 0, min: 0, max: 5 },
    totalRatings: { type: Number, default: 0 },
    deliveryTime: { type: Number, default: 30 },
    minimumOrder: { type: Number, default: 0 },
    isOpen: { type: Boolean, default: true },
    address: {
      street: String,
      city: String,
      pincode: String,
      coordinates: { lat: Number, lng: Number },
    },
  },
  { timestamps: true }
);

const Restaurant: Model<IRestaurant> =
  mongoose.models.Restaurant ??
  mongoose.model<IRestaurant>("Restaurant", RestaurantSchema);

export default Restaurant;
