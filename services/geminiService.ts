import { GoogleGenAI, Type, Modality, LiveServerMessage, Blob } from '@google/genai';
import { encode, createBlob, playLiveAudioChunk } from '../utils/audioUtils';
import { Exercise, GrammarFeedback, GameType, Event, EventCategory, eventCategories } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const textModel = 'gemini-2.5-pro';
const ttsModel = 'gemini-2.5-flash-preview-tts';
const liveModel = 'gemini-2.5-flash-native-audio-preview-09-2025';
const imageModel = 'gemini-2.5-flash-image';

// --- Text-based API Calls ---

const generateContentWithContext = async (prompt: string, context: string) => {
  const fullPrompt = context ? `Based on the following context from a PDF document, please answer the user's request.
  
  --- CONTEXT ---
  ${context}
  --- END CONTEXT ---
  
  User Request: ${prompt}` : prompt;

  try {
    const response = await ai.models.generateContent({
        model: textModel,
        contents: fullPrompt
    });
    return response.text;
  } catch (error) {
    console.error('Gemini API Error:', error);
    throw new Error('Failed to get response from AI.');
  }
};

export const generateChatResponse = (message: string, context: string): Promise<string> => {
  return generateContentWithContext(message, context);
};

export const summarizeText = (context: string): Promise<string> => {
  const prompt = 'Provide a concise summary of the provided text.';
  return generateContentWithContext(prompt, context);
};

export const explainText = (selectedText: string, context: string): Promise<string> => {
  const prompt = `Explain the following selected text in simple terms: "${selectedText}"`;
  return generateContentWithContext(prompt, context);
};

export const generateQuiz = async (context: string): Promise<string> => {
  const prompt = `Create a short, multiple-choice quiz with 3 questions based on the provided text. For each question, provide 4 options (A, B, C, D) and indicate the correct answer at the end. Format the output clearly.`;
  return generateContentWithContext(prompt, context);
};

// --- Routine Generation (Multi-modal) ---

export const generateRoutine = async (prompt: string, imageBase64: string | null, mimeType: string | null): Promise<string> => {
    const systemInstruction = `You are an expert life coach and routine planner. Your task is to generate a personalized daily or weekly routine based on the user's input, which may include text and an image of their calendar or schedule.
    
The routine should be:
- **Actionable and specific:** Include times and durations for activities.
- **Balanced:** Cover the areas the user mentions (e.g., job, study, fitness, relaxation).
- **Helpful:** Include practical tips, such as for stress reduction or meal planning.
- **Well-formatted:** Use markdown (headings, lists, bold text) to make the routine easy to read and follow.
- **Adaptive:** Acknowledge the user's constraints (job shifts, exams) and build the schedule around them.
- **Friendly and encouraging:** Use a positive and supportive tone.
    
Analyze the provided text and image carefully to create the best possible schedule.`;

    const parts: ({ text: string; } | { inlineData: { mimeType: string; data: string; }; })[] = [
      { text: systemInstruction },
      { text: `User request: ${prompt}` }
    ];

    if (imageBase64 && mimeType) {
        parts.push({
            inlineData: {
                mimeType: mimeType,
                data: imageBase64,
            },
        });
    }

    try {
        const response = await ai.models.generateContent({
            model: textModel, // gemini-2.5-pro is great for multi-modal
            contents: { parts: parts }
        });
        return response.text;
    } catch (error) {
        console.error('Gemini Routine Generation Error:', error);
        throw new Error('Failed to generate routine from AI.');
    }
};

// --- Image Generation ---

const generateImageForPrompt = async (prompt: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: imageModel,
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    const candidate = response.candidates?.[0];
    
    // Step 1: Check for a valid candidate. If not, check for prompt-level blocking.
    if (!candidate) {
        const blockReason = response.promptFeedback?.blockReason;
        if (blockReason) {
            throw new Error(`Request was blocked: ${blockReason}. Please adjust your prompt.`);
        }
        throw new Error('AI response did not contain any candidates. The request may have been filtered or invalid.');
    }

    // Step 2: Try to find the image data in the candidate.
    const imagePart = candidate.content?.parts?.find(part => part.inlineData);
    if (imagePart?.inlineData?.data) {
      return imagePart.inlineData.data;
    }
    
    // Step 3: If there's a candidate but no image, check the reason why generation stopped.
    const finishReason = candidate.finishReason;
    if (finishReason && finishReason !== 'STOP') {
        throw new Error('The AI was unable to generate an image. This may be due to safety filters or other restrictions. Please try a different prompt.');
    }
    
    // Step 4: Check if the AI returned a text response instead.
    const textResponse = response.text?.trim();
    if (textResponse) {
      throw new Error(`AI returned text instead of an image: "${textResponse}"`);
    }

    // Step 5: Final fallback error.
    throw new Error('No image data was generated by the AI. The model may not have been able to fulfill the request.');

  } catch (error) {
    console.error('Gemini Image Generation Error:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to generate image from AI.');
  }
};


