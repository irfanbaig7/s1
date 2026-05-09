import express from "express";

import { generateStory } from "../controllers/storyController.js";

import protect from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/generate", protect, generateStory);

export default router;