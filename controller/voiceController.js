import axios from "axios";
import FormData from "form-data";
import fs from "fs";

const TTS_SERVER_URL = process.env.TTS_SERVER_URL;

export const uploadVoiceSample = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: "No audio file uploaded",
      });
    }

    const voiceName = req.body.voice_name || "rina";

    const formData = new FormData();
    formData.append("audio", fs.createReadStream(req.file.path));
    formData.append("voice_name", voiceName);

    const response = await axios.post(
      `${TTS_SERVER_URL}/upload-voice`,
      formData,
      {
        headers: formData.getHeaders(),
      }
    );

    fs.unlinkSync(req.file.path);

    return res.status(200).json(response.data);
  } catch (error) {
    console.error("Error uploading voice: ", error);
    return res.status(500).json({ error: "Failed to upload voice sample" });
  }
};

export const listVoices = async (req, res) => {
  try {
    const response = await axios.get(`${TTS_SERVER_URL}/list-voice`);
    return res.status(200).json(response.data);
  } catch (error) {
    console.error("Error listing voice: ", error);
    return res.status(500).json({ error: "Failed to list voices" });
  }
};
