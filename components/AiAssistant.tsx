import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Message, VoiceSessionStatus } from '../types';
import * as geminiService from '../services/geminiService';
import { generateAndPlayTts, stopTts } from '../utils/audioUtils';
import {
  SendIcon, SparklesIcon, MicIcon, StopCircleIcon, BotIcon, UserIcon, LoaderIcon, BookOpenIcon, HelpCircleIcon, ListChecksIcon, PlayIcon, PauseIcon, MessageCircleIcon, NotebookIcon, DownloadIcon, TrashIcon, MindmapIcon, FlashcardIcon
} from './Icons';
import ReactMarkdown from 'react-markdown';

interface AiAssistantProps {
  currentPageText: string;
  selectedText: string;
  notes: string;
  onNotesChange: (newNotes: string) => void;
}

type ActiveTab = 'chat' | 'notes';

// Quick action button component
const ActionButton: React.FC<{
  icon: React.ReactNode;
  text: string;
  onClick: () => void;
  disabled?: boolean;
}> = ({ icon, text, onClick, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed text-gray-700 dark:text-white font-semibold py-2 px-3 rounded-lg text-sm inline-flex items-center justify-center transition-colors"
  >
    {icon}
    <span className="ml-2">{text}</span>
  </button>
);


export const AiAssistant: React.FC<AiAssistantProps> = ({ currentPageText, selectedText, notes, onNotesChange }) => {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'system', content: 'Hello! I am your AI assistant. How can I help you with this document?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState<VoiceSessionStatus>('idle');
  const [userTranscript, setUserTranscript] = useState('');
  const [aiTranscript, setAiTranscript] = useState('');
  const [ttsPlaying, setTtsPlaying] = useState(false);
  const [currentTtsMessageId, setCurrentTtsMessageId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('chat');

  const voiceSessionRef = useRef<Awaited<ReturnType<typeof geminiService.startVoiceConversation>> | null>(null);
  const messageEndRef = useRef<HTMLDivElement>(null);
  const contextRef = useRef({ currentPageText, selectedText });

  useEffect(() => {
    contextRef.current = { currentPageText, selectedText };
  }, [currentPageText, selectedText]);

  useEffect(() => {
    if (activeTab === 'chat') {
        messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeTab]);

  const addMessage = (role: 'user' | 'model' | 'system', content: string) => {
    setMessages(prev => [...prev, { id: Date.now().toString(), role, content }]);
  };

  const handleAction = async (action: (prompt: string, context: string) => Promise<string>, prompt: string, context: string) => {
    setIsLoading(true);
    try {
      const response = await action(prompt, context);
      addMessage('model', response);
    } catch (error) {
      console.error(error);
      addMessage('model', 'Sorry, I encountered an error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;
    const userInput = input;
    addMessage('user', userInput);
    setInput('');
    handleAction(geminiService.generateChatResponse, userInput, currentPageText);
  };

  const handleSummarize = () => {
    if (!currentPageText) return;
    addMessage('user', 'Summarize this page');
    handleAction(geminiService.summarizeText, '', currentPageText);
  };

  const handleExplain = () => {
    if (!selectedText) {
      alert("Please select some text on the PDF to explain.");
      return;
    };
    addMessage('user', `Explain this: "${selectedText}"`);
    handleAction(geminiService.explainText, selectedText, currentPageText);
  };

  const handleQuiz = () => {
    if (!currentPageText) return;
    addMessage('user', 'Quiz me on this page');
    handleAction(geminiService.generateQuiz, '', currentPageText);
  };
  
  const handleMindmap = async () => {
    if (!currentPageText) return;
    addMessage('user', 'Generate a mindmap for this page');
    setIsLoading(true);
    try {
      const base64Image = await geminiService.generateMindmap(currentPageText);
      const markdownImage = `![Mindmap](data:image/png;base64,${base64Image})`;
      addMessage('model', markdownImage);
    } catch (error) {
      console.error('Mindmap Generation Error:', error);
      addMessage('model', 'Sorry, I encountered an error while generating the mindmap image. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFlashcards = async () => {
    if (!currentPageText) return;
    addMessage('user', 'Generate flashcards for this page');
    setIsLoading(true);
    try {
      const base64Image = await geminiService.generateFlashcards(currentPageText);
      const markdownImage = `![Flashcards](data:image/png;base64,${base64Image})`;
      addMessage('model', markdownImage);
    } catch (error) {
      console.error('Flashcard Generation Error:', error);
      addMessage('model', 'Sorry, I encountered an error while generating flashcard images. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlayPauseTts = (message: Message) => {
    if (ttsPlaying && currentTtsMessageId === message.id) {
        stopTts();
        setTtsPlaying(false);
        setCurrentTtsMessageId(null);
    } else {
        stopTts(); // Stop any previous TTS
        setCurrentTtsMessageId(message.id);
        setTtsPlaying(true);
        // FIX: Added 'English' as the language argument to generateAndPlayTts.
        generateAndPlayTts(message.content, 'English', 1.0, () => {
            setTtsPlaying(false);
            setCurrentTtsMessageId(null);
        }).catch(err => {
            console.error("TTS Error:", err);
            setTtsPlaying(false);
            setCurrentTtsMessageId(null);
        });
    }
  };

  const handleDownloadImage = (content: string, fileName: string) => {
    const base64Data = content.split('base64,')[1]?.slice(0, -1);
    if (!base64Data) return;

    try {
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/png' });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download image:", error);
      addMessage('system', 'Sorry, there was an error downloading the image.');
    }
  };


  const handleDownloadNotes = () => {
    const blob = new Blob([notes], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'notes.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleClearNotes = () => {
    if (window.confirm('Are you sure you want to clear all notes? This action cannot be undone.')) {
        onNotesChange('');
    }
  };


  // Voice Conversation Logic
  const handleToggleVoice = useCallback(async () => {
    if (voiceStatus === 'active') {
      voiceSessionRef.current?.close();
      voiceSessionRef.current = null;
      setVoiceStatus('idle');
      setUserTranscript('');
      setAiTranscript('');
      return;
    }

    setVoiceStatus('connecting');
    try {
      const session = await geminiService.startVoiceConversation({
        onUserTranscript: (text) => setUserTranscript(text),
        onAiTranscript: (text) => setAiTranscript(text),
        onTurnComplete: (userTranscript, aiTranscript) => {
          if(userTranscript.trim()) addMessage('user', userTranscript);
          if(aiTranscript.trim()) addMessage('model', aiTranscript);
          setUserTranscript('');
          setAiTranscript('');
        },
        onError: (err) => {
          console.error('Voice session error:', err);
          setVoiceStatus('error');
          addMessage('system', 'Voice connection error. Please try again.');
        },
        onClose: () => {
          setVoiceStatus('idle');
        },
        getContext: () => contextRef.current.currentPageText,
      });
      voiceSessionRef.current = session;
      setVoiceStatus('active');
    } catch (error) {
      console.error('Failed to start voice session:', error);
      setVoiceStatus('error');
      addMessage('system', 'Could not start voice session. Please check microphone permissions.');
    }
  }, [voiceStatus]);


  return (
    <div className="w-full h-full flex flex-col bg-gray-100 dark:bg-gray-800">
      {/* Header & Tabs */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
                <SparklesIcon className="w-6 h-6 text-cyan-500 dark:text-cyan-400" />
                <h2 className="text-xl font-bold ml-2">AI Assistant</h2>
            </div>
        </div>
        <div className="flex border-b border-gray-200 dark:border-gray-700">
            <button 
                onClick={() => setActiveTab('chat')}
                className={`flex items-center font-semibold py-2 px-4 -mb-px border-b-2 transition-colors ${activeTab === 'chat' ? 'border-cyan-500 text-cyan-500 dark:border-cyan-400 dark:text-cyan-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white'}`}
            >
                <MessageCircleIcon className="w-5 h-5 mr-2" />
                AI Chat
            </button>
            <button
                onClick={() => setActiveTab('notes')}
                className={`flex items-center font-semibold py-2 px-4 -mb-px border-b-2 transition-colors ${activeTab === 'notes' ? 'border-cyan-500 text-cyan-500 dark:border-cyan-400 dark:text-cyan-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white'}`}
            >
                <NotebookIcon className="w-5 h-5 mr-2" />
                Notes
            </button>
        </div>
      </div>
      
      {/* Content Area */}
      {activeTab === 'chat' ? (
        <>
            {/* Messages */}
            <div className="flex-1 p-4 overflow-y-auto">
                {messages.map((msg) => {
                    const isImage = msg.role === 'model' && msg.content.startsWith('![');
                    const fileName = msg.content.includes('![Mindmap]') ? 'mindmap.png' : 'flashcards.png';

                    return (
                        <div key={msg.id} className={`flex items-start mb-4 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                            {msg.role !== 'user' && (
                                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mr-3 flex-shrink-0">
                                <BotIcon className="w-5 h-5" />
                                </div>
                            )}
                            <div className={`p-3 rounded-lg max-w-lg ${msg.role === 'user' ? 'bg-cyan-500 text-white' : 'bg-white dark:bg-gray-700'}`}>
                                <div className={`prose prose-sm max-w-none ${msg.role !== 'user' ? 'dark:prose-invert' : ''}`}>
                                    {msg.role === 'system' ? (
                                    <p className='italic'>{msg.content}</p>
                                    ) : (
                                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                                    )}
                                </div>
                                {msg.role === 'model' && !isImage && (
                                    <button onClick={() => handlePlayPauseTts(msg)} className="mt-2 text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors">
                                        {ttsPlaying && currentTtsMessageId === msg.id ? <PauseIcon className="w-4 h-4" /> : <PlayIcon className="w-4 h-4" />}
                                    </button>
                                )}
                                {isImage && (
                                    <button onClick={() => handleDownloadImage(msg.content, fileName)} className="mt-2 text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors flex items-center text-xs font-semibold">
                                        <DownloadIcon className="w-4 h-4 mr-1" />
                                        <span>Download</span>
                                    </button>
                                )}
                            </div>
                            {msg.role === 'user' && (
                                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center ml-3 flex-shrink-0">
                                <UserIcon className="w-5 h-5" />
                                </div>
                            )}
                        </div>
                    );
                })}
                {isLoading && (
                <div className="flex items-start mb-4">
                    <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mr-3">
                    <BotIcon className="w-5 h-5" />
                    </div>
                    <div className="p-3 rounded-lg bg-white dark:bg-gray-700">
                    <LoaderIcon className="w-6 h-6" />
                    </div>
                </div>
                )}
                <div ref={messageEndRef} />
            </div>

            {/* Voice Transcript Display */}
            {voiceStatus === 'active' && (
                <div className="flex-shrink-0 p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                <p className="text-sm text-gray-500 dark:text-gray-400"><strong>You:</strong> {userTranscript}</p>
                <p className="text-sm text-cyan-600 dark:text-cyan-300"><strong>AI:</strong> {aiTranscript}</p>
                </div>
            )}

            {/* Input & Actions */}
            <div className="flex-shrink-0 p-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex flex-wrap gap-2 mb-3">
                <ActionButton icon={<BookOpenIcon className="w-4 h-4" />} text="Summarize" onClick={handleSummarize} disabled={isLoading || !currentPageText} />
                <ActionButton icon={<HelpCircleIcon className="w-4 h-4" />} text="Explain" onClick={handleExplain} disabled={isLoading || !selectedText} />
                <ActionButton icon={<ListChecksIcon className="w-4 h-4" />} text="Quiz Me" onClick={handleQuiz} disabled={isLoading || !currentPageText} />
                <ActionButton icon={<MindmapIcon className="w-4 h-4" />} text="Mindmap" onClick={handleMindmap} disabled={isLoading || !currentPageText} />
                <ActionButton icon={<FlashcardIcon className="w-4 h-4" />} text="Flashcards" onClick={handleFlashcards} disabled={isLoading || !currentPageText} />
                </div>
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask a question about the document..."
                    className="flex-1 w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    disabled={isLoading || voiceStatus === 'active'}
                />
                <button type="submit" className="bg-cyan-500 hover:bg-cyan-600 text-white p-2 rounded-full disabled:bg-gray-400 dark:disabled:bg-gray-600 transition-colors" disabled={isLoading || !input.trim() || voiceStatus === 'active'}>
                    <SendIcon className="w-5 h-5" />
                </button>
                <button type="button" onClick={handleToggleVoice} className={`p-2 rounded-full transition-colors ${voiceStatus === 'active' ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'}`} disabled={isLoading && voiceStatus !== 'active'}>
                    {voiceStatus === 'active' ? <StopCircleIcon className="w-5 h-5 text-white" /> : <MicIcon className="w-5 h-5" />}
                </button>
                </form>
            </div>
        </>
      ) : (
        <div className="flex-1 flex flex-col p-4">
            <textarea
                value={notes}
                onChange={(e) => onNotesChange(e.target.value)}
                placeholder="Start taking notes here..."
                className="flex-1 w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg p-4 focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
            />
            <div className="flex gap-2 mt-4">
                <button onClick={handleDownloadNotes} className="flex items-center justify-center w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded-lg" disabled={!notes}>
                    <DownloadIcon className="w-5 h-5 mr-2" />
                    Download Notes
                </button>
                <button onClick={handleClearNotes} className="flex items-center justify-center w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg" disabled={!notes}>
                    <TrashIcon className="w-5 h-5 mr-2" />
                    Clear Notes
                </button>
            </div>
        </div>
      )}
    </div>
  );
};