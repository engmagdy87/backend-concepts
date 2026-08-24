export interface CartItem {
  productId: number;
  quantity: number;
}

export interface AddToCartBody {
  productId: number;
  quantity: number;
}

export interface RemoveFromCartBody {
  productId: number;
}

export type AddToCartFailureReason = "not_found" | "invalid_quantity";

export type AddToCartResult =
  | { ok: true; cart: CartItem[] }
  | { ok: false; reason: AddToCartFailureReason };
