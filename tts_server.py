from flask import Flask, request, send_file, jsonify
from datetime import datetime
from pathlib import Path
from TTS.api import TTS
import torch
import os
import io
import numpy as np
import soundfile as sf
import librosa

app = Flask(__name__)

device = "cuda" if torch.cuda.is_available() else "cpu"
print(f"using device: {device}")

tts = TTS("tts_models/multilingual/multi-dataset/xtts_v2").to(device)

VOICE_SAMPLES_DIR = "voice_samples"
AUDIO_OUTPUT_DIR = "public/audio"

os.makedirs(VOICE_SAMPLES_DIR, exist_ok=True)
os.makedirs(AUDIO_OUTPUT_DIR, exist_ok=True)

def preprocess_audio(input_path: str, output_path: str, target_sr: int=24000) -> dict:
    audio, sr = librosa.load(input_path, sr=None, mono=True)
    
    original_duration = len(audio)/sr
    
    audio, _ = librosa.effects.trim(audio, top_db=25)
    
    if sr != target_sr:
        audio = librosa.resample(audio, orig_sr=sr, target_sr=target_sr)
        sr = target_sr
        
    rms = np.sqrt(np.mean(audio ** 2))
    if rms > 0:
        target_rms = 10 ** (-20 / 20)
        audio = audio * (target_rms / rms)
        
    audio = np.clip(audio, -0.99, 0.99)
    
    duration = len(audio) / sr
    sf.write(output_path, audio, sr)
    
    return {
        "original_duration": round(original_duration, 2),
        "processed_duration": round(duration, 2),
        "sample_rate": sr
    }

def merge_voice_samples(voice_name: str, target_sr: int = 24000) -> str | None:
    voice_dir = os.path.join(VOICE_SAMPLES_DIR, voice_name)
    single_path = os.path.join(VOICE_SAMPLES_DIR, f"{voice_name}.wav")
    
    if os.path.isdir(voice_dir):
        wav_files = sorted(Path(voice_dir).glob("*.wav"))
        
        if not wav_files:
            return None
        
        combined = []
        silence = np.zeros(int(target_sr * 0.3))
        
        for wav_path in wav_files:
            audio, sr = librosa.load(str(wav_path), sr= target_sr, mono= True)
            combined.append(audio)
            combined.append(silence)
            
        merged = np.concatenate(combined)
        
        rms = np.sqrt(np.mean(merged ** 2))
        
        if rms > 0:
            target_rms = 10 ** (-20 / 20)
            merged = merged * (target_rms / rms)
        merged = np.clip(merged, -0.99, 0.99)
        
        merged_path = os.path.join(VOICE_SAMPLES_DIR, f"{voice_name}_merged.wav")
        sf.write(merged_path, merged, target_sr)
        return merged_path
    
    if os.path.exists(single_path):
        return single_path
    
    return None

def validate_sample(audio_path: str, min_seconds: float = 6.0) -> tuple[bool, str]:
    try:
        audio, sr = librosa.load(audio_path, sr=None, mono=True)
        duration = len(audio) / sr
        
        if duration < min_seconds:
            return False, f"Audio too short ({duration: .1f}s). Needed at least {min_seconds}s"
        
        non_silent = librosa.effects.split(audio, top_db=30)
        if len(non_silent) == 0:
            return False, "Audio appears to be silent"
        
        return True, "OK"
    except Exception as e:
        return False, str(e)

@app.route('/upload-voice', methods = ['POST'])
def upload_voice():
    if 'audio' not in request.files:
        return jsonify({"error" : "No audio file provided"}), 400
    
    audio_file = request.files['audio']
    
    voice_name = request.form.get('voice_name', 'default')
    sample_index = request.form.get('sample_index')
    if sample_index is not None:
        voice_dir = os.path.join(VOICE_SAMPLES_DIR, voice_name)
        os.makedirs(voice_dir, exist_ok=True)
        raw_path = os.path.join(voice_dir, f"raw_{sample_index}.wav")
        processed_path = os.path.join(voice_dir, f"{sample_index.zfill(3)}.wav")
    else:
        raw_path = os.path.join(VOICE_SAMPLES_DIR, f"{voice_name}_raw.wav")
        processed_path = os.path.join(VOICE_SAMPLES_DIR, f"{voice_name}.wav")
        
    
    audio_file.save(raw_path)
    
    try:
        info = preprocess_audio(raw_path, processed_path)
    except Exception as e:
        return jsonify({"error": f"Audio processing failed: {str(e)}"}), 500
    finally:
        if os.path.exists(raw_path):
            os.remove(raw_path)
            
    valid, reason = validate_sample(processed_path)
    
    if not valid:
        return jsonify({
            "warning": reason,
            "success": True,
            "message": f"Voice sample '{voice_name}' uploaded but quality may be poor.",
            "info": info,
        }), 200
    
    return jsonify({
        "success" : True,
        "message" : f"voice sample '{voice_name}', successfully uploaded",
        "voice_path" : processed_path,
        "info": info
    })
    
@app.route('/tts', methods=['POST'])
def text_to_speech():
    try:
        data = request.json
        text = data.get('text', '').strip()
        voice_name = data.get('voice_name', 'default')
        language = data.get('language', 'ja')
        
        temperature = float(data.get('temperature', 0.65))
        repetition_penalty = float(data.get('repetition_penalty', 2.0))
        top_k = int(data.get('top_k', 50))
        top_p = float(data.get('top_p', 0.85))
    
        if not text:
            return jsonify({"error" : "No text provided"}), 400
    
        speaker_wav = merge_voice_samples(voice_name)
        if speaker_wav is None:
            return jsonify({ "error": f"Voice sample '{voice_name}' not found" }), 404
    
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        output_filename = f"{voice_name}_voice_{timestamp}.wav"
        output_path = os.path.join(AUDIO_OUTPUT_DIR, output_filename)
    
        tts.tts_to_file(
            text=text,
            speaker_wav=speaker_wav,
            language=language,
            file_path=output_path,
            temperature=temperature,
            repetition_penalty=repetition_penalty,
            top_k=top_k,
            top_p=top_p,
            enable_text_splitting=True
        )
    
        return send_file(output_path, mimetype='audio/wav')
    
    except Exception as e:
        return jsonify({"error" : str(e)}), 500
    
@app.route('/list-voice', methods=['GET'])
def list_voice():
    voices = []
    if os.path.exists(VOICE_SAMPLES_DIR):
        for f in os.listdir(VOICE_SAMPLES_DIR):
            if f.endswith('.wav') and not f.endswith("_merged.wav"):
                voices.append(f.replace('.wav', ''))
        
        for d in os.listdir(VOICE_SAMPLES_DIR):
            dir_path = os.path.join(VOICE_SAMPLES_DIR, d)
            if os.path.isdir(dir_path):
                count = len(list(Path(dir_path).glob('*.wav')))
        
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