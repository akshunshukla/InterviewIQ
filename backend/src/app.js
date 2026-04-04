import express from "express";
import cors from "cors";
import helmet from "helmet";

import { globalErrorHandler } from "./middleware/errorMiddleware.js";
import { AppError } from "./utils/AppError.js";

const app = express();

app.use(helmet()); // Sets security HTTP headers
app.use(cors());
app.use(express.json());

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
