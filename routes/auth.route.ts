import express from "express";
import { signup, login, me } from "../controllers/auth.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import { validateBody } from "../middlewares/validate.middleware";
import { loginSchema, userSchema } from "../schemas/user.schema";

const router = express.Router();

router.post("/signup", validateBody(userSchema), signup);
router.post("/login", validateBody(loginSchema), login);
router.get("/me", requireAuth, me);

export default router;
