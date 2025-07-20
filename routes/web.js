import e from "express";
import { messageAi } from "../controller/messageController.js";
import { createPersona, createUserPersona } from "../controller/modelController.js";

const router = e.Router();

router.post("/chat/message", messageAi);
router.post("/create/model-persona", createPersona)
router.post("/create/user-persona", createUserPersona);

export default router;