import React, { useState, useEffect, useRef } from 'react';
import * as geminiService from '../services/geminiService';
// FIX: Imported GameType from the central types file.
import { Exercise, GrammarFeedback, SentenceScrambleExercise, WordTranslationExercise, FillInTheBlankExercise, GameType } from '../types';
import { generateAndPlayTts, stopTts } from '../utils/audioUtils';
import { DraggableWord } from './DraggableWord';
import { SparklesIcon, LoaderIcon, ChevronRightIcon, PlayIcon, MicIcon, StopCircleIcon } from './Icons';

// Let TypeScript know about the p5 instance from the global scope
declare const p5: any;

type GameState = 'setup' | 'loading' | 'playing' | 'feedback';
// FIX: Removed local GameType definition. It's now imported from types.ts.

const languageMap: Record<string, string> = {
    'English': 'en-US',
    'Spanish': 'es-ES',
    'French': 'fr-FR',
    'German': 'de-DE',
    'Japanese': 'ja-JP',
};

const SetupScreen: React.FC<{ onStart: (language: string, gameType: GameType, topic: string, difficulty: string) => void }> = ({ onStart }) => {
    const [language, setLanguage] = useState('Spanish');
    const [gameType, setGameType] = useState<GameType>('sentence-scramble');
    const [topic, setTopic] = useState('Travel');
    const [difficulty, setDifficulty] = useState('Beginner');

    const topics = ['Travel', 'Food', 'Daily Life', 'Work'];
    const difficulties = ['Beginner', 'Intermediate', 'Advanced'];
    const gameTypes: {id: GameType, name: string}[] = [
        { id: 'sentence-scramble', name: 'Sentence Scramble'},
        { id: 'word-translation', name: 'Word Translation'},
        { id: 'fill-in-the-blank', name: 'Fill-in-the-Blank'}
    ];


    return (
        <div className="w-full h-full flex flex-col items-center justify-center text-center p-8">
            <SparklesIcon className="w-16 h-16 text-orange-500 dark:text-orange-400 mb-4" />
            <h2 className="text-4xl font-bold mb-2">Language Learning Game</h2>
            <p className="text-lg text-gray-500 dark:text-gray-400 mb-8">Choose your settings to start an interactive lesson.</p>

            <div className="space-y-6 w-full max-w-sm">
                <div>
                    <label className="block text-left font-bold mb-2 text-gray-600 dark:text-gray-300">Language</label>
                    <select value={language} onChange={e => setLanguage(e.target.value)} className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-lg border-2 border-gray-300 dark:border-gray-600 focus:border-orange-500 focus:outline-none">
                        {Object.keys(languageMap).map(lang => <option key={lang} value={lang}>{lang}</option>)}
                    </select>
                </div>
                 <div>
                    <label className="block text-left font-bold mb-2 text-gray-600 dark:text-gray-300">Game Type</label>
                    <select value={gameType} onChange={e => setGameType(e.target.value as GameType)} className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-lg border-2 border-gray-300 dark:border-gray-600 focus:border-orange-500 focus:outline-none">
                        {gameTypes.map(gt => <option key={gt.id} value={gt.id}>{gt.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-left font-bold mb-2 text-gray-600 dark:text-gray-300">Topic</label>
                    <select value={topic} onChange={e => setTopic(e.target.value)} className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-lg border-2 border-gray-300 dark:border-gray-600 focus:border-orange-500 focus:outline-none">
                        {topics.map(t => <option key={t}>{t}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-left font-bold mb-2 text-gray-600 dark:text-gray-300">Difficulty</label>
                    <select value={difficulty} onChange={e => setDifficulty(e.target.value)} className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-lg border-2 border-gray-300 dark:border-gray-600 focus:border-orange-500 focus:outline-none">
                        {difficulties.map(d => <option key={d}>{d}</option>)}
                    </select>
                </div>
                <button onClick={() => onStart(language, gameType, topic, difficulty)} className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-4 rounded-lg text-lg transition-transform transform hover:scale-105">
                    Start Learning
                </button>
            </div>
        </div>
    );
};

export const LanguageGame: React.FC<{ theme: 'light' | 'dark' }> = ({ theme }) => {
    const [gameState, setGameState] = useState<GameState>('setup');
    const [exercise, setExercise] = useState<Exercise | null>(null);
    const [feedback, setFeedback] = useState<GrammarFeedback | null>(null);
    const [pronunciationFeedback, setPronunciationFeedback] = useState<string | null>(null);
    const [isListening, setIsListening] = useState(false);
    
    // Settings state
    const [language, setLanguage] = useState('');
    const [gameType, setGameType] = useState<GameType>('sentence-scramble');
    const [topic, setTopic] = useState('');
    const [difficulty, setDifficulty] = useState('');
    
    const [userAnswer, setUserAnswer] = useState('');

    const sketchRef = useRef<HTMLDivElement>(null);
    const p5InstanceRef = useRef<any>(null);
    const recognitionRef = useRef<any>(null);

    const handleStartGame = async (lang: string, gType: GameType, t: string, diff: string) => {
        setLanguage(lang);
        setGameType(gType);
        setTopic(t);
        setDifficulty(diff);
        setGameState('loading');
        setFeedback(null);
        setPronunciationFeedback(null);
        setUserAnswer('');
        try {
            const newExercise = await geminiService.generateLanguageExercise(lang, gType, t, diff);
            // FIX: Cast the created object to Exercise to satisfy TypeScript's discriminated union type checking.
            setExercise({ ...newExercise, id: Date.now().toString() } as Exercise);
            setGameState('playing');
        } catch (error) {
            console.error(error);
            setGameState('setup'); // Go back to setup on error
        }
    };

    const handleCheckAnswer = async (answer: string) => {
        if (!answer || !exercise) return;
        
        // For multiple choice, we just check for equality
        if(exercise.type === 'word-translation' || exercise.type === 'fill-in-the-blank') {
            const isCorrect = answer === exercise.solution;
            setFeedback({
                isCorrect,
                correction: exercise.solution,
                explanation: isCorrect ? 'Great job!' : `The correct answer is "${exercise.solution}".`
            });
            setGameState('feedback');
            return;
        }

        // For sentence scramble, we use AI grammar check
        setGameState('loading');
        try {
            const grammarFeedback = await geminiService.checkGrammar(answer, language);
            setFeedback(grammarFeedback);
        } catch (error) {
            console.error(error);
        } finally {
            setGameState('feedback');
        }
    };
    
    const handleNextExercise = () => {
        handleStartGame(language, gameType, topic, difficulty);
    };

    const handleListen = () => {
        if (exercise) {
            stopTts();
            generateAndPlayTts(exercise.solution, language, 1.0, () => {}).catch(console.error);
        }
    };
    
    // Pronunciation Handling
    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.lang = languageMap[language] || 'en-US';
            recognitionRef.current.onstart = () => setIsListening(true);
            recognitionRef.current.onend = () => setIsListening(false);
            recognitionRef.current.onerror = (event: any) => {
                console.error('Speech recognition error:', event.error);
                setIsListening(false);
            };
            recognitionRef.current.onresult = async (event: any) => {
                const transcript = event.results[0][0].transcript;
                if (exercise) {
                    setGameState('loading');
                    try {
                        const pFeedback = await geminiService.evaluatePronunciation(transcript, exercise.solution);
                        setPronunciationFeedback(pFeedback);
                    } catch (e) {
                        console.error(e);
                        setPronunciationFeedback("Sorry, I couldn't evaluate your pronunciation.");
                    } finally {
                        setGameState('feedback');
                    }
                }
            };
        }
    }, [exercise, language]);

    const handleTogglePronunciation = () => {
        if (isListening) {
            recognitionRef.current?.stop();
        } else {
            setFeedback(null);
            setPronunciationFeedback(null);
            recognitionRef.current?.start();
        }
    };

    const handleOptionClick = (option: string) => {
        setUserAnswer(option);
        handleCheckAnswer(option);
    };


    // p5.js Sketch Logic for Sentence Scramble
    useEffect(() => {
        if (gameState === 'playing' && sketchRef.current && exercise?.type === 'sentence-scramble') {
            const currentExercise = exercise as SentenceScrambleExercise;
            const sketch = (p: any) => {
                let words: DraggableWord[] = [];
                let dropZone: { x: number, y: number, w: number, h: number };
                let sentenceWords: (DraggableWord | null)[] = [];
                let draggedWord: DraggableWord | null = null;
    
                p.setup = () => {
                    const canvasWidth = sketchRef.current?.clientWidth || 600;
                    p.createCanvas(canvasWidth, 300);
                    let xOffset = 20;
                    currentExercise.words.forEach(wordText => {
                        const word = new DraggableWord(p, wordText, xOffset, 50, theme);
                        words.push(word);
                        xOffset += word.w + 10;
                    });
                    dropZone = { x: 20, y: 150, w: canvasWidth - 40, h: 60 };
                    sentenceWords = new Array(currentExercise.words.length).fill(null);
                };
    
                p.draw = () => {
                    if (theme === 'dark') {
                        p.background(17, 24, 39); // gray-900
                        p.stroke(55, 65, 81); // gray-700
                        p.fill(31, 41, 55); // gray-800
                    } else {
                        p.background(249, 250, 251); // gray-50
                        p.stroke(209, 213, 219); // gray-300
                        p.fill(243, 244, 246); // gray-100
                    }
                    p.strokeWeight(2);
                    p.rect(dropZone.x, dropZone.y, dropZone.w, dropZone.h, 8);
                    
                    words.forEach(word => {
                        if (word !== draggedWord) word.update();
                        word.display();
                    });
                    if (draggedWord) {
                        draggedWord.update();
                        draggedWord.display();
                    }
                };
    
                p.mousePressed = () => {
                    for (let i = words.length - 1; i >= 0; i--) {
                        if (words[i].isMouseOver()) {
                            draggedWord = words[i];
                            words.splice(i, 1);
                            words.push(draggedWord);
                            draggedWord.onPressed();
                            break;
                        }
                    }
                };
    
                p.mouseReleased = () => {
                    if (draggedWord) {
                        draggedWord.onReleased();
                        
                        if (draggedWord.y > dropZone.y - 20 && draggedWord.y < dropZone.y + dropZone.h) {
                            let snapped = false;
                            let currentX = dropZone.x + 10;
                            for (let i = 0; i < sentenceWords.length; i++) {
                                const placeholderWidth = sentenceWords[i] ? sentenceWords[i]!.w + 10 : 80;
                                if (!snapped && draggedWord.x < currentX + placeholderWidth / 2) {
                                    sentenceWords.splice(i, 0, draggedWord);
                                    snapped = true;
                                }
                                currentX += placeholderWidth;
                            }
                            if(!snapped) sentenceWords.push(draggedWord);

                        } else {
                            const indexInSentence = sentenceWords.indexOf(draggedWord);
                            if (indexInSentence > -1) {
                                sentenceWords.splice(indexInSentence, 1);
                            }
                        }

                        let xPos = dropZone.x + 10;
                        sentenceWords = sentenceWords.filter(w => w !== null);
                        sentenceWords.forEach(word => {
                           if(word) {
                                word.snapTo(xPos, dropZone.y + 10);
                                xPos += word.w + 10;
                           }
                        });


                        const currentSentence = sentenceWords.map(w => w?.text).join(' ').trim();
                        setUserAnswer(currentSentence);
                        draggedWord = null;
                    }
                };
            };
            
            p5InstanceRef.current = new p5(sketch, sketchRef.current);
            return () => {
                p5InstanceRef.current?.remove();
            };
        }
    }, [gameState, exercise, theme]);

    const renderExercise = () => {
        if (!exercise) return null;
        switch (exercise.type) {
            case 'sentence-scramble':
                return <div ref={sketchRef} className="w-full h-[300px] bg-gray-50 dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-lg mb-4"></div>;
            case 'word-translation':
                return (
                    <div className="w-full h-[300px] flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg mb-4 p-4">
                        <p className="text-lg text-gray-500 dark:text-gray-400">{exercise.prompt}</p>
                        <p className="text-4xl font-bold my-4 text-gray-900 dark:text-white">{(exercise as WordTranslationExercise).wordToTranslate}</p>
                        <div className="grid grid-cols-2 gap-4 w-full max-w-md">
                            {(exercise as WordTranslationExercise).options.map(opt => <button key={opt} onClick={() => handleOptionClick(opt)} className="bg-white dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-semibold py-3 px-4 rounded-lg text-lg transition-colors">{opt}</button>)}
                        </div>
                    </div>
                );
            case 'fill-in-the-blank':
                return (
                     <div className="w-full h-[300px] flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg mb-4 p-4 text-center">
                        <p className="text-lg text-gray-500 dark:text-gray-400">{exercise.prompt}</p>
                        <p className="text-2xl font-bold my-4 text-gray-900 dark:text-white">{(exercise as FillInTheBlankExercise).sentence.replace('___', '______')}</p>
                        <div className="grid grid-cols-2 gap-4 w-full max-w-md">
                            {(exercise as FillInTheBlankExercise).options.map(opt => <button key={opt} onClick={() => handleOptionClick(opt)} className="bg-white dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-semibold py-3 px-4 rounded-lg text-lg transition-colors">{opt}</button>)}
                        </div>
                    </div>
                );
            default: return null;
        }
    };

    if (gameState === 'setup') {
        return <SetupScreen onStart={handleStartGame} />;
    }

    return (
        <div className="w-full h-full flex flex-col items-center justify-center p-4 md:p-8 bg-gray-50 dark:bg-gray-900">
            {gameState === 'loading' && <LoaderIcon className="w-16 h-16 text-orange-500 dark:text-orange-400" />}
            
            {(gameState === 'playing' || gameState === 'feedback') && exercise && (
                <div className="w-full max-w-4xl flex-1 flex flex-col">
                    <div className="text-center mb-4">
                        <h3 className="text-2xl font-bold text-orange-500 dark:text-orange-400">{gameType.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</h3>
                        <p className="text-gray-600 dark:text-gray-300">{exercise.prompt}</p>
                    </div>

                    {renderExercise()}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                            <h4 className="font-bold text-lg mb-2">Controls</h4>
                            <div className="bg-gray-100 dark:bg-gray-900 p-3 rounded-md min-h-[50px] text-gray-800 dark:text-gray-200 mb-4">
                                {userAnswer ? `Your answer: ${userAnswer}` : <span className="text-gray-400 dark:text-gray-500">Your answer will appear here...</span>}
                            </div>
                            <div className="flex gap-2">
                                {exercise.type === 'sentence-scramble' && (
                                    <button onClick={() => handleCheckAnswer(userAnswer)} disabled={!userAnswer} className="flex-1 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 dark:disabled:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg">
                                        Check Answer
                                    </button>
                                )}
                                <button onClick={handleListen} className="p-3 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 font-bold rounded-lg" aria-label="Listen to correct pronunciation">
                                    <PlayIcon className="w-5 h-5" />
                                </button>
                                <button onClick={handleTogglePronunciation} className={`p-3 rounded-lg ${isListening ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500'}`} aria-label="Practice speaking">
                                    {isListening ? <StopCircleIcon className="w-5 h-5 text-white" /> : <MicIcon className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                            <h4 className="font-bold text-lg mb-2">AI Feedback</h4>
                            <div className="bg-gray-100 dark:bg-gray-900 p-3 rounded-md min-h-[94px]">
                                {feedback && (
                                    <div className={feedback.isCorrect ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}>
                                        <p className="font-bold">{feedback.isCorrect ? "Correct!" : "Almost there!"}</p>
                                        <p>{feedback.explanation}</p>
                                        {!feedback.isCorrect && <p className="mt-1"><span className="font-semibold">Suggestion:</span> {feedback.correction}</p>}
                                    </div>
                                )}
                                {pronunciationFeedback && (
                                    <div className="text-cyan-600 dark:text-cyan-300">
                                        <p className="font-bold">Pronunciation Feedback:</p>
                                        <p>{pronunciationFeedback}</p>
                                    </div>
                                )}
                                {!feedback && !pronunciationFeedback && <p className="text-gray-400 dark:text-gray-500">Submit your answer or practice speaking to get feedback.</p>}
                            </div>
                            {(gameState === 'feedback') &&
                                <button onClick={handleNextExercise} className="w-full mt-4 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 font-bold py-2 px-4 rounded-lg flex items-center justify-center">
                                    Next Exercise <ChevronRightIcon className="w-5 h-5 ml-1" />
                                </button>
                            }
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};