export const generateMindmap = (context: string): Promise<string> => {
  const prompt = `Create a visually appealing and clear mindmap diagram as a PNG image based on the following text. The mindmap should have a central topic and branching sub-topics. Use clean lines, legible text, and a professional, modern color scheme.

  --- TEXT TO VISUALIZE ---
  ${context}`;
  return generateImageForPrompt(prompt);
};

export const generateFlashcards = (context: string): Promise<string> => {
  const prompt = `Create a single PNG image that displays a set of 3-5 flashcards based on the following text. Each flashcard should have a clear 'front' (a question or key term) and a 'back' (the answer or definition). Arrange them neatly in a grid or a visually appealing layout suitable for studying. Use a clean, readable font.

  --- TEXT TO VISUALIZE ---
  ${context}`;
  return generateImageForPrompt(prompt);
};

// --- Drawing Assistant ---
export const generateImageFromDrawing = async (prompt: string, drawingBase64: string): Promise<string> => {
  const fullPrompt = `${prompt}. Keep the style of the drawing, but complete or enhance it based on the prompt.`;
  
  const imagePart = {
    inlineData: {
      mimeType: 'image/png',
      data: drawingBase64,
    },
  };
  
  try {
    const response = await ai.models.generateContent({
      model: imageModel, // 'gemini-2.5-flash-image'
      contents: { parts: [imagePart, { text: fullPrompt }] },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });
    
    const candidate = response.candidates?.[0];
    
    if (!candidate) {
        const blockReason = response.promptFeedback?.blockReason;
        if (blockReason) {
            throw new Error(`Request was blocked: ${blockReason}. Please adjust your prompt or drawing.`);
        }
        throw new Error('AI response did not contain any candidates. The request may have been filtered or invalid.');
    }

    const imagePartResponse = candidate.content?.parts?.find(part => part.inlineData);
    if (imagePartResponse?.inlineData?.data) {
      return imagePartResponse.inlineData.data;
    }
    
    const finishReason = candidate.finishReason;
    if (finishReason && finishReason !== 'STOP') {
        throw new Error('The AI was unable to process the image. This may be due to safety filters or other restrictions. Please try a different drawing or prompt.');
    }
    
    const textResponse = response.text?.trim();
    if (textResponse) {
      throw new Error(`AI returned text instead of an image: "${textResponse}"`);
    }

    throw new Error('No image data was generated by the AI. The model may not have been able to fulfill the request.');

  } catch (error) {
    console.error('Gemini Drawing Generation Error:', error);
    if (error instanceof Error) {
        throw error;
    }
    throw new Error('Failed to generate image from drawing with AI.');
  }
};



// --- Text-to-Speech (TTS) ---

export const generateSpeech = async (text: string, language: string): Promise<string> => {
  const prompt = `Please say the following in ${language}: ${text}`;
  try {
    const response = await ai.models.generateContent({
        model: ttsModel,
        contents: [{ parts: [{ text: prompt }] }],
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: 'Kore' },
                },
            },
        },
    });
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      throw new Error('No audio data received from TTS API.');
    }
    return base64Audio;
  } catch (error) {
    console.error('Gemini TTS Error:', error);
    throw new Error('Failed to generate speech.');
  }
};


// --- Live Voice Conversation ---

interface LiveSessionCallbacks {
  onUserTranscript: (text: string) => void;
  onAiTranscript: (text: string) => void;
  onTurnComplete: (userTranscript: string, aiTranscript: string) => void;
  onError: (error: ErrorEvent) => void;
  onClose: (event: CloseEvent) => void;
  getContext: () => string;
}

