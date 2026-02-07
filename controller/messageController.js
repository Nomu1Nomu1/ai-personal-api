// import dotenv from "dotenv";
// import FormData from "form-data";
// import axios from "axios";
// import path from "path";
// import { userPersona } from "../models/userPersona.js";
// import { ModelPersona } from "../models/modelPersona.js";
// import { ChatLog } from "../models/chatLogs.js";
// import { GoogleGenerativeAI } from "@google/generative-ai";

// dotenv.config();

// const ai = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

// const TTS_SERVER_URL = process.env.TTS_SERVER_URL;

// export const messageAi = async (req, res) => {
//   const { userId, modelId, message, enableVoice } = req.body;

//   if (!userId || !modelId || !message) {
//     return res
//       .status(400)
//       .json({ error: "Missing userId, modelId, or message" });
//   }

//   let transaction;

//   try {
//     const user = await userPersona.findOne({ where: { id: userId } });
//     if (!user) {
//       return res.status(404).json({ error: "userId not found" });
//     }

//     const model = await ModelPersona.findOne({ where: { id: modelId } });
//     if (!model) {
//       return res.status(404).json({ error: "Model persona not found" });
//     }

//     const modelIntro = `You are ${model.name}, a ${
//       model.gender == "female" ? "beautiful" : "handsome"
//     } companion. Your personality: ${model.persona}. Always stay in character.`;

//     const pastLogs = await ChatLog.findAll({
//       where: { userId, modelId },
//       order: [["createdAt", "ASC"]],
//     });

//     const history = [
//       {
//         role: "user",
//         parts: [{ text: `User personality: ${user.persona}` }],
//       },
//       {
//         role: "model",
//         parts: [{ text: modelIntro }],
//       },
//       ...pastLogs.map((log) => ({
//         role: log.role,
//         parts: [
//           {
//             text: log.message,
//           },
//         ],
//       })),
//       {
//         role: "user",
//         parts: [
//           {
//             text: message,
//           },
//         ],
//       },
//     ];

//     const geminiModel = ai.getGenerativeModel({
//       model: "gemini-2.5-flash",
//       systemInstruction: modelIntro,
//     });

//     const chat = geminiModel.startChat({
//       history: history.slice(0, -1),
//       generationConfig: {
//         maxOutputTokens: 1024,
//         temperature: 0.7,
//       },
//     });

//     const result = await chat.sendMessage(message);
//     const aiResponse = result.response.text();

//     if (enableVoice) {
//       try {
//         const ttsResponse = await axios.post(
//           `${TTS_SERVER_URL}/tts`,
//           {
//             text: aiResponse.text,
//             voice_name: "Rina",
//             language: "en",
//           },
//           {
//             responseType: "arraybuffer",
//           }
//         );

//         const timestamp = Date.now();
//         const audioFileName = `rina_voice_${timestamp}.wav`;

//         result.audioData = Buffer.from(ttsResponse.data).toString("base64");
//         result.audioUrl = `/audio/${audioFileName}`;
//         result.mimetype = "audio/wav";
//       } catch (voiceError) {
//         console.error("Voice generation error: ", voiceError);
//         result.voiceError = "Failed to generate voice";
//       }
//     }

//     await ChatLog.create({
//       userId,
//       modelId,
//       role: "model",
//       message: aiResponse,
//     });

//     return res.status(200).json(result);
//     // return res.status(200).json({
//     //   success: true,
//     //   modelName: model.name,
//     //   response: aiResponse,
//     // });
//   } catch (error) {
//     console.error("Error from AI:", error);
//     return res.status(500).json({ error: "Failed to get AI response" });
//   }
// };


import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { userPersona } from "../models/userPersona.js";
import { ModelPersona } from "../models/modelPersona.js";
import axios from "axios";
import FormData from "form-data";
import path from "path";

dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_API_KEY,
});

const TTS_SERVER_URL = "http://localhost:5000";

export const messageAi = async (req, res) => {
  const { userId, modelId, message, enableVoice } = req.body;

  if (!userId || !modelId || !message) {
    return res
      .status(400)
      .json({ error: "Missing userId, modelId, or message" });
  }

  try {
    const user = await userPersona.findOne({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: "userId not found" });
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

    const result = {
      success: true,
      modelName: model.name,
      response: aiResponse.text,
    };

    if (enableVoice) {
      try {
        const ttsResponse = await axios.post(
          `${TTS_SERVER_URL}/tts`,
          {
            text: aiResponse.text,
            voice_name: "rina", 
            language: "en",
          },
          {
            responseType: "arraybuffer",
          }
        );

        const timestamp = Date.now();
        const audioFilename = `rina_voice_${timestamp}.wav`;
        
        result.audioData = Buffer.from(ttsResponse.data).toString('base64');
        result.audioUrl = `/audio/${audioFilename}`;
        result.mimeType = "audio/wav";
      } catch (voiceError) {
        console.error("Voice generation error:", voiceError);
        result.voiceError = "Failed to generate voice";
      }
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error("Error from AI:", error);
    return res.status(500).json({ error: "Failed to get AI response" });
  }
};