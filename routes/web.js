import e from "express";
import multer from "multer";
import { messageAi } from "../controller/messageController.js";
import {
  createPersona,
  createUserPersona,
} from "../controller/modelController.js";
import {
  uploadVoiceSample,
  listVoices,
} from "../controller/voiceController.js";

const router = e.Router();

const upload = multer({
  dest: "uploads/",
});

router.post("/chat/message", messageAi);
router.post("/create/model-persona", createPersona);
router.post("/create/user-persona", createUserPersona);
router.post("/voice/upload", uploadVoiceSample);
router.get("/voice/list", listVoices);

export default router;
