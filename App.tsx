import React, { useState, useEffect } from 'react';
import { FeatureSelectionScreen } from './components/FeatureSelectionScreen';
import PdfViewer from './components/PdfViewer';
import { AiAssistant } from './components/AiAssistant';
import { RoutineMaker } from './components/RoutineMaker';
import { LanguageGame } from './components/LanguageGame';
import { EventDiscovery } from './components/EventDiscovery';
import { DrawingAssistant } from './components/DrawingAssistant';
import { HomeIcon, UploadCloudIcon, SunIcon, MoonIcon } from './components/Icons';
import { Logo } from './components/Logo';

type ActiveFeature = 'pdf' | 'routine' | 'language' | 'events' | 'drawing' | null;
type Theme = 'light' | 'dark';

function App() {
  const [activeFeature, setActiveFeature] = useState<ActiveFeature>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [theme, setTheme] = useState<Theme>('dark');

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  // PDF Feature State
  const [currentPageText, setCurrentPageText] = useState('');
  const [selectedText, setSelectedText] = useState('');
  const [notes, setNotes] = useState('');

  const handleFileChange = (file: File | null) => {
    setPdfFile(file);
    setCurrentPageText('');
    setSelectedText('');
    setNotes('');
  };
  
  const resetToHome = () => {
    setActiveFeature(null);
    setPdfFile(null); // Also reset pdf file when going home
  };

  const renderPdfUploader = () => (
    <div className="w-full h-full flex flex-col items-center justify-center p-8">
      <div className="text-center bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm p-12 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700">
        <h2 className="text-4xl font-bold text-cyan-500 dark:text-cyan-400 mb-4">AI PDF Reading Assistant</h2>
        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-8">
          Upload a PDF document to start summarizing, explaining, and asking questions.
        </p>
        <label className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-4 px-8 rounded-lg text-lg inline-flex items-center transition-all transform hover:scale-105 cursor-pointer shadow-lg hover:shadow-cyan-500/50">
          <UploadCloudIcon className="w-6 h-6 mr-3" />
          Upload PDF
          <input
            type="file"
            onChange={(e) => handleFileChange(e.target.files ? e.target.files[0] : null)}
            accept="application/pdf"
            className="hidden"
          />
        </label>
      </div>
    </div>
  );

  const renderActiveFeature = () => {
    switch (activeFeature) {
      case 'pdf':
        if (!pdfFile) {
          return renderPdfUploader();
        }
        return (
          <div className="flex h-full">
            <div className="w-2/3 h-full">
              <PdfViewer
                file={pdfFile}
                onPageChange={setCurrentPageText}
                onTextSelect={setSelectedText}
              />
            </div>
            <div className="w-1/3 h-full border-l-2 border-gray-200 dark:border-gray-800">
              <AiAssistant
                currentPageText={currentPageText}
                selectedText={selectedText}
                notes={notes}
                onNotesChange={setNotes}
              />
            </div>
          </div>
        );
      case 'routine':
        return <RoutineMaker />;
      case 'language':
        return <LanguageGame theme={theme} />;
      case 'events':
        return <EventDiscovery />;
      case 'drawing':
        return <DrawingAssistant />;
      default:
        return <FeatureSelectionScreen onSelectFeature={setActiveFeature} />;
    }
  };

  return (
    <div className="w-screen h-screen flex flex-col font-sans">
      <header className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-lg p-3 border-b border-gray-200 dark:border-white/5 shadow-lg flex-shrink-0 flex items-center justify-between z-20">
        <div className="flex items-center">
          {activeFeature ? (
            <button onClick={resetToHome} className="mr-4 p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors" aria-label="Go to home screen">
              <HomeIcon className="w-6 h-6"/>
            </button>
          ) : <div className="w-10"></div> }
          <Logo className="text-2xl" />
        </div>
        <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors" aria-label="Toggle theme">
          {theme === 'light' ? <MoonIcon className="w-6 h-6" /> : <SunIcon className="w-6 h-6" />}
        </button>
      </header>
      <main className="flex-1 overflow-hidden">
        {renderActiveFeature()}
      </main>
    </div>
  );
}

export default App;