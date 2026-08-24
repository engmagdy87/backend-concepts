import express from "express";
import {
  addProduct,
  updateProduct,
  deleteProduct,
  fetchProducts,
  fetchProductById,
} from "../controllers/products.controller";

const router = express.Router();

router.get("/products", fetchProducts);
router.get("/products/:id", fetchProductById);
router.patch("/products/:id", updateProduct);
router.post("/add-product", addProduct);
router.post("/delete-product", deleteProduct);

export default router;
