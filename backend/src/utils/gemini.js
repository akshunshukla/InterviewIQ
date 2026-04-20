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

export const generateInterviewReport = async (transcript, jobDescription) => {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      // Force the AI to output valid JSON
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.2, // Low temperature for more analytical/consistent grading
      },
      systemInstruction: `You are an expert technical recruiter evaluating an interview transcript for the following role: "${jobDescription}". 
        Analyze the candidate's answers based on accuracy, communication, clarity, and problem-solving.
        You MUST output a valid JSON object with the following exact keys and value types:
        {
          "tech_score": number (0-100),
          "comm_score": number (0-100),
          "problemSolvingScore": number (0-100),
          "clarityScore": number (0-100),
          "strengths": [array of short strings],
          "weaknesses": [array of short strings],
          "finalRecommendation": string (detailed paragraph of feedback),
          "final_verdict": string (either "HIRE", "NO HIRE", or "NEEDS REVIEW")
        }`,
    });

    const prompt = `Here is the interview transcript:\n${transcript}\n\nGenerate the evaluation JSON.`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Parse the stringified JSON returned by Gemini into a JS Object
    return JSON.parse(responseText);
  } catch (error) {
    console.error("Gemini Evaluation Error:", error);
    throw new AppError("Failed to generate interview report from AI", 500);
  }
};
