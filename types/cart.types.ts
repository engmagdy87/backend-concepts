export interface CartItem {
  id: number;
  cartId: number;
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

/** Who a cart belongs to: a logged-in user, or a guest identified by the `guestCart` cookie. */
export type CartOwner = { userId: number } | { guestToken: string };
