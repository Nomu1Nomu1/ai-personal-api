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
    try:
        data = request.json
        text = data.get('text', '')
        voice_name = data.get('voice_name', 'default')
        language = data.get('language', 'en')
    
        if not text:
            return jsonify({"error" : "No text provided"}), 400
    
        speaker_wav = os.path.join(VOICE_SAMPLES_DIR, f"{voice_name}.wav")
    
        if not os.path.exists(speaker_wav):
            return jsonify({"error" : f"Voice sample '{voice_name}' not found"}), 404
    
        timestamp = datetime.now().strftime('Y%m%d_H%M%S')
        output_filename = f"rina_voice_{timestamp}.wav"
        output_path = os.path.join(AUDIO_OUTPUT_DIR, output_filename)
    
        tts.tts_to_file(
            text=text,
            speaker_wav=speaker_wav,
            language=language,
            file_path=output_path
        )
    
        return send_file(output_path, mimetype='audio/wav')
    
    except Exception as e:
        return jsonify({"error" : str(e)}), 500
    
@app.route('/list-voice', methods=['GET'])
def list_voice():
    voices = []
    if os.path.exists(VOICE_SAMPLES_DIR):
        voices = [f.replace('.wav', '') for f in os.listdir(VOICE_SAMPLES_DIR) if f.endswith('.wav')]
        
    return jsonify({
        "voices" : voices,
        "count" : len(voices)
    })
    
@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        "status" : "healthy",
        "model" : "xtts_v2",
        "device" : device
    })
    
if __name__ == '__main__':
    print(f"TTS server running on http://localhost:5000")
    print(f"Voice sample directory: {VOICE_SAMPLES_DIR}")
    print(f"Audio output directory: {AUDIO_OUTPUT_DIR}")
    app.run(host='0.0.0.0', port=5000, debug=True)