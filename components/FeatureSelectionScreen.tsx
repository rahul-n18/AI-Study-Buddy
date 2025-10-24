import React from 'react';
import { FileTextIcon, CalendarCheckIcon, LanguagesIcon, MapPinIcon, PaintBrushIcon, ChevronRightIcon } from './Icons';
import { Logo } from './Logo';

interface FeatureSelectionScreenProps {
  onSelectFeature: (feature: 'pdf' | 'routine' | 'language' | 'events' | 'drawing') => void;
}

type FeatureColor = 'cyan' | 'rose' | 'orange' | 'indigo' | 'emerald';

// Tailwind CSS requires full class names, so we can't build them dynamically like `text-${color}-400`.
// Instead, we map colors to their full, valid class names.
const colorClasses: Record<FeatureColor, { text: string; border: string; shadow: string; }> = {
  cyan: { text: 'text-cyan-500 dark:text-cyan-400', border: 'hover:border-cyan-500/50 dark:hover:border-cyan-400/50', shadow: 'hover:shadow-cyan-300/50 dark:hover:shadow-cyan-900/50' },
  rose: { text: 'text-rose-500 dark:text-rose-400', border: 'hover:border-rose-500/50 dark:hover:border-rose-400/50', shadow: 'hover:shadow-rose-300/50 dark:hover:shadow-rose-900/50' },
  orange: { text: 'text-orange-500 dark:text-orange-400', border: 'hover:border-orange-500/50 dark:hover:border-orange-400/50', shadow: 'hover:shadow-orange-300/50 dark:hover:shadow-orange-900/50' },
  indigo: { text: 'text-indigo-500 dark:text-indigo-400', border: 'hover:border-indigo-500/50 dark:hover:border-indigo-400/50', shadow: 'hover:shadow-indigo-300/50 dark:hover:shadow-indigo-900/50' },
  emerald: { text: 'text-emerald-500 dark:text-emerald-400', border: 'hover:border-emerald-500/50 dark:hover:border-emerald-400/50', shadow: 'hover:shadow-emerald-300/50 dark:hover:shadow-emerald-900/50' },
};

const FeatureCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  color: FeatureColor;
  onClick: () => void;
}> = ({ icon, title, description, color, onClick }) => (
  <button
    onClick={onClick}
    className={`group bg-white/50 dark:bg-gray-900/50 border border-gray-200 dark:border-white/10 rounded-2xl p-6 text-left w-full transition-all duration-300 transform hover:-translate-y-2 relative overflow-hidden shadow-lg ${colorClasses[color].border} ${colorClasses[color].shadow}`}
  >
    <div className="flex flex-col justify-between h-full">
        <div>
            <div className={`bg-gray-100 dark:bg-gray-800 p-3 rounded-lg mb-4 inline-block border border-gray-200 dark:border-white/5 ${colorClasses[color].text}`}>
                {icon}
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h3>
            <p className="text-gray-600 dark:text-gray-400 text-base mt-2">{description}</p>
        </div>
        <div className="mt-4 flex justify-end">
            <ChevronRightIcon className={`w-8 h-8 text-gray-400 dark:text-gray-600 transition-transform duration-300 group-hover:translate-x-2 ${colorClasses[color].text}`} />
        </div>
    </div>
  </button>
);

export const FeatureSelectionScreen: React.FC<FeatureSelectionScreenProps> = ({ onSelectFeature }) => {
  const features = [
    { name: 'AI PDF Reading Assistant', description: 'Summarize, explain, and chat with your PDF documents effortlessly.', icon: <FileTextIcon className="w-8 h-8" />, feature: 'pdf', color: 'cyan' },
    { name: 'AI Routine Maker', description: 'Generate a personalized routine to balance work, study, and life.', icon: <CalendarCheckIcon className="w-8 h-8" />, feature: 'routine', color: 'rose' },
    { name: 'Language Learning Game', description: 'Interactive exercises and AI feedback to master a new language.', icon: <LanguagesIcon className="w-8 h-8" />, feature: 'language', color: 'orange' },
    { name: 'AI Event Discovery', description: 'Find personalized, AI-recommended events happening near you.', icon: <MapPinIcon className="w-8 h-8" />, feature: 'events', color: 'indigo' },
    { name: 'AI Drawing Artist', description: 'Co-create images with AI. Draw a sketch, add a prompt, and see it come to life.', icon: <PaintBrushIcon className="w-8 h-8" />, feature: 'drawing', color: 'emerald' },
  ] as const;

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-8 overflow-y-auto">
      <div className="text-center mb-12 animate-fade-in-down">
        <Logo className="text-6xl mx-auto mb-6" />
        <h1 className="text-5xl font-extrabold text-gray-900 dark:text-white mb-3 tracking-tight">
          Welcome to your <span className="animate-text-gradient">AI Study Buddy</span>
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Your all-in-one assistant for productivity, learning, and creativity. Select a feature to begin.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl animate-fade-in-up">
        {features.map((feature) => (
            <FeatureCard
              key={feature.feature}
              icon={feature.icon}
              title={feature.name}
              description={feature.description}
              color={feature.color as FeatureColor}
              onClick={() => onSelectFeature(feature.feature)}
            />
        ))}
      </div>
    </div>
  );
};