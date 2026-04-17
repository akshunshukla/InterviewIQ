import { DeepgramClient } from "@deepgram/sdk";
import { AppError } from "./AppError.js";

const deepgram = new DeepgramClient({ apiKey: process.env.DEEPGRAM_API_KEY });

export const transcribeAudio = async (audioBuffer) => {
  try {
    const response = await deepgram.listen.v1.media.transcribeFile(
      audioBuffer,
      {
        model: "nova-3",
        smart_format: true,
      },
    );

    return response.results.channels[0].alternatives[0].transcript;
  } catch (error) {
    console.error("Deepgram STT Error:", error);
    throw new AppError("Failed to transcribe candidate's audio", 500);
  }
};
