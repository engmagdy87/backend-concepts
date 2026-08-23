import fs from "fs";
import path from "path";
import { Request, Response } from "express";

interface ProductInput {
  title: string;
  price: number;
  description: string;
  imageUrl: string;
  isPublished: boolean;
}

interface ProductRecord extends ProductInput {
  id: number;
}

const productsFilePath = path.join(__dirname, "../data/products.json");

function getProductsFromFile(): ProductRecord[] {
  if (!fs.existsSync(productsFilePath)) {
    return [];
  }
  const fileContent = fs.readFileSync(productsFilePath, "utf8");
  return fileContent ? (JSON.parse(fileContent) as ProductRecord[]) : [];
}

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

  static fetchAll(): ProductRecord[] {
    return products;
  }

  static fetchProductById(id: string): ProductRecord | undefined {
    return products.find((product) => product.id === parseInt(id));
  }
}

export const addProduct = (
  req: Request<unknown, unknown, ProductInput>,
  res: Response,
) => {
  const product = new Product(req.body);
  const savedProduct = product.save();
  res.status(201).json({
    message: "Product added successfully",
    data: savedProduct,
  });
};

export const fetchAll = (_req: Request, res: Response) => {
  const products = Product.fetchAll();
  res.json({ data: products });
};

export const fetchProductById = (req: Request<{ id: string }>, res: Response) => {
  const product = Product.fetchProductById(req.params.id);
  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }
  res.json({ data: product });
};

const getShoppingProducts = (): ProductRecord[] => {
  return products.filter((product) => product.isPublished);
};

export const fetchShoppingProducts = (_req: Request, res: Response) => {
  const products = getShoppingProducts();
  res.json({ data: products });
};

export const fetchShoppingProductById = (
  req: Request<{ id: string }>,
  res: Response,
) => {
  const product = getShoppingProducts().find(
    (product) => product.id === parseInt(req.params.id),
  );
  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }
  res.json({ data: product });
};
