import React, { useState, useRef, useEffect, useCallback } from 'react';
import { generateImageFromDrawing } from '../services/geminiService';
// FIX: Removed unused 'SendIcon' and non-existent 'PaletteIcon' from imports.
import { SparklesIcon, TrashIcon, LoaderIcon } from './Icons';

export const DrawingAssistant: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colorInputRef = useRef<HTMLInputElement>(null);
  const backgroundImageRef = useRef<HTMLImageElement | null>(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [penColor, setPenColor] = useState('#000000');
  const [prompt, setPrompt] = useState('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initializeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const drawImageToCanvas = useCallback(() => {
    if (!canvasRef.current || !backgroundImageRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.drawImage(backgroundImageRef.current, 0, 0, canvas.width, canvas.height);
  }, []);
  
  useEffect(() => {
    initializeCanvas();
  }, [initializeCanvas]);

  useEffect(() => {
    if (generatedImage) {
      const img = new window.Image();
      img.onload = () => {
        backgroundImageRef.current = img;
        drawImageToCanvas();
      };
      img.src = `data:image/png;base64,${generatedImage}`;
    }
  }, [generatedImage, drawImageToCanvas]);

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent): { x: number; y: number } => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    e.preventDefault();

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = penColor;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    initializeCanvas();
    setGeneratedImage(null);
    backgroundImageRef.current = null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canvasRef.current || !prompt.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const canvas = canvasRef.current;
      const drawingData = canvas.toDataURL('image/png').split(',')[1];
      const resultImage = await generateImageFromDrawing(prompt, drawingData);
      setGeneratedImage(resultImage);
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Failed to generate image. ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      <header className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center">
          <SparklesIcon className="w-6 h-6 text-emerald-500 dark:text-emerald-400" />
          <h2 className="text-xl font-bold ml-2">AI Drawing Artist</h2>
        </div>
      </header>
      
      <main className="flex-1 p-4 overflow-auto flex flex-col items-center justify-center">
        <div className="w-full max-w-5xl flex flex-col items-center">
          <div className="mb-4 flex items-center gap-4 bg-white/50 dark:bg-gray-800/50 p-2 rounded-full border border-gray-200 dark:border-gray-700">
            <div className="relative">
                <button
                    type="button"
                    className="w-10 h-10 rounded-full overflow-hidden border-2 border-white dark:border-gray-600 shadow-sm transition-transform hover:scale-110"
                    onClick={() => colorInputRef.current?.click()}
                    style={{ backgroundColor: penColor }}
                    aria-label="Open color picker"
                />
                <input
                    ref={colorInputRef}
                    type="color"
                    value={penColor}
                    onChange={(e) => setPenColor(e.target.value)}
                    className="opacity-0 absolute w-px h-px"
                    aria-label="Select pen color"
                />
            </div>
            <button
              type="button"
              onClick={clearCanvas}
              className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-200 dark:bg-gray-700 shadow-sm transition-all hover:bg-gray-300 dark:hover:bg-gray-600 hover:scale-110"
              aria-label="Clear Canvas"
            >
              <TrashIcon className="w-5 h-5" />
            </button>
          </div>
          
          <div className="w-full aspect-video shadow-2xl rounded-lg overflow-hidden border-2 border-gray-300 dark:border-gray-700">
            <canvas
              ref={canvasRef}
              width={960}
              height={540}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="w-full h-full cursor-crosshair bg-white touch-none"
            />
          </div>
           {error && <div className="mt-4 text-center text-red-500 dark:text-red-400 p-2 bg-red-100 dark:bg-red-900/50 rounded-md w-full max-w-5xl">{error}</div>}
        </div>
      </main>

      <footer className="flex-shrink-0 p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
        <form onSubmit={handleSubmit} className="flex items-center gap-2 max-w-5xl mx-auto">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe what you want to create or change..."
            className="flex-1 w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-lg"
            disabled={isLoading}
            required
          />
          <button
            type="submit"
            disabled={isLoading || !prompt.trim()}
            className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-6 rounded-lg text-lg flex items-center justify-center transition-colors disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <LoaderIcon className="w-6 h-6" aria-label="Loading" />
            ) : (
              <>
                <SparklesIcon className="w-5 h-5 mr-2" />
                Generate
              </>
            )}
          </button>
        </form>
      </footer>
    </div>
  );
};