
import React, { useState, useEffect, useCallback } from 'react';
import { FilterKeyword, AppState } from './types';
import { saveToStorage, loadFromStorage } from './services/storage';
import { generateRelatedKeywords } from './services/geminiService';
import { 
  ShieldCheckIcon, 
  PlusIcon, 
  TrashIcon, 
  SparklesIcon, 
  ArrowPathIcon,
  NoSymbolIcon
} from '@heroicons/react/24/outline';

const App: React.FC = () => {
  const [keywords, setKeywords] = useState<FilterKeyword[]>([]);
  const [blockedCount, setBlockedCount] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isAiLoading, setIsAiLoading] = useState(false);

  useEffect(() => {
    const init = async () => {
      const data = await loadFromStorage();
      setKeywords(data.keywords || []);
      setBlockedCount(data.blockedCount || 0);
      setIsLoading(false);
    };
    init();
  }, []);

  const persistState = useCallback(async (newKeywords: FilterKeyword[]) => {
    setKeywords(newKeywords);
    await saveToStorage({ keywords: newKeywords });
  }, []);

  const addKeyword = useCallback(async (text: string, isAi = false) => {
    if (!text.trim()) return;
    const exists = keywords.some(k => k.text.toLowerCase() === text.toLowerCase());
    if (exists) return;

    const newKeyword: FilterKeyword = {
      id: Math.random().toString(36).substring(7),
      text: text.trim(),
      enabled: true,
      createdAt: Date.now(),
      isAiGenerated: isAi
    };

    const updated = [...keywords, newKeyword];
    await persistState(updated);
    setInputValue('');
  }, [keywords, persistState]);

  const removeKeyword = useCallback(async (id: string) => {
    const updated = keywords.filter(k => k.id !== id);
    await persistState(updated);
  }, [keywords, persistState]);

  const toggleKeyword = useCallback(async (id: string) => {
    const updated = keywords.map(k => 
      k.id === id ? { ...k, enabled: !k.enabled } : k
    );
    await persistState(updated);
  }, [keywords, persistState]);

  const handleAiSuggest = async () => {
    if (!inputValue.trim()) return;
    setIsAiLoading(true);
    const suggested = await generateRelatedKeywords(inputValue);
    for (const word of suggested) {
      await addKeyword(word, true);
    }
    setIsAiLoading(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#030303]">
        <ArrowPathIcon className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-lg mx-auto bg-[#030303] min-h-screen text-gray-200">
      <header className="flex items-center justify-between mb-8 border-b border-gray-800 pb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-600 rounded-lg shadow-lg shadow-orange-900/20">
            <ShieldCheckIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">ReddBlock</h1>
            <p className="text-xs text-gray-500 font-medium">Content Guard for Reddit</p>
          </div>
        </div>
        <div className="text-right">
          <span className="block text-2xl font-bold text-orange-400">{blockedCount}</span>
          <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Posts Blocked</span>
        </div>
      </header>

      <section className="mb-8">
        <label className="block text-xs font-bold text-gray-500 uppercase mb-2 tracking-wider">New Filter</label>
        <div className="flex gap-2">
          <div className="relative flex-grow">
            <input 
              type="text" 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addKeyword(inputValue)}
              placeholder="Enter keyword (e.g. India)"
              className="w-full bg-[#1A1A1B] border border-gray-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all placeholder-gray-600"
            />
          </div>
          <button 
            onClick={() => addKeyword(inputValue)}
            className="bg-gray-100 text-gray-900 hover:bg-white px-4 py-3 rounded-xl transition-colors disabled:opacity-50"
            disabled={!inputValue.trim()}
          >
            <PlusIcon className="w-5 h-5" />
          </button>
          <button 
            onClick={handleAiSuggest}
            disabled={isAiLoading || !inputValue.trim()}
            className="bg-orange-600 hover:bg-orange-500 text-white px-4 py-3 rounded-xl transition-all shadow-lg shadow-orange-900/20 disabled:opacity-50 group flex items-center gap-2"
            title="AI Suggest Related Keywords"
          >
            {isAiLoading ? (
              <ArrowPathIcon className="w-5 h-5 animate-spin" />
            ) : (
              <SparklesIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
            )}
          </button>
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Active Filters ({keywords.length})</h2>
          {keywords.length > 0 && (
            <button 
              onClick={() => persistState([])}
              className="text-[10px] text-red-500 hover:text-red-400 font-bold uppercase transition-colors"
            >
              Clear All
            </button>
          )}
        </div>
        
        {keywords.length === 0 ? (
          <div className="bg-[#1A1A1B] border border-dashed border-gray-800 rounded-2xl p-10 flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-gray-800/50 rounded-full flex items-center justify-center mb-4">
               <NoSymbolIcon className="w-6 h-6 text-gray-600" />
            </div>
            <p className="text-gray-500 text-sm">No filters active.<br/>Add a keyword to start blocking.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {keywords.sort((a, b) => b.createdAt - a.createdAt).map((kw) => (
              <div 
                key={kw.id} 
                className={`group flex items-center justify-between p-4 bg-[#1A1A1B] border border-gray-800 rounded-xl hover:border-gray-700 transition-all ${!kw.enabled ? 'opacity-50' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <input 
                    type="checkbox" 
                    checked={kw.enabled}
                    onChange={() => toggleKeyword(kw.id)}
                    className="w-4 h-4 rounded border-gray-700 bg-gray-800 text-orange-500 focus:ring-orange-500/20"
                  />
                  <div>
                    <span className={`text-sm font-medium ${!kw.enabled ? 'line-through text-gray-600' : 'text-gray-200'}`}>
                      {kw.text}
                    </span>
                    {kw.isAiGenerated && (
                      <span className="ml-2 px-1.5 py-0.5 bg-orange-900/30 text-orange-400 text-[8px] font-bold uppercase rounded tracking-wide">AI</span>
                    )}
                  </div>
                </div>
                <button 
                  onClick={() => removeKeyword(kw.id)}
                  className="p-2 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <footer className="mt-12 pt-6 border-t border-gray-800">
        <div className="bg-orange-500/5 rounded-xl p-4 border border-orange-500/10">
          <p className="text-[10px] leading-relaxed text-gray-500 font-medium">
            <strong className="text-orange-500 uppercase">Pro Tip:</strong> ReddBlock scans post titles, descriptions, and subreddit names across the entire Reddit feed to keep your experience clean.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
