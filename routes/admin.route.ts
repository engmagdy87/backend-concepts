import express from "express";
import {
  addProduct,
  updateProduct,
  deleteProduct,
  fetchProducts,
  fetchProductById,
  uploadImage,
} from "../controllers/products.controller";
import { uploadProductImage } from "../middlewares/upload.middleware";
import {
  addUser,
  updateUser,
  deleteUser,
  fetchUsers,
  fetchUserById,
} from "../controllers/users.controller";
import {
  validateBody,
  validateIdParam,
} from "../middlewares/validate.middleware";
import { productSchema } from "../schemas/product.schema";
import { addUserSchema, userSchema } from "../schemas/user.schema";

const router = express.Router();

// REST style: the URL names the thing (products, users), the HTTP method
// names the action (GET read, POST create, PUT replace, DELETE remove).
// validateIdParam on every :id route: `abc` → 400 before anything else runs;
// a real id with no row → 404 from the controller.

router.get("/products", fetchProducts);
router.get("/products/:id", validateIdParam, fetchProductById);
// validateBody runs before the controller: a bad body never reaches it (400).
router.put("/products/:id", validateIdParam, validateBody(productSchema), updateProduct);
router.post("/products", validateBody(productSchema), addProduct);
router.delete("/products/:id", validateIdParam, deleteProduct);
// multipart/form-data, field "image". Runs left to right:
// check the id (400) → multer saves the file → controller saves the URL.
router.post(
  "/products/:id/image",
  validateIdParam,
  uploadProductImage,
  uploadImage,
);

router.post("/users", validateBody(addUserSchema), addUser);
router.put("/users/:id", validateIdParam, validateBody(userSchema), updateUser);
router.delete("/users/:id", validateIdParam, deleteUser);
router.get("/users", fetchUsers);
router.get("/users/:id", validateIdParam, fetchUserById);

export default router;
