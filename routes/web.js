import e from "express";
import { chatMessage, newPersona } from "../controller/messageController.js";
import { createPersona } from "../controller/modelController.js";

const router = e.Router();

router.post("/chat/message", chatMessage);
router.post("/chat/start", newPersona);
router.post("/create/model-persona", createPersona)

export default router;