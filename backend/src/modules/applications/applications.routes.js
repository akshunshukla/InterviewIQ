import express from "express";
import multer from "multer";
import { applyForJob, getJobApplications } from "./applications.controller.js";
import { protect, restrictTo } from "../../middleware/authMiddleware.js";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// Protect all routes below
router.use(protect);

// CANDIDATE Route: Apply to a job (requires a file upload named 'resume')
router.post(
  "/:jobId/apply",
  restrictTo("CANDIDATE"),
  upload.single("resume"),
  applyForJob,
);

// RECRUITER Route: View all applicants for a specific job
router.get("/job/:jobId", restrictTo("RECRUITER"), getJobApplications);

export default router;
