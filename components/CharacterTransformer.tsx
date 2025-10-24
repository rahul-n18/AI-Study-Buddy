import React, { useState, useRef } from 'react';
// FIX: The 'transformImage' function did not exist. The 'generateImageFromDrawing' function provides the required image transformation capability, so it is imported and aliased.
import { generateImageFromDrawing as transformImage } from '../services/geminiService';
import { UploadCloudIcon, LoaderIcon, SparklesIcon, XIcon, DownloadIcon } from './Icons';

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

export const CharacterTransformer: React.FC = () => {
  const [originalImage, setOriginalImage] = useState<{ base64: string; mimeType: string; dataUrl: string } | null>(null);
  const [transformedImage, setTransformedImage] = useState<string | null>(null); // base64 string
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) { // 4MB limit for Gemini API
          setError('Image size should be less than 4MB.');
          return;
      }
      setError(null);
      setTransformedImage(null); // Reset transformed image on new upload
      try {
        const imageData = await fileToBase64(file);
        setOriginalImage(imageData);
      } catch (err) {
        console.error("Error converting file to base64:", err);
        setError('Could not process the uploaded file.');
      }
    }
  };

  const handleTransform = async () => {
    if (!originalImage || !prompt.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    setTransformedImage(null);

    try {
      // FIX: The original function call passed mimeType, which is not accepted by the aliased function.
      const resultImage = await transformImage(prompt, originalImage.base64);
      setTransformedImage(resultImage);
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Failed to transform image. ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDownload = () => {
    if (!transformedImage) return;
    const link = document.createElement('a');
    link.href = `data:image/png;base64,${transformedImage}`;
    link.download = 'transformed-character.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const reset = () => {
      setOriginalImage(null);
      setTransformedImage(null);
      setPrompt('');
      setError(null);
      if (fileInputRef.current) {
          fileInputRef.current.value = '';
      }
  };

  const renderContent = () => {
    if (!originalImage) {
      return (
        <div className="w-full h-full flex items-center justify-center">
          <div
            className="w-full max-w-lg p-8 border-4 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-center cursor-pointer hover:border-lime-500 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <UploadCloudIcon className="w-24 h-24 mx-auto text-gray-400 dark:text-gray-500" />
            <h3 className="mt-4 text-2xl font-semibold">Upload your photo</h3>
            <p className="text-gray-500 dark:text-gray-400 mt-2">Click to browse or drag and drop an image file here.</p>
            <p className="text-sm text-gray-600 dark:text-gray-500 mt-1">PNG, JPG, WEBP up to 4MB</p>
          </div>
        </div>
      );
    }

    return (
      <div className="w-full h-full flex flex-col md:flex-row gap-4">
        {/* Original Image */}
        <div className="w-full md:w-1/2 flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-800 p-4 rounded-lg relative">
            <h3 className="text-xl font-bold mb-4">Your Photo</h3>
            <img src={originalImage.dataUrl} alt="Original" className="max-w-full max-h-full object-contain rounded-md" style={{maxHeight: 'calc(100% - 60px)'}}/>
             <button onClick={reset} className="absolute top-3 right-3 bg-red-600 hover:bg-red-700 p-2 rounded-full text-white">
                <XIcon className="w-5 h-5"/>
            </button>
        </div>

        {/* Transformed Image */}
        <div className="w-full md:w-1/2 flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
            <h3 className="text-xl font-bold mb-4">Transformed Character</h3>
            <div className="w-full h-full flex items-center justify-center bg-gray-200/50 dark:bg-gray-900/50 rounded-md">
                {isLoading && <LoaderIcon className="w-16 h-16 text-lime-500 dark:text-lime-400" />}
                {error && !isLoading && <div className="text-center text-red-500 dark:text-red-400 p-4">{error}</div>}
                {transformedImage && !isLoading && (
                    <img src={`data:image/png;base64,${transformedImage}`} alt="Transformed" className="max-w-full max-h-full object-contain rounded-md"/>
                )}
                {!isLoading && !transformedImage && !error && <p className="text-gray-400 dark:text-gray-500">Your character will appear here.</p>}
            </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center">
            <SparklesIcon className="w-6 h-6 text-lime-500 dark:text-lime-400" />
            <h2 className="text-xl font-bold ml-2">AI Character Transformer</h2>
        </div>
      </header>
      
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/png, image/jpeg, image/webp"
        className="hidden"
      />
      
      {/* Main Content */}
      <main className="flex-1 p-4 overflow-auto">
        {renderContent()}
      </main>

      {/* Footer / Controls */}
      <footer className="flex-shrink-0 p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
        <div className="flex flex-col md:flex-row items-center gap-4">
            <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., a Simpsons character, a Studio Ghibli hero..."
                className="flex-1 w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-lime-500 text-lg"
                disabled={!originalImage || isLoading}
            />
            <button
                onClick={handleTransform}
                className="w-full md:w-auto bg-lime-500 hover:bg-lime-600 text-black dark:text-white font-bold py-3 px-6 rounded-lg text-lg flex items-center justify-center transition-colors disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
                disabled={!originalImage || !prompt.trim() || isLoading}
            >
                <SparklesIcon className="w-5 h-5 mr-2" />
                Transform
            </button>
             {transformedImage && !isLoading && (
                <button
                    onClick={handleDownload}
                    className="w-full md:w-auto bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg text-lg flex items-center justify-center transition-colors"
                >
                    <DownloadIcon className="w-5 h-5 mr-2" />
                    Download
                </button>
            )}
        </div>
      </footer>
    </div>
  );
};