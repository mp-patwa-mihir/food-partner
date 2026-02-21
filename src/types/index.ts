// ─── Global App Types ──────────────────────────────────────────────────────

export type Role = "user" | "admin" | "partner";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
}

// ─── API Response Wrapper ──────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string[]>;
}

// ─── Pagination ────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── Food & Restaurant ─────────────────────────────────────────────────────

export interface FoodItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  isVeg: boolean;
  isAvailable: boolean;
  restaurantId: string;
}

export interface Restaurant {
  id: string;
  name: string;
  description: string;
  image: string;
  cuisine: string[];
  rating: number;
  deliveryTime: number;
  minimumOrder: number;
  isOpen: boolean;
}

// ─── Cart ──────────────────────────────────────────────────────────────────

export interface CartItem extends FoodItem {
  quantity: number;
}
