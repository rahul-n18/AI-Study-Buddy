import React, { useState, useMemo } from 'react';
import { Event, EventCategory, eventCategories } from '../types';
import * as geminiService from '../services/geminiService';
import { LoaderIcon, MapPinIcon, SparklesIcon, XIcon, StarIcon, CalendarPlusIcon, Share2Icon } from './Icons';

const categoryColors: Record<EventCategory, string> = {
  Academic: 'bg-blue-500',
  Tech: 'bg-green-500',
  Culture: 'bg-purple-500',
  Sports: 'bg-orange-500',
  Social: 'bg-pink-500',
  Career: 'bg-indigo-500',
};

const EventCard: React.FC<{ event: Event; onSelect: (event: Event) => void }> = ({ event, onSelect }) => (
  <div
    onClick={() => onSelect(event)}
    className={`bg-white dark:bg-gray-800 rounded-lg p-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-all border-2 ${event.isRecommended ? 'border-indigo-500 dark:border-indigo-400' : 'border-gray-200 dark:border-gray-700'} relative`}
  >
    {event.isRecommended && (
      <div className="absolute top-2 right-2 text-indigo-500 dark:text-indigo-400">
        <StarIcon className="w-5 h-5 fill-current" />
      </div>
    )}
    <span className={`text-xs font-bold px-2 py-1 rounded-full text-white ${categoryColors[event.category]}`}>{event.category}</span>
    <h3 className="font-bold text-lg mt-2 text-gray-900 dark:text-white">{event.title}</h3>
    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{new Date(event.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
    <p className="text-sm text-gray-500 dark:text-gray-400">{event.location}</p>
  </div>
);

const EventModal: React.FC<{ event: Event; onClose: () => void }> = ({ event, onClose }) => {

  const handleAddToCalendar = () => {
    const startTime = `${event.date}T${event.time.split(' - ')[0]}:00`;
    const endTime = `${event.date}T${event.time.split(' - ')[1]}:00`;

    // Format for Google Calendar link
    const googleStartTime = new Date(startTime).toISOString().replace(/-|:|\.\d\d\d/g, "");
    const googleEndTime = new Date(endTime).toISOString().replace(/-|:|\.\d\d\d/g, "");

    const url = [
      'https://calendar.google.com/calendar/render?action=TEMPLATE',
      `&text=${encodeURIComponent(event.title)}`,
      `&dates=${googleStartTime}/${googleEndTime}`,
      `&details=${encodeURIComponent(event.description)}`,
      `&location=${encodeURIComponent(event.location)}`
    ].join('');
    
    window.open(url, '_blank');
  };

  const handleShare = async () => {
    const shareData = {
      title: event.title,
      text: `${event.title}\n${event.description}\nDate: ${event.date} at ${event.time}\nLocation: ${event.location}`,
      url: window.location.href, // Or a specific event URL if available
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.text);
        alert('Event details copied to clipboard!');
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };


  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-2xl w-full relative" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
          <XIcon className="w-6 h-6" />
        </button>
        <span className={`text-sm font-bold px-3 py-1 rounded-full text-white ${categoryColors[event.category]}`}>{event.category}</span>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mt-4 mb-2">{event.title}</h2>
        <div className="text-gray-600 dark:text-gray-300 space-y-1 mb-4">
            <p><strong>Date:</strong> {new Date(event.date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
            <p><strong>Time:</strong> {event.time}</p>
            <p><strong>Location:</strong> {event.location}</p>
        </div>
        <p className="text-gray-500 dark:text-gray-400 mb-6">{event.description}</p>
        <div className="flex flex-col sm:flex-row gap-4">
            {event.registrationLink && <a href={event.registrationLink} target="_blank" rel="noopener noreferrer" className="flex-1 text-center bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg">Register Now</a>}
            <button onClick={handleAddToCalendar} className="flex-1 flex items-center justify-center bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-bold py-3 px-4 rounded-lg">
              <CalendarPlusIcon className="w-5 h-5 mr-2" />
              Add to Calendar
            </button>
            <button onClick={handleShare} className="flex-1 flex items-center justify-center bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-bold py-3 px-4 rounded-lg">
                <Share2Icon className="w-5 h-5 mr-2" />
                Share
            </button>
        </div>
      </div>
    </div>
  );
};

export const EventDiscovery: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [sources, setSources] = useState<any[]>([]);
  const [locationQuery, setLocationQuery] = useState('');
  const [preferences, setPreferences] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  const [categoryFilter, setCategoryFilter] = useState<EventCategory | 'all'>('all');
  const [dateFilter, setDateFilter] = useState('');

  const handleFindEvents = (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationQuery.trim()) {
        setError('Please enter a location to search for events.');
        setStatus('error'); // Show error in main view
        return;
    }
    setError(null);
    setStatus('loading');
    geminiService.generateEvents(locationQuery, preferences)
      .then(({ events: generatedEvents, sources: generatedSources }) => {
        setEvents(generatedEvents);
        setSources(generatedSources);
        setStatus('success');
      })
      .catch(err => {
        console.error(err);
        setError(err.message || 'Could not fetch events from the AI. Please try again later.');
        setStatus('error');
      });
  };

  const filteredEvents = useMemo(() => {
    return events
      .filter(event => {
        const categoryMatch = categoryFilter === 'all' || event.category === categoryFilter;
        const dateMatch = !dateFilter || event.date === dateFilter;
        return categoryMatch && dateMatch;
      })
      .sort((a, b) => ((b.isRecommended ? 1 : 0) - (a.isRecommended ? 1 : 0)) || (new Date(a.date).getTime() - new Date(b.date).getTime()));
  }, [events, categoryFilter, dateFilter]);

  return (
    <div className="w-full h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      {selectedEvent && <EventModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />}
      <header className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center">
            <SparklesIcon className="w-6 h-6 text-indigo-500 dark:text-indigo-400" />
            <h2 className="text-xl font-bold ml-2">AI Event Discovery</h2>
        </div>
      </header>
      
      <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800/50">
          <form onSubmit={handleFindEvents} className="flex flex-col sm:flex-row items-center gap-2">
            <input 
                type="text"
                value={locationQuery}
                onChange={(e) => setLocationQuery(e.target.value)}
                placeholder="Enter a city or location"
                className="flex-1 w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input 
                type="text"
                value={preferences}
                onChange={(e) => setPreferences(e.target.value)}
                placeholder="Interests (e.g., AI, hiking)"
                className="flex-1 w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button type="submit" disabled={status === 'loading'} className="w-full sm:w-auto bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed">
                <SparklesIcon className="w-5 h-5 mr-2"/>
                Find Events
            </button>
          </form>
          {status === 'success' && events.length > 0 && (
              <div className="flex flex-col sm:flex-row gap-2 mt-4">
                  <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value as EventCategory | 'all')} className="w-full sm:w-1/3 p-2 bg-white dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none">
                      <option value="all">All Categories</option>
                      {eventCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                  <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="w-full sm:w-1/3 p-2 bg-white dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none" />
                  <button onClick={() => { setCategoryFilter('all'); setDateFilter(''); }} className="w-full sm:w-1/3 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 font-bold py-2 px-4 rounded-lg">Clear Filters</button>
              </div>
          )}
      </div>

      <main className="flex-1 p-4 overflow-y-auto">
        {status === 'loading' && (
          <div className="w-full h-full flex flex-col items-center justify-center text-center">
            <LoaderIcon className="w-12 h-12 text-indigo-500 dark:text-indigo-400 mb-4" />
            <p className="text-lg">Searching for real events in {locationQuery}...</p>
          </div>
        )}
        {status === 'idle' && (
            <div className="w-full h-full flex flex-col items-center justify-center text-center">
                <MapPinIcon className="w-12 h-12 text-indigo-500 dark:text-indigo-400 mb-4" />
                <p className="text-lg text-gray-500 dark:text-gray-400">Enter a location to discover events happening near you.</p>
            </div>
        )}
        {status === 'error' && (
            <div className="w-full h-full flex flex-col items-center justify-center text-center">
                <XIcon className="w-12 h-12 text-red-500 mb-4" />
                <h2 className="text-2xl font-bold mb-2">An Error Occurred</h2>
                <p className="text-lg text-gray-500 dark:text-gray-400 max-w-md">{error}</p>
            </div>
        )}
        {status === 'success' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredEvents.map(event => <EventCard key={event.id} event={event} onSelect={setSelectedEvent} />)}
            </div>
            {events.length > 0 && filteredEvents.length === 0 && (
                <div className="text-center py-16">
                    <p className="text-lg text-gray-400 dark:text-gray-500">No events match your current filters.</p>
                </div>
            )}
            {events.length === 0 && (
                 <div className="text-center py-16">
                    <p className="text-lg text-gray-400 dark:text-gray-500">No events found for this location. Try a different search.</p>
                </div>
            )}
            {sources.length > 0 && (
                <div className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <h4 className="text-lg font-semibold text-gray-600 dark:text-gray-300 mb-2">Sources</h4>
                    <ul className="list-disc list-inside text-sm space-y-1">
                        {sources.map((source, index) => (
                            source.web && (
                                <li key={index}>
                                    <a href={source.web.uri} target="_blank" rel="noopener noreferrer" className="text-indigo-500 dark:text-indigo-400 hover:underline">
                                        {source.web.title || source.web.uri}
                                    </a>
                                </li>
                            )
                        ))}
                    </ul>
                </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};