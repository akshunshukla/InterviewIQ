import express from "express";
import { createJob, getAllJobs } from "./jobs.controller.js";
import { protect, restrictTo } from "../../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", getAllJobs);

router.use(protect);
router.post("/", restrictTo("RECRUITER"), createJob);

export default router;
