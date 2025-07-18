import { v4 as uuidv4 } from "uuid";
import { ModelPersona } from "../models/modelPersona.js";

const sessions = {}

export const createPersona = async (req, res) => {
    const { name, gender, persona } = req.body;

    if (!name || !gender || !persona) {
        return res.status(400).json({ error: "Missing name, gender, or persona" });
    }

    try {
        const newModel = await ModelPersona.create({ name, gender, persona });

        const sessionId = uuidv4();
        const modelPersona = `Hello, i'm your ${gender === "female" ? "beautiful" : "handsome"} comapanion ${name}. ${persona}`;

        const sessionData = {
            history: [
                {
                    role:  "user",
                    parts: [{ text: persona }]
                },
                {
                    role: "model",
                    parts: [{ text: modelPersona }]
                }
            ]
        }

        sessions[sessionId] = sessionData;

        res.status(201).json({
            success: true,
            sessionId,
            initialMessage: modelPersona,
            savedModel: newModel
        })
    } catch (err) {
        console.error("Error creating model persona:", err);
        res.status(500).json({ error: "Failed to create model persona" });
    }
}