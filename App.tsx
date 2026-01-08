import React, { useState, useEffect } from 'react';
import { ModelCard } from './components/ModelCard';
import { ModelProfile, RevealStage } from './types';
import { generateInitialModelImage, generateModelIdentity } from './services/geminiService';

const CACHE_KEY = 'velvet_runway_collection';
const CACHE_DATE_KEY = 'velvet_runway_last_update';

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
  const [loadingInitial, setLoadingInitial] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const cachedModels = localStorage.getItem(CACHE_KEY);
    const lastUpdate = localStorage.getItem(CACHE_DATE_KEY);
    const today = new Date().toDateString();

    if (cachedModels && lastUpdate === today) {
      setModels(JSON.parse(cachedModels));
    }
  }, []);

  const generateDailyModels = async () => {
    if (loadingInitial) return;
    setLoadingInitial(true);
    setModels([]); 
    setProgress(0);

    const totalModels = 20;

    try {
      const generatedModels: ModelProfile[] = [];
      for (let i = 0; i < totalModels; i++) {
        try {
          const identity = await generateModelIdentity();
          const imageUrl = await generateInitialModelImage(identity.description, (identity as any).traits);
          
          const newModel: ModelProfile = {
            id: Math.random().toString(36).substring(7),
            name: identity.name,
            description: identity.description,
            imageUrl: imageUrl,
            loading: false,
            stage: RevealStage.FullyClothed,
            stageImages: {
              [RevealStage.FullyClothed]: imageUrl
            }
          };

          generatedModels.push(newModel);
          setModels(prev => [...prev, newModel]);
        } catch (innerError) {
          console.warn(`Failed model ${i + 1}`, innerError);
        }
        
        setProgress(Math.round(((i + 1) / totalModels) * 100));
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      localStorage.setItem(CACHE_KEY, JSON.stringify(generatedModels));
      localStorage.setItem(CACHE_DATE_KEY, new Date().toDateString());
    } catch (e) {
      console.error("Loop error:", e);
    } finally {
      setLoadingInitial(false);
    }
  };

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
              <h1 className="text-3xl font-bold tracking-tighter serif leading-none gold-glow">VELVET RUNWAY</h1>
              <p className="text-[10px] text-[#d4af37] tracking-[0.3em] font-bold uppercase mt-2">The Exclusive Daily Collection</p>
            </div>
          </div>

          <div className="flex items-center gap-8">
            {loadingInitial && (
              <div className="flex flex-col items-end gap-1.5">
                <span className="text-[9px] font-bold text-[#d4af37] uppercase tracking-[0.2em]">Curating {progress}%</span>
                <div className="w-40 h-1 bg-neutral-900 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-[#d4af37] to-[#b8860b] transition-all duration-700 shadow-[0_0_10px_rgba(212,175,55,0.6)]" 
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            <button 
              onClick={generateDailyModels}
              disabled={loadingInitial}
              className={`
                relative px-10 py-3.5 rounded-full font-bold text-xs uppercase tracking-[0.2em] transition-all duration-500
                ${loadingInitial 
                  ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed border border-transparent' 
                  : 'bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-black hover:scale-105 hover:shadow-[0_0_30px_rgba(212,175,55,0.4)] active:scale-95'
                }
              `}
            >
              {loadingInitial ? `Generating Show...` : 'Refresh Daily Runway'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-6 py-16 flex-grow">
        {models.length === 0 && !loadingInitial && (
          <div className="flex flex-col items-center justify-center min-h-[40vh] text-center max-w-3xl mx-auto space-y-8">
            <div className="relative">
              <div className="absolute inset-0 bg-[#d4af37]/10 blur-3xl rounded-full"></div>
              <h2 className="text-6xl font-bold serif leading-tight text-white relative z-10">
                Today's Most <span className="italic text-[#d4af37]">Alluring</span> Faces
              </h2>
            </div>
            <p className="text-neutral-500 text-xl font-light leading-relaxed">
              Experience the world's most provocative AI fashion showcase. 20 exclusive models refreshed daily for your viewing pleasure.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8">
          {models.map((model, idx) => (
            <React.Fragment key={model.id}>
              {idx > 0 && idx % 5 === 0 && (
                <AdSlot className="rounded-2xl min-h-[400px]" />
              )}
              <ModelCard 
                model={model} 
                onUpdate={updateModel} 
              />
            </React.Fragment>
          ))}
          
          {loadingInitial && models.length < 20 && (
             <div className="w-full aspect-[3/4] bg-neutral-900 rounded-2xl animate-pulse flex items-center justify-center border border-white/5">
                <div className="w-12 h-12 border-2 border-[#d4af37]/20 border-t-[#d4af37] rounded-full animate-spin"></div>
             </div>
          )}
        </div>
      </main>

      <div className="sticky bottom-0 z-40 w-full bg-black/90 backdrop-blur-md border-t border-white/10 p-2 shadow-2xl">
        <div className="max-w-4xl mx-auto h-20">
          <AdSlot type="horizontal" className="h-full border-none bg-transparent" />
        </div>
      </div>

      <footer className="pt-20 pb-32 bg-black border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="flex flex-wrap justify-center gap-12 mb-12 opacity-20 grayscale transition-all duration-700 hover:grayscale-0 hover:opacity-100">
            <span className="serif italic text-3xl font-bold">VOGUE</span>
            <span className="serif italic text-3xl font-bold">L'OFFICIEL</span>
            <span className="serif italic text-3xl font-bold">HARPER'S BAZAAR</span>
            <span className="serif italic text-3xl font-bold">GLAMOUR</span>
          </div>
          <p className="text-neutral-600 text-[10px] tracking-[0.4em] uppercase font-bold">
            &copy; {new Date().getFullYear()} Velvet Runway Agency &bull; Premium AI Content &bull; Verified 18+
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;