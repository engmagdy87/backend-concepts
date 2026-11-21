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
import { validateBody } from "../middlewares/validate.middleware";
import { productSchema } from "../schemas/product.schema";
import { addUserSchema, userSchema } from "../schemas/user.schema";

const router = express.Router();

router.get("/products", fetchProducts);
router.get("/products/:id", fetchProductById);
// validateBody runs before the controller: a bad body never reaches it (400).
router.put("/products/:id", validateBody(productSchema), updateProduct);
router.post("/add-product", validateBody(productSchema), addProduct);
router.delete("/delete-product/:id", deleteProduct);

router.post("/add-user", validateBody(addUserSchema), addUser);
router.put("/update-user/:id", validateBody(userSchema), updateUser);
router.delete("/delete-user/:id", deleteUser);
router.get("/users", fetchUsers);
router.get("/users/:id", fetchUserById);

export default router;
