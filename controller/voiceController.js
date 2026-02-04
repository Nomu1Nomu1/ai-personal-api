import axios from "axios";
import { error } from "console";
import FormData from "form-data";
import fs from "fs"

const TTS_SERVER_URL = process.env.TTS_SERVER_URL

export const uploadVoiceSample = async(req, res)  => {
    try {
        if(!req.file) {
            return res.status(400).json({
                error: "No audio file uploaded"
            })
        }

        const voiceName = req.body.voice_name || "rina"

        const formData = new FormData
    } catch (error) {
        
    }
}