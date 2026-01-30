from flask import Flask, request, send_file, jsonify
from TTS.api import TTS
import torch
import os
import io
from datetime import datetime

app = Flask(__name__)

device = "cuda" if torch.cuda.is_available() else "cpu"
tts = TTS("tts_models/multilingual/multi-dataset/xtts_v2").to(device)

VOICE_SAMPLES_DIR = "voice_samples"
AUDIO_OUTPUT_DIR = "public/audio"

os.makedirs(VOICE_SAMPLES_DIR, exist_ok=True)
os.makedirs(AUDIO_OUTPUT_DIR, exist_ok=True)

@app.route('/upload-voice', methods = ['POST'])
def upload_voice():
    if 'audio' not in request.files:
        return jsonify({"error" : "No audio file provided"}), 400
    
    audio_file = request.files['audio']
    voice_name = request.form.get('voice_name', 'default')
    
    voice_path = os.path.join(VOICE_SAMPLES_DIR, f"{voice_name}.wav")
    audio_file.save(voice_path)
    
    return jsonify({
        "success" : True,
        "message" : f"voice sample '{voice_name}', successfully uploaded",
        "voice_path" : voice_path
    })
    
@app.route('/tts', methods=['POST'])
def text_to_speech():
    data = request.json
    text = data.get('text', '')
    voice_name = data.get('voice_name', 'default')
    language = data.get('language', 'en')