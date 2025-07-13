import e from "express";
import { chatMessage, newPersona } from "../controller/messageController.js";

const router = e.Router();

router.post("/chat/message", chatMessage);
router.post("/chat/start", newPersona);

export default router;