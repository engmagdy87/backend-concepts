import express from "express";
import {
  fetchShoppingProducts,
  fetchShoppingProductById,
} from "../controllers/products.controller";

const router = express.Router();

router.get("/products", fetchShoppingProducts);

router.get("/product/:id", fetchShoppingProductById);

export default router;
