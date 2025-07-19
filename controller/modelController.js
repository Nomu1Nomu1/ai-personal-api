import { ModelPersona } from "../models/modelPersona.js";
import { userPersona } from "../models/userPersona.js";

export const createPersona = async (req, res) => {
  const { name, gender, persona } = req.body;

  if (!name || !gender || !persona) {
    return res.status(400).json({ error: "Missing name, gender, or persona" });
  }

  try {
    const existing = await ModelPersona.findOne({ where: { persona } });
    if (existing) {
      return res
        .status(400)
        .json({ error: "Model with this persona already exists" });
    }

    const newModel = await ModelPersona.create({ name, gender, persona });

    const modelPersona = `Hello, i'm your ${
      gender === "female" ? "beautiful" : "handsome"
    } comapanion ${name}. ${persona}`;

    res.status(201).json({
      success: true,
      initialMessage: modelPersona,
      savedModel: newModel,
    });
  } catch (err) {
    console.error("Error creating model persona:", err);
    res.status(500).json({ error: "Failed to create model persona" });
  }
};

export const createUserPersona = async (req, res) => {
  const { username, persona } = req.body;

  if (!username || !persona) {
    return res.status(400).json({ error: "Missing username or persona" });
  }

  try {
    const newUser = await userPersona.create({ username, persona });

    res.status(201).json({
      success: true,
      message: "User persona created successfully",
      userPersona: newUser,
    });
  } catch (err) {
    console.error("Error creating user persona:", err);
    res.status(500).json({ error: "Failed to create user persona" });
  }
};
