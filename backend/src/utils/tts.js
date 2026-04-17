import { DeepgramClient } from "@deepgram/sdk";
import { AppError } from "./AppError.js";

const deepgram = new DeepgramClient({ apiKey: process.env.DEEPGRAM_API_KEY });

export const generateSpeech = async (text) => {
  try {
    const response = await deepgram.speak.v1.audio.generate({
      text,
      model: "aura-asteria-en",
      encoding: "linear16",
      container: "wav",
    });

    const stream = await response.stream();

    // Convert Web Stream to Node Buffer for S3 upload
    const reader = stream.getReader();
    const chunks = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }

    return Buffer.concat(chunks);
  } catch (error) {
    console.error("TTS Error:", error);
    throw new AppError("Failed to generate speech", 500);
  }
};
