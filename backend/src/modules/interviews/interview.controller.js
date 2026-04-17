import prisma from "../../config/db.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { AppError } from "../../utils/AppError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { uploadToS3 } from "../../utils/s3.js";

import { transcribeAudio } from "../../utils/deepgram.js";
import { generateInterviewResponse } from "../../utils/gemini.js";
import { generateSpeech } from "../../utils/tts.js";

export const processInterviewTurn = asyncHandler(async (req, res, next) => {
  const { interviewId } = req.body;
  const audioFile = req.file;

  if (!interviewId || !audioFile) {
    throw new AppError("Interview ID and audio file are required", 400);
  }

  const interview = await prisma.interview.findUnique({
    where: { id: interviewId },
    include: {
      application: {
        include: { job: true },
      },
    },
  });

  if (!interview) {
    throw new AppError("Interview not found", 404);
  }

  const userText = await transcribeAudio(audioFile.buffer);

  const userAudioUrl = await uploadToS3(
    audioFile.buffer,
    audioFile.originalname,
    audioFile.mimetype,
  );

  const lastTurn = await prisma.interviewTurn.findFirst({
    where: { interviewId },
    orderBy: { turn_number: "desc" },
  });
  const currentTurnNumber = lastTurn ? lastTurn.turn_number + 1 : 1;

  await prisma.interviewTurn.create({
    data: {
      interviewId,
      turn_number: currentTurnNumber,
      speaker: "USER",
      text: userText,
      audioUrl: userAudioUrl,
    },
  });

  const conversationHistory = await prisma.interviewTurn.findMany({
    where: { interviewId },
    orderBy: { turn_number: "asc" },
  });

  const jobDescription =
    interview.application?.job?.job_description || "General Mock Interview";
  const aiText = await generateInterviewResponse(
    conversationHistory,
    jobDescription,
  );

  const aiAudioBuffer = await generateSpeech(aiText);

  const aiAudioUrl = await uploadToS3(
    aiAudioBuffer,
    `ai-response-turn-${currentTurnNumber + 1}.mp3`,
    "audio/mpeg",
  );

  const aiTurn = await prisma.interviewTurn.create({
    data: {
      interviewId,
      turn_number: currentTurnNumber + 1,
      speaker: "AI",
      text: aiText,
      audioUrl: aiAudioUrl,
    },
  });

  res.status(200).json(
    new ApiResponse(
      200,
      {
        turn: aiTurn,
      },
      "Interview turn processed successfully",
    ),
  );
});
