import prisma from "../../config/db.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { AppError } from "../../utils/AppError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";

export const createJob = asyncHandler(async (req, res, next) => {
  const {
    title,
    job_description,
    tech_stack,
    location,
    workMode,
    experienceLevel,
    max_applicants,
    eligibility_rules,
  } = req.body;

  if (!title || !job_description || !max_applicants) {
    throw new AppError(
      "Title, job description, and max applicants are required",
      400,
    );
  }

  const membership = await prisma.organizationMembership.findFirst({
    where: { userId: req.user.id },
  });

  if (!membership) {
    throw new AppError("You must belong to an organization to post a job", 403);
  }

  const newJob = await prisma.job.create({
    data: {
      orgId: membership.orgId,
      title,
      job_description,
      tech_stack,
      location,
      workMode,
      experienceLevel,
      max_applicants,
      eligibility_rules,
    },
  });

  res
    .status(201)
    .json(new ApiResponse(201, { job: newJob }, "Job posted successfully"));
});

export const getAllJobs = asyncHandler(async (req, res, next) => {
  const jobs = await prisma.job.findMany({
    where: { status: "OPEN" },
    include: {
      organization: { select: { name: true } },
    },
  });

  res
    .status(200)
    .json(new ApiResponse(200, { jobs }, "Jobs fetched successfully"));
});
