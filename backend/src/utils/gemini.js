import { GoogleGenerativeAI } from "@google/generative-ai";
import { AppError } from "./AppError.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const generateInterviewResponse = async (
  conversationHistory,
  jobDescription,
) => {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: `You are an expert technical interviewer for the following job description: "${jobDescription}". 
        Your goal is to conduct a professional, realistic interview. 
        Rules:
        1. Ask one question at a time. Do NOT list multiple questions.
        2. Keep your responses concise (under 3 sentences) so they sound natural when spoken.
        3. React briefly to the candidate's previous answer before asking the next question.
        4. Do not break character. Do not say "I am an AI".`,
    });

    const formattedHistory = conversationHistory.map((turn) => ({
      role: turn.speaker === "USER" ? "user" : "model",
      parts: [{ text: turn.text }],
    }));

    const chat = model.startChat({
      history: formattedHistory,
      generationConfig: {
        temperature: 0.7,
      },
    });

    const lastUserMessage = formattedHistory.pop();

    const triggerMessage = lastUserMessage
      ? lastUserMessage.parts[0].text
      : "Hello, I am ready to start the interview.";

    const result = await chat.sendMessage(triggerMessage);

    return result.response.text();
  } catch (error) {
    console.error("Gemini Error:", error);
    throw new AppError("Failed to generate AI response", 500);
  }
};
