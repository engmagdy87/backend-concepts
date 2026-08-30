import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";
import AppDataSource from "../utils/database.utils";
import type { ProductInput } from "../types/product.types";
import { isPositiveInteger } from "../utils/number.utils";

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

  @Column({ type: "varchar", length: 255 })
  imageUrl!: string;

  @Column({ type: "boolean" })
  isPublished!: boolean;

  constructor(productData?: ProductInput) {
    if (!productData) return;
    this.title = productData.title;
    this.price = productData.price;
    this.description = productData.description;
    this.imageUrl = productData.imageUrl;
    this.isPublished = productData.isPublished;
  }

  async save(): Promise<Product> {
    return productRepository().save(this);
  }

  /** Accepts a number or numeric string (e.g. URL param `"3"`). */
  static parseId(value: unknown): number | null {
    if (isPositiveInteger(value)) {
      return value;
    }
    if (typeof value === "string" && /^\d+$/.test(value.trim())) {
      const id = Number(value.trim());
      return id > 0 ? id : null;
    }
    return null;
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
    product.imageUrl = productData.imageUrl;
    product.isPublished = productData.isPublished;

    return productRepository().save(product);
  }

  static async delete(id: number): Promise<boolean> {
    const product = await productRepository().findOneBy({ id });
    if (!product) {
      return false;
    }
    await productRepository().remove(product);
    return true;
  }

  static async fetchProducts(): Promise<Product[]> {
    return productRepository().find();
  }

  static async fetchProductById(id: unknown): Promise<Product | undefined> {
    const parsedId = Product.parseId(id);
    if (parsedId === null) {
      return undefined;
    }
    return (await productRepository().findOneBy({ id: parsedId })) ?? undefined;
  }

  static async fetchPublished(): Promise<Product[]> {
    return productRepository().find({ where: { isPublished: true } });
  }

  static async fetchPublishedById(id: unknown): Promise<Product | undefined> {
    const parsedId = Product.parseId(id);
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
