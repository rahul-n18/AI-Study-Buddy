import { Blob } from '@google/genai';

// --- Shared Audio Context ---
let outputAudioContext: AudioContext | null = null;
let ttsSourceNode: AudioBufferSourceNode | null = null;
let liveSources = new Set<AudioBufferSourceNode>();
let nextStartTime = 0;

function getOutputAudioContext(): AudioContext {
    if (!outputAudioContext || outputAudioContext.state === 'closed') {
        // Fix: Cast window to `any` to allow access to vendor-prefixed webkitAudioContext for broader browser compatibility.
        outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    return outputAudioContext;
}

// --- Encoding/Decoding ---

export function encode(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodePcmData(
  data: Uint8Array,
  ctx: AudioContext
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / 1; // Mono channel
  const buffer = ctx.createBuffer(1, frameCount, ctx.sampleRate);
  const channelData = buffer.getChannelData(0);
  for (let i = 0; i < frameCount; i++) {
    channelData[i] = dataInt16[i] / 32768.0;
  }
  return buffer;
}


export function createBlob(data: Float32Array): Blob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}


// --- TTS Playback Management ---
import { generateSpeech } from '../services/geminiService';

export const generateAndPlayTts = async (text: string, language: string, playbackRate: number, onEnded: () => void): Promise<void> => {
  stopTts(); // Stop any currently playing TTS
  const base64Audio = await generateSpeech(text, language);
  const audioBytes = decode(base64Audio);
  const audioContext = getOutputAudioContext();
  const audioBuffer = await decodePcmData(audioBytes, audioContext);
  
  ttsSourceNode = audioContext.createBufferSource();
  ttsSourceNode.buffer = audioBuffer;
  ttsSourceNode.playbackRate.value = playbackRate;
  ttsSourceNode.connect(audioContext.destination);
  ttsSourceNode.onended = () => {
    onEnded();
    ttsSourceNode = null;
  };
  ttsSourceNode.start();
};

export const stopTts = () => {
  if (ttsSourceNode) {
    ttsSourceNode.stop();
    ttsSourceNode = null;
  }
};


// --- Live Audio Playback (for future integration if needed) ---
// Note: This part is illustrative. The main App doesn't call this directly yet,
// as the live conversation audio is played immediately.
// It can be expanded for more complex queueing if necessary.

export const playLiveAudioChunk = async (base64Audio: string) => {
    const audioContext = getOutputAudioContext();
    const audioBytes = decode(base64Audio);
    const audioBuffer = await decodePcmData(audioBytes, audioContext);

    nextStartTime = Math.max(nextStartTime, audioContext.currentTime);
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);
    source.addEventListener('ended', () => {
        liveSources.delete(source);
    });

    source.start(nextStartTime);
    nextStartTime += audioBuffer.duration;
    liveSources.add(source);
};

export const stopAllLiveAudio = () => {
    for (const source of liveSources.values()) {
        source.stop();
    }
    liveSources.clear();
    nextStartTime = 0;
};