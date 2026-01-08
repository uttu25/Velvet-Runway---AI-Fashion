import React, { useState, useEffect, useCallback } from 'react';
import { ModelCard } from './components/ModelCard';
import { ModelProfile, RevealStage } from './types';
import { generateDailyIdentities, orchestrateModelStages } from './services/geminiService';
import { LegalModals } from './components/LegalModals';

const CACHE_KEY = 'velvet_runway_collection_v2';
const CACHE_DATE_KEY = 'velvet_runway_last_update_v2';
const COOKIE_CONSENT_KEY = 'velvet_runway_cookie_consent';

const AdSlot: React.FC<{ className?: string; type?: 'horizontal' | 'vertical' | 'square' }> = ({ className, type = 'square' }) => (
  <div className={`bg-neutral-900 border border-white/5 flex flex-col items-center justify-center p-4 overflow-hidden relative group ${className}`}>
    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
    <span className="text-[10px] text-neutral-600 font-bold uppercase tracking-widest mb-2">Advertisement</span>
    <div className={`border-2 border-dashed border-neutral-800 rounded flex items-center justify-center w-full h-full text-neutral-700 text-xs text-center p-2`}>
      {type === 'horizontal' ? 'Leaderboard 728x90' : type === 'vertical' ? 'Skyscraper 160x600' : 'Responsive Square'}
    </div>
    {/* Real AdSense Implementation code would go here */}
  </div>
);

