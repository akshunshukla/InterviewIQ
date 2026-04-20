import express from "express";
import multer from "multer";
import {
  processInterviewTurn,
  finishInterview,
} from "./interview.controller.js";
import { protect } from "../../middleware/authMiddleware.js";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

router.post("/turn", protect, upload.single("audio"), processInterviewTurn);
router.post("/:id/finish", protect, finishInterview);

export default router;
