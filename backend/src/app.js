import express from "express";
import cors from "cors";
import helmet from "helmet";

import { globalErrorHandler } from "./middleware/errorMiddleware.js";
import { AppError } from "./utils/AppError.js";
import authRoutes from "./modules/auth/auth.routes.js";
import jobRoutes from "./modules/jobs/jobs.routes.js";
import applicationRoutes from "./modules/applications/applications.routes.js";
import interviewRoutes from "./modules/interviews/interview.routes.js";

const app = express();

app.use(helmet()); // Sets security HTTP headers
app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/interview", interviewRoutes);

app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Interview IQ API is running smoothly 🚀",
  });
});

app.use((req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

export default app;
