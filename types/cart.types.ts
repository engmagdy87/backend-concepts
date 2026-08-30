export interface CartItem {
  id: number;
  productId: number;
  quantity: number;
}

export interface AddToCartBody {
  productId: number;
}

export interface RemoveFromCartBody {
  productId: number;
}

export type AddToCartResult =
  | { ok: true; cart: CartItem[] }
  | { ok: false; reason: "not_found" };