export const startVoiceConversation = async (callbacks: LiveSessionCallbacks) => {
    let micStream: MediaStream | null = null;
    let scriptProcessor: ScriptProcessorNode | null = null;
    let inputAudioContext: AudioContext | null = null;

    let currentInputTranscription = '';
    let currentOutputTranscription = '';

    const sessionPromise = ai.live.connect({
        model: liveModel,
        config: {
            responseModalities: [Modality.AUDIO],
            inputAudioTranscription: {},
            outputAudioTranscription: {},
            speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
            },
            systemInstruction: `You are an AI assistant helping a user with a PDF document. Use the provided context to answer their questions. The context will be updated as the user navigates. Current context: ${callbacks.getContext()}`,
        },
        callbacks: {
            onopen: async () => {
                try {
                    micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    // Fix: Cast window to `any` to allow access to vendor-prefixed webkitAudioContext for broader browser compatibility.
                    inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
                    const source = inputAudioContext.createMediaStreamSource(micStream);
                    scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
                    scriptProcessor.onaudioprocess = (event) => {
                        const inputData = event.inputBuffer.getChannelData(0);
                        const pcmBlob = createBlob(inputData);
                        sessionPromise.then((session) => {
                            session.sendRealtimeInput({ media: pcmBlob });
                        });
                    };
                    source.connect(scriptProcessor);
                    scriptProcessor.connect(inputAudioContext.destination);
                } catch (err) {
                    console.error('Microphone access denied or error:', err);
                    callbacks.onError(new ErrorEvent('microphone-error', { message: 'Microphone access denied.' }));
                }
            },
            onmessage: (message: LiveServerMessage) => {
                // Handle transcription
                if (message.serverContent?.inputTranscription) {
                    currentInputTranscription += message.serverContent.inputTranscription.text;
                    callbacks.onUserTranscript(currentInputTranscription);
                }
                if (message.serverContent?.outputTranscription) {
                    currentOutputTranscription += message.serverContent.outputTranscription.text;
                    callbacks.onAiTranscript(currentOutputTranscription);
                }
                if (message.serverContent?.turnComplete) {
                    callbacks.onTurnComplete(currentInputTranscription, currentOutputTranscription);
                    currentInputTranscription = '';
                    currentOutputTranscription = '';
                }

                // Handle audio playback
                const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                if (base64Audio) {
                    playLiveAudioChunk(base64Audio);
                }
            },
            onerror: callbacks.onError,
            onclose: (event: CloseEvent) => {
                cleanUp();
                callbacks.onClose(event);
            },
        },
    });

    const cleanUp = () => {
        if (scriptProcessor) {
            scriptProcessor.disconnect();
            scriptProcessor = null;
        }
        if (micStream) {
            micStream.getTracks().forEach(track => track.stop());
            micStream = null;
        }
        if (inputAudioContext && inputAudioContext.state !== 'closed') {
            inputAudioContext.close();
        }
    };
    
    const session = await sessionPromise;

    return {
        ...session,
        close: () => {
            cleanUp();
            session.close();
        }
    };
};

// --- Language Learning Game ---

export const generateLanguageExercise = async (
    language: string,
    gameType: GameType,
    topic: string,
    difficulty: string
): Promise<Omit<Exercise, 'id'>> => {
    
    let prompt = `Generate a language learning exercise for a learner.
    Target Language: ${language}
    Topic: ${topic}
    Difficulty: ${difficulty}
    Game Type: ${gameType}
    
    The response must be a JSON object that strictly follows the schema for the requested game type.
    Do not include any extra text or explanations outside of the JSON object.
    `;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let responseSchema: any;

    switch (gameType) {
        case 'sentence-scramble':
            prompt += `
            - "type" should be "sentence-scramble".
            - "prompt" should be an instruction in English, like "Unscramble the words to form a correct sentence in ${language}."
            - "words" should be an array of strings, representing the scrambled words of the solution sentence in ${language}.
            - "solution" should be the correct, unscrambled sentence in ${language}.
            `;
            responseSchema = {
                type: Type.OBJECT,
                properties: {
                    type: { type: Type.STRING },
                    prompt: { type: Type.STRING },
                    words: { type: Type.ARRAY, items: { type: Type.STRING } },
                    solution: { type: Type.STRING },
                },
                required: ['type', 'prompt', 'words', 'solution'],
            };
            break;
        case 'word-translation':
            prompt += `
            - "type" should be "word-translation".
            - "prompt" should be an instruction in English, like "Translate the following word to ${language}."
            - "wordToTranslate" should be a single word in English.
            - "options" should be an array of 4 strings in ${language}, one of which is the correct translation.
            - "solution" should be the correct translation from the options array.
            `;
            responseSchema = {
                type: Type.OBJECT,
                properties: {
                    type: { type: Type.STRING },
                    prompt: { type: Type.STRING },
                    wordToTranslate: { type: Type.STRING },
                    options: { type: Type.ARRAY, items: { type: Type.STRING } },
                    solution: { type: Type.STRING },
                },
                required: ['type', 'prompt', 'wordToTranslate', 'options', 'solution'],
            };
            break;
        case 'fill-in-the-blank':
            prompt += `
            - "type" should be "fill-in-the-blank".
            - "prompt" should be an instruction in English, like "Choose the correct word to fill in the blank."
            - "sentence" should be a sentence in ${language} with one word replaced by "___".
            - "options" should be an array of 4 strings in ${language}, one of which is the correct word for the blank.
            - "solution" should be the correct word from the options array.
            `;
            responseSchema = {
                type: Type.OBJECT,
                properties: {
                    type: { type: Type.STRING },
                    prompt: { type: Type.STRING },
                    sentence: { type: Type.STRING },
                    options: { type: Type.ARRAY, items: { type: Type.STRING } },
                    solution: { type: Type.STRING },
                },
                required: ['type', 'prompt', 'sentence', 'options', 'solution'],
            };
            break;
    }


  try {
    const response = await ai.models.generateContent({
      model: textModel,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: responseSchema,
      },
    });

    const jsonText = response.text.trim();
    return JSON.parse(jsonText) as Omit<Exercise, 'id'>;

  } catch (error) {
    console.error('Gemini Language Exercise Generation Error:', error);
    throw new Error('Failed to generate language exercise from AI.');
  }
};

