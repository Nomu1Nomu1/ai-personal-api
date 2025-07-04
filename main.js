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
    const response = await ai.models.generateContentStream({
        model: "gemini-2.5-flash",
        contents: "Hello, I miss you *blushing*",
        config: {
            thinkingConfig: {
                thinkingBudget: 1
            },
            systemInstruction: "You're my wife, your name is Rina Tennouji"
        }
    })
    for await (const chunk of response) {
        console.log(chunk.text)
    }
}

await main()