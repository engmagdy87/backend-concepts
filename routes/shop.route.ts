import express from "express";
import {
  fetchShoppingProducts,
  fetchShoppingProductById,
} from "../controllers/products.controller";
import { validateIdParam } from "../middlewares/validate.middleware";

const router = express.Router();

router.get("/products", fetchShoppingProducts);
router.get("/products/:id", validateIdParam, fetchShoppingProductById);

export default router;
