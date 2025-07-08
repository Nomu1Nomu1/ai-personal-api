import e from "express";
import { chatMessage } from "../controller/messageController.js";

const router = e.Router();

router.post("/chat/message", chatMessage);

export default router;