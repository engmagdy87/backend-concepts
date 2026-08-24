export interface ProductInput {
  title: string;
  price: number;
  description: string;
  imageUrl: string;
  isPublished: boolean;
}

export interface ProductRecord extends ProductInput {
  id: number;
}
