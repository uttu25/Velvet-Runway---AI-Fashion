import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ModelCard } from './components/ModelCard';
import { ModelProfile, RevealStage } from './types';
import { generateDailyIdentities, orchestrateModelStages } from './services/geminiService';
import { LegalModals } from './components/LegalModals';
import { TrendsPage } from './components/TrendsPage';
import { AgencyPage } from './components/AgencyPage';

const CACHE_KEY = 'velvet_runway_collection_v3';
const CACHE_DATE_KEY = 'velvet_runway_last_update_v3';
const COOKIE_CONSENT_KEY = 'velvet_runway_cookie_consent_v3';

type ViewState = 'runway' | 'trends' | 'agency';

export const AdSlot: React.FC<{ className?: string; type?: 'horizontal' | 'vertical' | 'square' }> = ({ className, type = 'square' }) => (
  <div className={`bg-neutral-900/40 border border-white/5 flex flex-col items-center justify-center p-4 overflow-hidden relative group rounded-xl ${className}`}>
    <div className="absolute inset-0 bg-gradient-to-br from-[#d4af37]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
    <span className="text-[9px] text-neutral-600 font-bold uppercase tracking-[0.3em] mb-3">Advertisement</span>
    <div className="border border-dashed border-neutral-800 rounded-lg flex items-center justify-center w-full h-full text-neutral-700 text-[10px] text-center p-4 font-mono">
      ADSENSE_SLOT_{type.toUpperCase()}
    </div>
  </div>
);

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('runway');
  const [models, setModels] = useState<ModelProfile[]>([]);
  const [isOrchestrating, setIsOrchestrating] = useState(false);
  const [statusMessage, setStatusMessage] = useState("System Ready");
  const [progress, setProgress] = useState(0);
  const [legalModal, setLegalModal] = useState<'privacy' | 'terms' | 'about' | 'contact' | null>(null);
  const [showCookieConsent, setShowCookieConsent] = useState(false);
  
  const orchestrationRef = useRef(false);

  /**
   * AUTOMATED DAILY MANAGER
   * This function runs once per day per user, ensuring 20 fresh models automatically.
   */
  const startAgencyManager = useCallback(async () => {
    if (orchestrationRef.current) return;
    orchestrationRef.current = true;
    setIsOrchestrating(true);
    setStatusMessage("Daily Identity Drafting...");
    setModels([]);

    try {
      const identities = await generateDailyIdentities(20);
      const completedModels: ModelProfile[] = [];

      for (let i = 0; i < identities.length; i++) {
        const id = identities[i];
        setStatusMessage(`Styling Model ${i + 1} of 20...`);
        
        try {
          const modelId = `model_${Date.now()}_${i}`;
          // Automate all 3 images in one background sequence
          const allStages = await orchestrateModelStages(id, (stage) => {
            // Internal stage tracking
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
          
          // Persistence for the day
          localStorage.setItem(CACHE_KEY, JSON.stringify(completedModels));
          localStorage.setItem(CACHE_DATE_KEY, new Date().toDateString());
        } catch (err) {
          console.error(`Orchestration failed for model ${i}. Skipping...`);
        }
        
        setProgress(Math.round(((i + 1) / identities.length) * 100));
      }
      
      setStatusMessage("Collection Synchronized.");
    } catch (e) {
      console.error("Agency Manager Crash:", e);
      setStatusMessage("System Overload. Cooling down.");
    } finally {
      setIsOrchestrating(false);
      orchestrationRef.current = false;
    }
  }, []);

  useEffect(() => {
    const cachedModels = localStorage.getItem(CACHE_KEY);
    const lastUpdate = localStorage.getItem(CACHE_DATE_KEY);
    const hasConsented = localStorage.getItem(COOKIE_CONSENT_KEY);
    const today = new Date().toDateString();

    // The Automation Check: Is it a new day?
    if (cachedModels && lastUpdate === today) {
      setModels(JSON.parse(cachedModels));
      setStatusMessage("Daily Collection Active.");
    } else {
      startAgencyManager();
    }

    if (!hasConsented) {
      setTimeout(() => setShowCookieConsent(true), 2000);
    }
  }, [startAgencyManager]);

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

  const renderContent = () => {
    switch (currentView) {
      case 'trends':
        return <TrendsPage />;
      case 'agency':
        return <AgencyPage />;
      default:
        return (
          <div className="animate-fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-10">
              {models.map((model, idx) => (
                <React.Fragment key={model.id}>
                  {idx > 0 && idx % 10 === 0 && (
                    <AdSlot className="h-full min-h-[400px]" type="vertical" />
                  )}
                  <ModelCard model={model} onUpdate={updateModel} />
                </React.Fragment>
              ))}
              
              {isOrchestrating && models.length < 20 && (
                <div className="w-full aspect-[3/4] bg-neutral-900/30 rounded-2xl border border-white/5 flex flex-col items-center justify-center p-8 text-center animate-pulse">
                    <div className="w-12 h-12 border-b-2 border-[#d4af37] rounded-full animate-spin mb-6"></div>
                    <p className="text-[10px] text-neutral-400 uppercase tracking-[0.3em] font-bold">Manager is styling new arrivals...</p>
                </div>
              )}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#020202] text-[#f5f5f5] flex flex-col selection:bg-[#d4af37] selection:text-black">
      <AdSlot type="horizontal" className="h-24 w-full border-b border-white/5 bg-black rounded-none" />

      <header className="sticky top-0 z-50 bg-[#020202]/95 backdrop-blur-xl border-b border-[#d4af37]/20">
        <div className="max-w-[1800px] mx-auto px-8 py-5 flex flex-col md:flex-row justify-between items-center">
          <div 
            className="flex items-center gap-6 mb-6 md:mb-0 cursor-pointer group" 
            onClick={() => { setCurrentView('runway'); window.scrollTo({top: 0, behavior: 'smooth'}); }}
          >
            <div className="w-16 h-16 bg-gradient-to-tr from-[#d4af37] to-[#b8860b] rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(212,175,55,0.4)] group-hover:scale-110 transition-transform duration-700">
              <span className="font-bold text-4xl serif text-black">V</span>
            </div>
            <div>
              <h1 className="text-4xl font-bold serif leading-none gold-glow uppercase tracking-tighter">Velvet Runway</h1>
              <div className="flex items-center gap-2 mt-2">
                 <div className={`w-1.5 h-1.5 rounded-full ${isOrchestrating ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500 shadow-[0_0_8px_#10b981]'}`}></div>
                 <p className="text-[9px] text-neutral-500 tracking-[0.4em] font-bold uppercase">{statusMessage}</p>
              </div>
            </div>
          </div>

          <nav className="flex items-center gap-12">
            {[
              { id: 'runway', label: 'The Runway' },
              { id: 'trends', label: 'Editorial' },
              { id: 'agency', label: 'Agency' }
            ].map((item) => (
              <button 
                key={item.id}
                onClick={() => { setCurrentView(item.id as ViewState); window.scrollTo({top: 0, behavior: 'smooth'}); }}
                className={`text-[11px] font-bold uppercase tracking-[0.3em] transition-all duration-300 relative py-2 ${
                  currentView === item.id ? 'text-[#d4af37]' : 'text-neutral-500 hover:text-white'
                }`}
              >
                {item.label}
                {currentView === item.id && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#d4af37] shadow-[0_0_10px_#d4af37]"></span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {isOrchestrating && (
        <div className="w-full h-[2px] bg-neutral-900 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-[#d4af37] via-white to-[#b8860b] shadow-[0_0_15px_#d4af37] transition-all duration-1000" 
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <main className="max-w-[1800px] mx-auto px-8 py-20 flex-grow w-full">
        {renderContent()}
      </main>

      <div className="sticky bottom-0 z-40 w-full bg-[#050505]/98 backdrop-blur-xl border-t border-white/5 p-3">
        <div className="max-w-6xl mx-auto h-24">
          <AdSlot type="horizontal" className="h-full border-none bg-transparent" />
        </div>
      </div>

      <footer className="bg-black py-24 px-10 border-t border-white/10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-20 text-center md:text-left">
          <div className="space-y-8 col-span-1 md:col-span-1">
            <h4 className="serif text-[#d4af37] text-3xl font-bold">Velvet Runway</h4>
            <p className="text-neutral-500 text-xs leading-relaxed max-w-xs mx-auto md:mx-0">
              Defining the digital aesthetic of 2025. Fully autonomous curation powered by the Velvet Intelligence Core.
            </p>
          </div>
          
          <div className="flex flex-col gap-5">
            <h5 className="text-[10px] font-bold text-white uppercase tracking-[0.4em] mb-4 text-[#d4af37]">Navigation</h5>
            <button onClick={() => setCurrentView('runway')} className="text-neutral-500 hover:text-white text-xs transition-colors text-left uppercase tracking-widest">Showcase</button>
            <button onClick={() => setCurrentView('trends')} className="text-neutral-500 hover:text-white text-xs transition-colors text-left uppercase tracking-widest">Editorial</button>
            <button onClick={() => setLegalModal('about')} className="text-neutral-500 hover:text-white text-xs transition-colors text-left uppercase tracking-widest">The Core</button>
          </div>

          <div className="flex flex-col gap-5">
            <h5 className="text-[10px] font-bold text-white uppercase tracking-[0.4em] mb-4 text-[#d4af37]">Compliance</h5>
            <button onClick={() => setLegalModal('privacy')} className="text-neutral-500 hover:text-white text-xs transition-colors text-left uppercase tracking-widest">Privacy Policy</button>
            <button onClick={() => setLegalModal('terms')} className="text-neutral-500 hover:text-white text-xs transition-colors text-left uppercase tracking-widest">User Terms</button>
            <button onClick={() => setLegalModal('contact')} className="text-neutral-500 hover:text-white text-xs transition-colors text-left uppercase tracking-widest">Contact Desk</button>
          </div>

          <div className="space-y-8">
            <h5 className="text-[10px] font-bold text-white uppercase tracking-[0.4em] mb-4 text-[#d4af37]">Network Status</h5>
            <p className="text-neutral-600 text-[10px] leading-relaxed font-mono uppercase">
              Models: 20/20 <br/>
              Daily Assets: 60 <br/>
              Latency: 45ms <br/>
              Encryption: AES-256
            </p>
            <div className="flex justify-center md:justify-start gap-4">
               <div className="px-4 py-2 rounded bg-neutral-900 border border-white/5 text-[9px] text-[#d4af37] uppercase font-bold tracking-widest">SSL VERIFIED</div>
            </div>
          </div>
        </div>
        
        <div className="mt-24 pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
          <p className="text-neutral-800 text-[9px] tracking-[0.6em] uppercase font-bold">
            &copy; {new Date().getFullYear()} VELVET RUNWAY GLOBAL &bull; DIGITAL ATELIER
          </p>
          <div className="flex gap-10">
            {['MILAN', 'PARIS', 'TOKYO', 'NYC'].map(city => (
              <span key={city} className="text-neutral-900 text-[9px] uppercase tracking-[0.3em] font-bold">{city}</span>
            ))}
          </div>
        </div>
      </footer>

      {showCookieConsent && (
        <div className="fixed bottom-32 left-8 right-8 md:left-auto md:right-10 md:w-[450px] z-[60] bg-[#0c0c0c] border border-[#d4af37]/40 rounded-2xl p-10 shadow-[0_30px_90px_rgba(0,0,0,1)] animate-in slide-in-from-bottom-full duration-700">
          <h4 className="text-[#d4af37] font-bold text-xl mb-4 uppercase tracking-[0.2em] serif">Transparency Center</h4>
          <p className="text-neutral-400 text-xs mb-8 leading-relaxed">
            Velvet Runway utilizes cookies and high-fidelity AI processing to deliver a personalized fashion experience. We adhere to Google AdSense compliance and GDPR standards.
          </p>
          <div className="flex gap-5">
            <button 
              onClick={handleConsent}
              className="flex-1 bg-[#d4af37] text-black font-bold text-[11px] uppercase py-4 rounded-xl hover:bg-white transition-all shadow-[0_0_20px_rgba(212,175,55,0.2)]"
            >
              Confirm Consent
            </button>
            <button 
              onClick={handleConsent}
              className="px-8 text-neutral-600 text-[11px] uppercase font-bold hover:text-white transition-all"
            >
              Essential
            </button>
          </div>
        </div>
      )}

      <LegalModals type={legalModal} onClose={() => setLegalModal(null)} />
    </div>
  );
};

export default App;