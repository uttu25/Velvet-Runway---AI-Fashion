import React, { useState, useEffect, useCallback } from 'react';
import { ModelCard } from './components/ModelCard';
import { ModelProfile, RevealStage } from './types';
import { generateDailyIdentities, orchestrateModelStages } from './services/geminiService';

const CACHE_KEY = 'velvet_runway_collection_v2';
const CACHE_DATE_KEY = 'velvet_runway_last_update_v2';

const AdSlot: React.FC<{ className?: string; type?: 'horizontal' | 'vertical' | 'square' }> = ({ className, type = 'square' }) => (
  <div className={`bg-neutral-900 border border-white/5 flex flex-col items-center justify-center p-4 overflow-hidden relative group ${className}`}>
    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
    <span className="text-[10px] text-neutral-600 font-bold uppercase tracking-widest mb-2">Advertisement</span>
    <div className={`border-2 border-dashed border-neutral-800 rounded flex items-center justify-center w-full h-full text-neutral-700 text-xs text-center p-2`}>
      {type === 'horizontal' ? 'Leaderboard 728x90' : type === 'vertical' ? 'Skyscraper 160x600' : 'Responsive Square'}
    </div>
  </div>
);

const App: React.FC = () => {
  const [models, setModels] = useState<ModelProfile[]>([]);
  const [isOrchestrating, setIsOrchestrating] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [progress, setProgress] = useState(0);

  const startAgencyManager = useCallback(async () => {
    if (isOrchestrating) return;
    setIsOrchestrating(true);
    setStatusMessage("AI Agency Manager Initializing...");
    setModels([]);

    try {
      setStatusMessage("Drafting Daily Identities...");
      const identities = await generateDailyIdentities(20);
      
      const completedModels: ModelProfile[] = [];

      for (let i = 0; i < identities.length; i++) {
        const id = identities[i];
        setStatusMessage(`Orchestrating Model ${i + 1} of 20...`);
        
        try {
          const modelId = Math.random().toString(36).substring(7);
          
          // Pre-generate all 3 stages in one sequence
          const allStages = await orchestrateModelStages(id, (stage, url) => {
            // Optional: could update UI incrementally if desired
          });

          const newModel: ModelProfile = {
            id: modelId,
            name: id.name,
            description: id.description,
            imageUrl: allStages[RevealStage.FullyClothed],
            loading: false,
            stage: RevealStage.FullyClothed,
            stageImages: allStages
          };

          completedModels.push(newModel);
          setModels(prev => [...prev, newModel]);
          
          // Save incrementally to cache in case of partial failure
          localStorage.setItem(CACHE_KEY, JSON.stringify(completedModels));
          localStorage.setItem(CACHE_DATE_KEY, new Date().toDateString());
        } catch (err) {
          console.warn(`Model ${i+1} failed orchestration. Continuing...`);
        }
        
        setProgress(Math.round(((i + 1) / identities.length) * 100));
      }
      
      setStatusMessage("Daily Runway Synchronized.");
    } catch (e) {
      console.error("Agency Manager Error:", e);
      setStatusMessage("System Overload. Retrying soon...");
    } finally {
      setIsOrchestrating(false);
    }
  }, [isOrchestrating]);

  useEffect(() => {
    const cachedModels = localStorage.getItem(CACHE_KEY);
    const lastUpdate = localStorage.getItem(CACHE_DATE_KEY);
    const today = new Date().toDateString();

    if (cachedModels && lastUpdate === today) {
      setModels(JSON.parse(cachedModels));
      setStatusMessage("Agency Online: Daily Collection Loaded.");
    } else {
      // Auto-start if no valid daily cache exists
      startAgencyManager();
    }
  }, []);

  const updateModel = (id: string, updates: Partial<ModelProfile>) => {
    setModels(prev => {
      const updated = prev.map(m => m.id === id ? { ...m, ...updates } : m);
      localStorage.setItem(CACHE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <div className="min-h-screen bg-[#020202] text-[#f0f0f0] flex flex-col">
      <AdSlot type="horizontal" className="h-24 w-full border-b border-white/5" />

      <header className="sticky top-0 z-30 bg-[#020202]/95 backdrop-blur-xl border-b border-[#d4af37]/20 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
        <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center gap-5 mb-4 md:mb-0">
            <div className="w-14 h-14 bg-gradient-to-tr from-[#d4af37] via-[#f9e29f] to-[#b8860b] rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(212,175,55,0.4)]">
              <span className="font-bold text-3xl serif text-black">V</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tighter serif leading-none gold-glow uppercase">Velvet Runway</h1>
              <div className="flex items-center gap-2 mt-2">
                <div className={`w-2 h-2 rounded-full ${isOrchestrating ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`}></div>
                <p className="text-[9px] text-neutral-400 tracking-[0.2em] font-bold uppercase">{statusMessage}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            {isOrchestrating && (
              <div className="flex flex-col items-end gap-1.5">
                <span className="text-[9px] font-bold text-[#d4af37] uppercase tracking-[0.2em]">Agent Activity: {progress}%</span>
                <div className="w-48 h-1 bg-neutral-900 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-[#d4af37] to-[#b8860b] transition-all duration-700" 
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}
            
            {!isOrchestrating && models.length === 0 && (
               <button 
                onClick={startAgencyManager}
                className="bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-black text-[10px] font-bold py-3 px-8 rounded-full uppercase tracking-widest hover:scale-105 transition shadow-lg"
               >
                 Initialize Agency
               </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-6 py-12 flex-grow">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8">
          {models.map((model, idx) => (
            <React.Fragment key={model.id}>
              {idx > 0 && idx % 10 === 0 && (
                <AdSlot className="rounded-2xl min-h-[400px]" />
              )}
              <ModelCard 
                model={model} 
                onUpdate={updateModel} 
              />
            </React.Fragment>
          ))}
          
          {isOrchestrating && models.length < 20 && (
             <div className="w-full aspect-[3/4] bg-neutral-900/50 rounded-2xl border border-white/5 flex flex-col items-center justify-center space-y-4">
                <div className="w-10 h-10 border-2 border-[#d4af37]/20 border-t-[#d4af37] rounded-full animate-spin"></div>
                <span className="text-[10px] text-neutral-500 uppercase tracking-widest animate-pulse">Agency Agent Active</span>
             </div>
          )}
        </div>
      </main>

      <div className="sticky bottom-0 z-40 w-full bg-black/90 backdrop-blur-md border-t border-white/10 p-2 shadow-2xl">
        <div className="max-w-4xl mx-auto h-20">
          <AdSlot type="horizontal" className="h-full border-none bg-transparent" />
        </div>
      </div>

      <footer className="pt-20 pb-20 bg-black border-t border-white/5 text-center">
          <p className="text-neutral-600 text-[10px] tracking-[0.4em] uppercase font-bold">
            &copy; {new Date().getFullYear()} Velvet Runway Agency &bull; Automated Daily Collection &bull; 18+ Verified
          </p>
      </footer>
    </div>
  );
};

export default App;