const App: React.FC = () => {
  const [models, setModels] = useState<ModelProfile[]>([]);
  const [isOrchestrating, setIsOrchestrating] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [progress, setProgress] = useState(0);
  const [legalModal, setLegalModal] = useState<'privacy' | 'terms' | 'about' | 'contact' | null>(null);
  const [showCookieConsent, setShowCookieConsent] = useState(false);

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
        setStatusMessage(`Styling Model ${i + 1} of 20...`);
        try {
          const modelId = Math.random().toString(36).substring(7);
          const allStages = await orchestrateModelStages(id, (stage, url) => {});
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
          localStorage.setItem(CACHE_KEY, JSON.stringify(completedModels));
          localStorage.setItem(CACHE_DATE_KEY, new Date().toDateString());
        } catch (err) {
          console.warn(`Model ${i+1} skip.`, err);
        }
        setProgress(Math.round(((i + 1) / identities.length) * 100));
      }
      setStatusMessage("Daily Runway Synchronized.");
    } catch (e) {
      setStatusMessage("Agency Busy. Retrying...");
    } finally {
      setIsOrchestrating(false);
    }
  }, [isOrchestrating]);

  useEffect(() => {
    const cachedModels = localStorage.getItem(CACHE_KEY);
    const lastUpdate = localStorage.getItem(CACHE_DATE_KEY);
    const hasConsented = localStorage.getItem(COOKIE_CONSENT_KEY);
    const today = new Date().toDateString();

    if (cachedModels && lastUpdate === today) {
      setModels(JSON.parse(cachedModels));
      setStatusMessage("Collection Verified & Ready.");
    } else {
      startAgencyManager();
    }

    if (!hasConsented) {
      setTimeout(() => setShowCookieConsent(true), 2000);
    }
  }, []);

  const handleConsent = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'true');
    setShowCookieConsent(false);
  };

  const updateModel = (id: string, updates: Partial<ModelProfile>) => {
    setModels(prev => {
      const updated = prev.map(m => m.id === id ? { ...m, ...updates } : m);
      localStorage.setItem(CACHE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <div className="min-h-screen bg-[#020202] text-[#f0f0f0] flex flex-col selection:bg-[#d4af37] selection:text-black">
      <AdSlot type="horizontal" className="h-24 w-full border-b border-white/5 bg-black" />

      <header className="sticky top-0 z-50 bg-[#020202]/90 backdrop-blur-xl border-b border-[#d4af37]/20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center gap-4 mb-4 md:mb-0 cursor-pointer" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
            <div className="w-12 h-12 bg-gradient-to-tr from-[#d4af37] to-[#b8860b] rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(212,175,55,0.3)]">
              <span className="font-bold text-2xl serif text-black">V</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold serif leading-none gold-glow uppercase tracking-tighter">Velvet Runway</h1>
              <p className="text-[8px] text-neutral-500 tracking-[0.3em] font-bold uppercase mt-1">{statusMessage}</p>
            </div>
          </div>

          <nav className="flex items-center gap-8">
            {['about', 'privacy', 'contact'].map((item) => (
              <button 
                key={item}
                onClick={() => setLegalModal(item as any)}
                className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 hover:text-[#d4af37] transition-colors"
              >
                {item}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {isOrchestrating && (
        <div className="w-full h-1 bg-neutral-900">
          <div 
            className="h-full bg-gradient-to-r from-[#d4af37] to-[#b8860b] shadow-[0_0_10px_#d4af37] transition-all duration-1000" 
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <main className="max-w-[1700px] mx-auto px-6 py-12 flex-grow">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-10">
          {models.map((model, idx) => (
            <React.Fragment key={model.id}>
              {idx > 0 && idx % 8 === 0 && (
                <div className="hidden lg:block">
                  <AdSlot className="rounded-2xl h-full min-h-[450px]" type="vertical" />
                </div>
              )}
              <ModelCard model={model} onUpdate={updateModel} />
            </React.Fragment>
          ))}
          
          {isOrchestrating && models.length < 20 && (
             <div className="w-full aspect-[3/4] bg-neutral-900/30 rounded-2xl border border-white/5 flex flex-col items-center justify-center p-8 text-center">
                <div className="w-8 h-8 border-2 border-[#d4af37]/20 border-t-[#d4af37] rounded-full animate-spin mb-4"></div>
                <p className="text-[10px] text-neutral-500 uppercase tracking-widest leading-relaxed">Agent is curating today's lineup...</p>
             </div>
          )}
        </div>
      </main>

      {/* Footer Monetization */}
      <div className="sticky bottom-0 z-40 w-full bg-[#050505]/95 backdrop-blur-md border-t border-white/5 p-2">
        <div className="max-w-4xl mx-auto h-24">
          <AdSlot type="horizontal" className="h-full border-none bg-transparent" />
        </div>
      </div>

      <footer className="bg-black py-16 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 text-center md:text-left">
          <div className="space-y-4">
            <h4 className="serif text-[#d4af37] text-xl">Velvet Runway</h4>
            <p className="text-neutral-500 text-xs leading-relaxed max-w-xs mx-auto md:mx-0">
              The world's first fully automated AI high-fashion agency. Daily collections curated by neural agents for the modern elite.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <h5 className="text-[10px] font-bold text-white uppercase tracking-widest mb-2">Legal Docs</h5>
            <button onClick={() => setLegalModal('privacy')} className="text-neutral-500 hover:text-white text-xs transition-colors">Privacy Policy</button>
            <button onClick={() => setLegalModal('terms')} className="text-neutral-500 hover:text-white text-xs transition-colors">Terms of Service</button>
            <button onClick={() => setLegalModal('contact')} className="text-neutral-500 hover:text-white text-xs transition-colors">DMCA Notice</button>
          </div>
          <div className="space-y-4">
            <h5 className="text-[10px] font-bold text-white uppercase tracking-widest mb-2">Certified Content</h5>
            <p className="text-neutral-600 text-[10px] leading-relaxed">
              All images are 100% AI-generated. 18+ Verification required. AdSense Compliant & Secure.
            </p>
            <div className="flex justify-center md:justify-start gap-4">
               <div className="w-8 h-8 rounded border border-white/10 flex items-center justify-center text-[10px] text-neutral-600">SSL</div>
               <div className="w-8 h-8 rounded border border-white/10 flex items-center justify-center text-[10px] text-neutral-600">AI</div>
            </div>
          </div>
        </div>
        <div className="mt-16 pt-8 border-t border-white/5 text-center">
          <p className="text-neutral-700 text-[9px] tracking-[0.5em] uppercase font-bold">
            &copy; {new Date().getFullYear()} VELVET RUNWAY AGENCY &bull; ALL RIGHTS RESERVED
          </p>
        </div>
      </footer>

      {/* Cookie Consent Banner */}
      {showCookieConsent && (
        <div className="fixed bottom-28 left-6 right-6 md:left-auto md:right-8 md:w-96 z-[60] bg-[#111] border border-[#d4af37]/40 rounded-xl p-6 shadow-2xl animate-in slide-in-from-bottom-full duration-500">
          <h4 className="text-[#d4af37] font-bold text-sm mb-2 uppercase tracking-wide">Cookie Preferences</h4>
          <p className="text-neutral-400 text-xs mb-4 leading-relaxed">
            We use cookies to improve your experience and serve relevant ads via Google AdSense. By continuing, you agree to our <button onClick={() => setLegalModal('privacy')} className="underline">Privacy Policy</button>.
          </p>
          <div className="flex gap-3">
            <button 
              onClick={handleConsent}
              className="flex-1 bg-[#d4af37] text-black font-bold text-[10px] uppercase py-2.5 rounded hover:bg-white transition-all"
            >
              Accept All
            </button>
            <button 
              onClick={handleConsent}
              className="px-4 text-neutral-500 text-[10px] uppercase hover:text-white transition-all"
            >
              Essential Only
            </button>
          </div>
        </div>
      )}

      <LegalModals type={legalModal} onClose={() => setLegalModal(null)} />
    </div>
  );
};

export default App;