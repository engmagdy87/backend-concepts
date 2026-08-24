import fs from "fs";
import type { ProductInput, ProductRecord } from "../types/product.types";
import { getProductsFromFile, productsFilePath } from "../utils/product.utils";

const products: ProductRecord[] = getProductsFromFile();

class Product {
  title: string;
  price: number;
  description: string;
  imageUrl: string;
  isPublished: boolean;

  constructor(productData: ProductInput) {
    this.title = productData.title;
    this.price = productData.price;
    this.description = productData.description;
    this.imageUrl = productData.imageUrl;
    this.isPublished = productData.isPublished;
  }

  save(): ProductRecord {
    const newProduct: ProductRecord = { ...this, id: products.length + 1 };
    products.push(newProduct);
    fs.writeFileSync(productsFilePath, JSON.stringify(products));
    return newProduct;
  }

  static fetchProducts(): ProductRecord[] {
    return products;
  }

  static fetchProductById(id: string): ProductRecord | undefined {
    return products.find((product) => product.id === parseInt(id));
  }

  static fetchPublished(): ProductRecord[] {
    return products.filter((product) => product.isPublished);
  }

  static fetchPublishedById(id: string): ProductRecord | undefined {
    return products.find(
      (product) => product.isPublished && product.id === parseInt(id),
    );
  }
}

export default Product;
