import express from "express";
import { getOrders } from "../controllers/orders.controller";

const router = express.Router();

// `requireAuth` is mounted in app.ts, so every route here has `req.user`.
router.get("/", getOrders);

export default router;
