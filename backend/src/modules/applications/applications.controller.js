import prisma from "../../config/db.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { AppError } from "../../utils/AppError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { uploadToS3 } from "../../utils/s3.js";

import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");

export const applyForJob = asyncHandler(async (req, res, next) => {
  const { jobId } = req.params;
  const applicantId = req.user.id;

  // Verify the job exists and is OPEN
  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job || job.status !== "OPEN") {
    throw new AppError("This job is no longer accepting applications", 404);
  }

  // Check if the candidate already applied
  const existingApplication = await prisma.application.findFirst({
    where: { jobId, applicantId },
  });
  if (existingApplication) {
    throw new AppError("You have already applied for this job", 400);
  }

  // Ensure a PDF was uploaded
  if (!req.file) {
    throw new AppError("Please upload your resume as a PDF", 400);
  }

  // Extract text from the PDF buffer
  let resume_text = "";
  try {
    const pdfData = await pdfParse(req.file.buffer);
    resume_text = pdfData.text;
  } catch (error) {
    throw new AppError(
      "Failed to read the PDF. Please ensure it is a valid text-based PDF.",
      400,
    );
  }

  // Save the Application to the Database
  const newApplication = await prisma.application.create({
    data: {
      jobId,
      applicantId,
      resume_text,
      resumeFileUrl,
      status: "PENDING",
      interview: {
        create: {
          status: "SCHEDULED",
        },
      },
      // Note: In production, upload req.file.buffer to AWS S3 here
      // and save the S3 link to 'resumeFileUrl'.
    },
    include: {
      interview: true, // We return the interview so the frontend gets the interviewId immediately
    },
  });

  res
    .status(201)
    .json(
      new ApiResponse(
        201,
        { application: newApplication },
        "Successfully applied for the job",
      ),
    );
});

// Helper route for recruiters to view applications for their jobs
export const getJobApplications = asyncHandler(async (req, res, next) => {
  const { jobId } = req.params;

  const applications = await prisma.application.findMany({
    where: { jobId },
    include: {
      applicant: { select: { name: true, email: true } },
      interview: { select: { id: true, status: true, score: true } },
    },
  });

  res.status(200).json(new ApiResponse(200, { applications }));
});
