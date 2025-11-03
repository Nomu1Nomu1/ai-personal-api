import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { userPersona } from "../models/userPersona.js";
import { ModelPersona } from "../models/modelPersona.js";
import { ChatLogs } from "../models/chatLogs.js";

dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_API_KEY,
});

export const messageAi = async (req, res) => {
  const { usernameId, modelId, message } = req.body;

  if (!usernameId || !modelId || !message) {
    return res
      .status(400)
      .json({ error: "Missing usernameId, modelId, or message" });
  }

  try {
    const user = await userPersona.findOne({ where: { id: usernameId } });
    if (!user) {
      return res.status(404).json({ error: "usernameId not found" });
    }

    const model = await ModelPersona.findOne({ where: { id: modelId } });
    if (!model) {
      return res.status(404).json({ error: "Model persona not found" });
    }

    const modelIntro = `Hello, i'm your ${
      model.gender === "female" ? "beautiful" : "handsome"
    } comapanion ${model.name}. ${model.persona}`;

    const pastLogs = await ChatLogs.findAll({
      where: { usernameId, modelId },
      order: [["createdAt", "ASC"]]
    })

    const history = [
      {
        role: "user",
        parts: [{ text: `${user.persona}` }],
      },
      {
        role: "model",
        parts: [{ text: modelIntro }],
      },
      ...pastLogs.map((log) => ({
        role: log.role,
        parts: [{
          text: log.message
        }]
      }))
    ];

    
    const response = await ai.chats.create({
      model: "gemini-2.5-pro",
      config: {
        thinkingConfig: {
          thinkingBudget: -1,
        },
      },
      history: history,
    });
    
    const aiResponse = await response.sendMessage({
      message: message,
    });
    
    ChatLogs.create({
      usernameId,
      modelId,
      role: 'user',
      message
    })

    ChatLogs.create({
      usernameId,
      modelId,
      role: 'model',
      message: aiResponse.text
    })
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
