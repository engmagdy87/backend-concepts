import express from "express";
import {
  addProduct,
  updateProduct,
  deleteProduct,
  fetchProducts,
  fetchProductById,
} from "../controllers/products.controller";

const router = express.Router();

router.post("/add-product", addProduct);
router.post("/update-product", updateProduct);
router.post("/delete-product", deleteProduct);

router.get("/products", fetchProducts);

router.get("/products/:id", fetchProductById);

export default router;
