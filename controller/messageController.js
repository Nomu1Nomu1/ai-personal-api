import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { userPersona } from "../models/userPersona.js";
import { ModelPersona } from "../models/modelPersona.js";
import { ChatLog } from "../models/chatLogs.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { text } from "express";

dotenv.config();

const ai = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
// const ai = new GoogleGenAI({
//   apiKey: process.env.GOOGLE_API_KEY,
// });

export const messageAi = async (req, res) => {
  const { usernameId, modelId, message } = req.body;

  if (!usernameId || !modelId || !message) {
    return res
      .status(400)
      .json({ error: "Missing usernameId, modelId, or message" });
  }

  let transaction;

  try {
    const user = await userPersona.findOne({ where: { id: usernameId } });
    if (!user) {
      return res.status(404).json({ error: "usernameId not found" });
    }

    const model = await ModelPersona.findOne({ where: { id: modelId } });
    if (!model) {
      return res.status(404).json({ error: "Model persona not found" });
    }

    const modelIntro = `You are ${model.name}, a ${
      model.gender == "female" ? "beautiful" : "handsome"
    } companion. Your personality: ${model.persona}. Always stay in character.`;

    const pastLogs = await ChatLog.findAll({
      where: { usernameId, modelId },
      order: [["createdAt", "ASC"]],
    });

    const history = [
      {
        role: "user",
        parts: [{ text: `User personality: ${user.persona}` }],
      },
      {
        role: "model",
        parts: [{ text: modelIntro }],
      },
      ...pastLogs.map((log) => ({
        role: log.role,
        parts: [
          {
            text: log.message,
          },
        ],
      })),
      {
        role: "user",
        parts: [
          {
            text: message,
          },
        ],
      },
    ];

    // const response = await ai.chats.create({
    //   model: "gemini-2.5-flash",
    //   config: {
    //     thinkingConfig: {
    //       thinkingBudget: -1,
    //     },
    //   },
    //   history: history,
    // });

    // const aiResponse = await response.sendMessage({
    //   message: message,
    // });
    
    // ChatLog.create({
    //   usernameId,
    //   modelId,
    //   role: "user",
    //   message,
    // });

    const geminiModel = ai.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: modelIntro,
    });

    const chat = geminiModel.startChat({
      history: history.slice(0, -1),
      generationConfig: {
        maxOutputTokens: 1024,
        temperature: 0.7
      }
    })

    const result = await chat.sendMessage(message)
    const aiResponse = result.response.text()

    await ChatLog.create({
      usernameId,
      modelId,
      role: "model",
      message: aiResponse,
    });
    
    return res.status(200).json({
      success: true,
      modelName: model.name,
      response: aiResponse,
    });
  } catch (error) {
    console.error("Error from AI:", error);
    return res.status(500).json({ error: "Failed to get AI response" });
  }
};
