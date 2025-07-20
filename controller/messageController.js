import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { userPersona } from "../models/userPersona.js";
import { ModelPersona } from "../models/modelPersona.js";

dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_API_KEY,
});

export const messageAi = async (req, res) => {
  const { username, modelId, message } = req.body;

  if (!username || !modelId || !message) {
    return res
      .status(400)
      .json({ error: "Missing username, modelId, or message" });
  }

  try {
    const user = await userPersona.findOne({ where: { username } });
    if (!user) {
      return res.status(404).json({ error: "Username not found" });
    }

    const model = await ModelPersona.findOne({ where: { id: modelId } });
    if (!model) {
      return res.status(404).json({ error: "Model persona not found" });
    }

    const modelIntro = `Hello, i'm your ${
      model.gender === "female" ? "beautiful" : "handsome"
    } comapanion ${model.name}. ${model.persona}`;

    const history = [
      {
        role: "user",
        parts: [{ text: `${user.persona}` }],
      },
      {
        role: "model",
        parts: [{ text: modelIntro }],
      },
    ];

    const response = await ai.chats.create({
      model: "gemini-2.5-flash",
      config: {
        thinkingConfig: {
          thinkingBudget: 1,
        },
      },
      history: history,
    });

    const aiResponse = await response.sendMessage({
      message: message,
    });

    return res.status(200).json({
      success: true,
      modelName: model.name,
      response: aiResponse.text,
    });
  } catch (error) {
    console.error("Error from AI:", error);
    return res.status(500).json({ error: "Failed to get AI response" });
  }
};
