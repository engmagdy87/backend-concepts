import express from "express";
import {
  addProduct,
  fetchAll,
  fetchProductById,
} from "../controllers/products.controller";

const router = express.Router();

router.post("/add-product", addProduct);

router.get("/products", fetchAll);

router.get("/product/:id", fetchProductById);

export default router;
