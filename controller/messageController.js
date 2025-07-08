import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_API_KEY,
});

export const chatMessage = async (req, res) => {
  const { persona, message } = req.body;

  if (!persona || typeof persona !== "string" || typeof message !== "string") {
    return res
      .status(400)
      .json({ error: "Missing 'persona' or 'message' in request body" });
  }

  const fixedModelPersona =
    "Hello, I'm your beautiful girlfriend ever Rina Tennouji.";

  try {
    const response = await ai.chats.create({
      model: "gemini-2.5-flash",
      config: {
        thinkingConfig: {
          thinkingBudget: 1,
        },
      },
      history: [
        {
          role: "user",
          parts: [
            {
              text: persona,
            },
          ],
        },
        {
          role: "model",
          parts: [
            {
              text: fixedModelPersona,
            },
          ],
        },
      ],
    });
    const response1 = await response.sendMessage({
        message: message
    });

    res.status(200).json({response: response1.text});
  } catch (err) {
    console.error("Error from AI:", err);
    res.status(500).json({ error: "Failed to get AI response" });
  }
};
