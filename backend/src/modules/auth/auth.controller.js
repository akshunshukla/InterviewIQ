import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../../config/db.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { AppError } from "../../utils/AppError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";

// Helper function to generate JWT
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

export const register = asyncHandler(async (req, res, next) => {
  const { email, password, name, role, orgName } = req.body;

  if (!email || !password || !name || !role) {
    throw new AppError("Please provide email, password, name, and role", 400);
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new AppError("Email is already in use", 400);
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  let newUser;

  if (role === "RECRUITER") {
    if (!orgName) throw new AppError("Recruiters must provide an orgName", 400);

    const transactionResult = await prisma.$transaction(
      async (prismaClient) => {
        const org = await prismaClient.organization.create({
          data: { name: orgName, credits: 100 },
        });

        const user = await prismaClient.user.create({
          data: {
            email,
            password: hashedPassword,
            name,
            role,
          },
        });

        await prismaClient.organizationMembership.create({
          data: {
            userId: user.id,
            orgId: org.id,
            role: "ADMIN",
          },
        });

        return user;
      },
    );

    newUser = transactionResult;
  } else {
    newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role,
        credits: 10,
      },
    });
  }

  const token = signToken(newUser.id);

  newUser.password = undefined;

  res
    .status(201)
    .json(
      new ApiResponse(
        201,
        { user: newUser, token },
        "User registered successfully",
      ),
    );
});

export const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new AppError("Please provide email and password", 400);
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new AppError("Incorrect email or password", 401);
  }

  const token = signToken(user.id);
  user.password = undefined;

  res
    .status(200)
    .json(new ApiResponse(200, { user, token }, "User logged in successfully"));
});
