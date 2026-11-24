import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import AppDataSource from "../utils/database.utils";
import type { ProductInput } from "../types/product.types";
import { parseId } from "../utils/number.utils";
import CartItem from "./cart-item.model";

function productRepository() {
  return AppDataSource.getRepository(Product);
}

@Entity({ name: "products" })
class Product {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", length: 255 })
  title!: string;

  @Column({ type: "double" })
  price!: number;

  @Column({ type: "text" })
  description!: string;

  // null until an image is uploaded. Only the upload endpoint sets it.
  @Column({ type: "varchar", length: 255, nullable: true })
  imageUrl!: string | null;

  @Column({ type: "boolean" })
  isPublished!: boolean;

  @OneToMany(() => CartItem, (item) => item.product)
  cartItems!: CartItem[];

  constructor(productData?: ProductInput) {
    if (!productData) return;
    this.title = productData.title;
    this.price = productData.price;
    this.description = productData.description;
    this.imageUrl = null;
    this.isPublished = productData.isPublished;
  }

  async save(): Promise<Product> {
    return productRepository().save(this);
  }

  static async update(
    id: number,
    productData: ProductInput,
  ): Promise<Product | undefined> {
    const product = await productRepository().findOneBy({ id });
    if (!product) {
      return undefined;
    }

    product.title = productData.title;
    product.price = productData.price;
    product.description = productData.description;
    product.isPublished = productData.isPublished;

    return productRepository().save(product);
  }

  /**
   * Saves a new image URL on the product. undefined = product not found.
   * Also returns the old URL, so the caller can delete the old file.
   */
  static async setImageUrl(
    id: number,
    imageUrl: string,
  ): Promise<{ product: Product; oldImageUrl: string | null } | undefined> {
    const product = await productRepository().findOneBy({ id });
    if (!product) {
      return undefined;
    }
    const oldImageUrl = product.imageUrl;
    product.imageUrl = imageUrl;
    return { product: await productRepository().save(product), oldImageUrl };
  }

  /** Deletes the product. Returns the deleted product (to clean up its image), or undefined if not found. */
  static async delete(id: number): Promise<Product | undefined> {
    const product = await productRepository().findOneBy({ id });
    if (!product) {
      return undefined;
    }
    return productRepository().remove(product);
  }

  static async fetchProducts(): Promise<Product[]> {
    return productRepository().find();
  }

  static async fetchProductById(id: unknown): Promise<Product | undefined> {
    const parsedId = parseId(id);
    if (parsedId === null) {
      return undefined;
    }
    return (await productRepository().findOneBy({ id: parsedId })) ?? undefined;
  }

  static async fetchPublished(): Promise<Product[]> {
    return productRepository().find({ where: { isPublished: true } });
  }

  static async fetchPublishedById(id: unknown): Promise<Product | undefined> {
    const parsedId = parseId(id);
    if (parsedId === null) {
      return undefined;
    }
    return (
      (await productRepository().findOneBy({
        id: parsedId,
        isPublished: true,
      })) ?? undefined
    );
  }
}

export default Product;
