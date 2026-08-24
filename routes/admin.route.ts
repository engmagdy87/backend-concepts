import express from "express";
import {
  addProduct,
  fetchProducts,
  fetchProductById,
} from "../controllers/products.controller";

const router = express.Router();

router.post("/add-product", addProduct);

router.get("/products", fetchProducts);

router.get("/products/:id", fetchProductById);

export default router;
