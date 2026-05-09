import express from "express";
import { generateStory, generateTTS } from "../controllers/storyController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/generate", protect, generateStory);
router.post("/tts", protect, generateTTS);

export default router;