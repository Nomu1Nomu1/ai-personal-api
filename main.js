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
import readline from "readline";

dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_API_KEY,
});

async function startInteractiveChat() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
  });

  rl.question("Enter your Persona: ", async (initialPersona) => {
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
              text: initialPersona,
            },
          ],
        },
        {
          role: "model",
          parts: [
            {
              text: "Hello, i'm your beautiful girlfriend ever Rina Tennouji",
            },
          ],
        },
      ],
    });

    console.log("\nRina: Hello, i'm your beautiful girlfriend ever Rina Tennouji. \n");
    console.log("Type message and press Enter. Type 'exit' to end session.\n");

    const promptUser = () => {
      rl.question("You: ", async (input) => {
        const trimmed = input.trim();

        if (
          trimmed.toLowerCase() === "exit" ||
          trimmed.toLowerCase() === "quit"
        ) {
          console.log("Session ended.");
          rl.close();
          return;
        }

        try {
          const stream = await response.sendMessageStream({
            message: trimmed,
          });

          process.stdout.write("Rina: ");

          for await (const chunk of stream) {
            process.stdout.write(chunk.text);
          }
        } catch (err) {
          console.error("Error during streaming: ", err);
        }

        promptUser();
      });
    };
    promptUser();
  });
};

await startInteractiveChat().catch((err) => console.error(err));
