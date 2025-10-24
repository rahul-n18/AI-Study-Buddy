import React, { useState, useRef, useEffect } from 'react';
import { Message } from '../types';
import { generateRoutine } from '../services/geminiService';
import { BotIcon, UserIcon, LoaderIcon, SendIcon, ImageIcon, XIcon, SparklesIcon } from './Icons';
import ReactMarkdown from 'react-markdown';

// Helper to convert file to base64
const fileToBase64 = (file: File): Promise<{ base64: string; mimeType: string; dataUrl: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const mimeType = dataUrl.split(',')[0].split(':')[1].split(';')[0];
      const base64 = dataUrl.split(',')[1];
      resolve({ base64, mimeType, dataUrl });
    };
    reader.onerror = (error) => reject(error);
  });
};

export const RoutineMaker: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init',
      role: 'system',
      content: "Hello! I'm here to help you build the perfect routine. Describe your goals, and feel free to upload a picture of your calendar or schedule to get started.",
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [image, setImage] = useState<{ base64: string; mimeType: string; dataUrl: string } | null>(null);

  const messageEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const imageData = await fileToBase64(file);
        setImage(imageData);
      } catch (error) {
        console.error("Error converting file to base64:", error);
      }
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && !image) || isLoading) return;

    const userContent = `${input}${image ? '\n[Image Attached]' : ''}`;
    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: userContent };
    
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await generateRoutine(input, image?.base64 ?? null, image?.mimeType ?? null);
      setMessages(prev => [...prev, { id: Date.now().toString() + 'm', role: 'model', content: response }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { id: Date.now().toString() + 'e', role: 'model', content: 'Sorry, I encountered an error. Please try again.' }]);
    } finally {
      setInput('');
      setImage(null);
      if (fileInputRef.current) fileInputRef.current.value = ''; // Reset file input
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center">
            <SparklesIcon className="w-6 h-6 text-rose-500 dark:text-rose-400" />
            <h2 className="text-xl font-bold ml-2">AI Routine Maker</h2>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex items-start mb-4 ${msg.role === 'user' ? 'justify-end' : ''}`}>
            {msg.role !== 'user' && (
              <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mr-3 flex-shrink-0">
                <BotIcon className="w-5 h-5" />
              </div>
            )}
            <div className={`p-3 rounded-lg max-w-3xl ${msg.role === 'user' ? 'bg-rose-500 text-white' : 'bg-white dark:bg-gray-700'}`}>
                <div className={`prose prose-sm max-w-none ${msg.role !== 'user' ? 'dark:prose-invert' : ''}`}>
                    {msg.role === 'system' ? (
                    <p className='italic'>{msg.content}</p>
                    ) : (
                    <ReactMarkdown>{msg.content.replace('\n[Image Attached]', '')}</ReactMarkdown>
                    )}
                </div>
            </div>
            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center ml-3 flex-shrink-0">
                <UserIcon className="w-5 h-5" />
              </div>
            )}
          </div>
        ))}
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

      {/* Input */}
      <div className="flex-shrink-0 p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
        {image && (
          <div className="mb-2 relative w-24 h-24 p-1 border border-gray-300 dark:border-gray-600 rounded-lg">
            <img src={image.dataUrl} alt="Preview" className="w-full h-full object-cover rounded" />
            <button
              onClick={() => {
                setImage(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
            >
              <XIcon className="w-4 h-4" />
            </button>
          </div>
        )}
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 rounded-full bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
            disabled={isLoading}
            aria-label="Attach image"
          >
            <ImageIcon className="w-5 h-5" />
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Tell me about your schedule and goals..."
            className="flex-1 w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-rose-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            className="bg-rose-500 hover:bg-rose-600 text-white p-2 rounded-full disabled:bg-gray-400 dark:disabled:bg-gray-600 transition-colors"
            disabled={isLoading || (!input.trim() && !image)}
            aria-label="Generate routine"
          >
            <SendIcon className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};