export const checkGrammar = async (sentence: string, language: string): Promise<GrammarFeedback> => {
    const prompt = `Analyze the following sentence in ${language} for grammatical correctness.
    Sentence: "${sentence}"
    
    The response must be a JSON object that strictly follows the provided schema.
    - "isCorrect": boolean, true if the sentence is grammatically correct.
    - "correction": string, the corrected sentence if it's incorrect, or the original sentence if correct.
    - "explanation": string, a brief, simple explanation in English of the grammar rule or the error made. If correct, say "Looks great!".
    - Do not include any extra text or explanations outside of the JSON object.
    `;

    try {
        const response = await ai.models.generateContent({
            model: textModel,
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        isCorrect: { type: Type.BOOLEAN },
                        correction: { type: Type.STRING },
                        explanation: { type: Type.STRING },
                    },
                    required: ['isCorrect', 'correction', 'explanation'],
                },
            },
        });
        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as GrammarFeedback;

    } catch (error) {
        console.error('Gemini Grammar Check Error:', error);
        throw new Error('Failed to get grammar feedback from AI.');
    }
};

export const evaluatePronunciation = (userSpeech: string, targetSentence: string): Promise<string> => {
    const prompt = `A language learner is practicing pronunciation.
    Target sentence: "${targetSentence}"
    What the learner said (transcribed): "${userSpeech}"
    
    Compare the transcription to the target sentence. Provide brief, encouraging feedback in 1-2 sentences. Point out any significantly different words, but maintain a positive tone. If it's a good match, praise them.`;
    return generateContentWithContext(prompt, '');
};

// --- Event Discovery ---

export const generateEvents = async (
    location: string,
    preferences: string
): Promise<{ events: Event[], sources: any[] }> => {
    const today = new Date().toISOString().split('T')[0];
    const prompt = `You are an event aggregator for university students. Using your search tool, find a list of up to 15 diverse and real upcoming events happening in or near ${location}.
    The events should cover categories from this list: [${eventCategories.join(', ')}].
    The user has expressed interest in: "${preferences || 'everything'}".
    Based on these preferences, mark the 3-5 most relevant events by adding an 'isRecommended: true' field to them. All other events should not have this field or have it set to false.
    Ensure the 'date' for all events is in the near future (within the next 30 days) from today, ${today}. Format dates as "YYYY-MM-DD".
    The 'description' should be a concise paragraph (2-3 sentences).
    The 'id' should be a unique string you generate.
    Provide a plausible 'location' string (e.g., venue name, address).
    If a registration or info link is found, add it to 'registrationLink'.

    Your response must be ONLY a JSON array of objects, with no other text, markdown, or explanations. The JSON must be a parsable string. Each object in the array must conform to the following structure:
    {
      "id": "string",
      "title": "string",
      "description": "string",
      "category": "one of ${eventCategories.join(', ')}",
      "date": "string in YYYY-MM-DD format",
      "time": "string, e.g., '18:00 - 20:00'",
      "location": "string",
      "registrationLink": "string (optional)",
      "isRecommended": "boolean (optional)"
    }`;

    try {
        const response = await ai.models.generateContent({
            model: textModel,
            contents: prompt,
            config: {
                 tools: [{googleSearch: {}}],
            }
        });

        let jsonText = response.text.trim();
        
        // The API sometimes wraps the JSON in a markdown code block. Let's strip it.
        const match = jsonText.match(/```json\s*([\s\S]*?)\s*```/);
        if (match) {
            jsonText = match[1];
        }

        const events = JSON.parse(jsonText) as Event[];
        const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];

        return { events, sources };
    } catch (error) {
        console.error('Gemini Event Generation Error:', error);
        if (error instanceof SyntaxError) {
             throw new Error('Failed to parse event data from AI. The AI may have returned an invalid format.');
        }
        throw new Error('Failed to generate events from AI.');
    }
};