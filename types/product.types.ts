export interface ProductInput {
  title: string;
  price: number;
  description: string;
  imageUrl: string;
  isPublished: boolean;
}

/** Clients may send a number or a numeric string. */
export type ProductIdInput = number | string;

export interface DeleteProductBody {
  id: ProductIdInput;
}
