export interface ProductInput {
  title: string;
  price: number;
  description: string;
  imageUrl: string;
  isPublished: boolean;
}

/** Positive integer stored on disk and in memory. */
export interface ProductRecord extends ProductInput {
  id: number;
}

/** Clients may send a number or a numeric string. */
export type ProductIdInput = number | string;

export interface EditProductBody extends ProductInput {
  id: ProductIdInput;
}

export interface DeleteProductBody {
  id: ProductIdInput;
}
