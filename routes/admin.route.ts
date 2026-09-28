import express from "express";
import {
  addProduct,
  updateProduct,
  deleteProduct,
  fetchProducts,
  fetchProductById,
} from "../controllers/products.controller";
import {
  addUser,
  updateUser,
  deleteUser,
  fetchUsers,
  fetchUserById,
} from "../controllers/users.controller";

const router = express.Router();

router.get("/products", fetchProducts);
router.get("/products/:id", fetchProductById);
router.put("/products/:id", updateProduct);
router.post("/add-product", addProduct);
router.post("/delete-product", deleteProduct);

router.post("/add-user", addUser);
router.put("/update-user/:id", updateUser);
router.delete("/delete-user", deleteUser);
router.get("/users", fetchUsers);
router.get("/users/:id", fetchUserById);

export default router;
