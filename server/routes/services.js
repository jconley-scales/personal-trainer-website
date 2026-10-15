import { Router } from "express";
import { readCollection } from "../db.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get("/", asyncHandler(async (req, res) => {
  const services = await readCollection("services");
  res.json(services);
}));

export default router;
