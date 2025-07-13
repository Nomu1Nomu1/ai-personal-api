import { GoogleGenAI } from "@google/genai";
import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";

dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_API_KEY,
});

const sessions = {};

export const newPersona = async (req, res) => {
  const { persona } = req.body;

  if (!persona) {
    return res.status(400).json({ error: "Missing 'persona'" });
  }

  const sessionId = uuidv4();

  const sessionData = {
    history: [
      {
        role: "user",
        parts: [{ text: persona }],
      },
      {
        role: "model",
        parts: [
          { text: "Hello, I'm your beautiful girlfriend ever Rina Tennouji." },
        ],
      },
    ],
  };

  sessions[sessionId] = sessionData;

  res.json({ sessionId, initialMessage: sessionData.history[1].parts[0].text });
};

export const chatMessage = async (req, res) => {
  const { sessionId, message } = req.body;

  if (!sessionId || !message) {
    return res.status(400).json({ error: "Missing 'sessionI' or 'message'" });
  }

  const session = sessions[sessionId];
  if (!session) {
    return res.status(404).json({ error: "Session not found" });
  }

  session.history.push({
    role: "user",
    parts: [{ text: message }],
  });
  
  try {
    const response = await ai.chats.create({
      model: "gemini-2.5-flash",
      config: {
        thinkingConfig: {
          thinkingBudget: 1
        }
      },
      history: session.history,
    });

    const response1 = await response.sendMessage({
      message: message,
    });

    session.history.push({
      role: "model",
      parts: [{ text: response1.text }],
    });

    res.status(200).json({ response: response1.text });
  } catch (error) {
    console.error("Error from AI:", error);
    res.status(500).json({ error: "Failed to get AI response" });
  }
  
}