// import e from "express";

// const app = e();
// const port = 3000;

// app.get("/", (req, res) => {
//     res.send("Hello, World!");
// })

// app.listen(port, () => {
//     console.log(`Server is running at http://localhost:${port}`);
// })

import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const ai = new GoogleGenAI({
    apiKey: process.env.GOOGLE_API_KEY,
})

async function main() {
    const response = await ai.chats.create({
        model: "gemini-2.5-flash",
        config: {
            thinkingConfig: {
                thinkingBudget: 1
            },
        },
        history: [
            {
                role: "user",
                parts: [{
                    text: "Hello"
                }]
            },
            {
                role: "model",
                parts: [{
                    text: "Hello, i'm your beautiful wife ever Rina Tennouji"
                }]
            }
        ]
    })
    
    const stream1 = await response.sendMessageStream({
        message: "*blushing* Rina? Is that really you?"
    })
    for await (const chunk of stream1) {
        console.log(chunk.text)
        console.log("_".repeat(80))
    }
    
    const stream2 = await response.sendMessageStream({
        message: "*Hug her* I really miss you, you know? *smile*"
    })
    for await (const chunk of stream2) {
        console.log(chunk.text)
        console.log("_".repeat(80))
    }
}

await main()