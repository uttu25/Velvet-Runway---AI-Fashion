import React, { useState, useEffect, useCallback } from 'react';
import { ModelCard } from './components/ModelCard';
import { ModelProfile, RevealStage } from './types';
import { generateDailyIdentities, orchestrateModelStages } from './services/geminiService';
import { LegalModals } from './components/LegalModals';
import { TrendsPage } from './components/TrendsPage';
import { AgencyPage } from './components/AgencyPage';

const CACHE_KEY = 'velvet_runway_collection_v2';
const CACHE_DATE_KEY = 'velvet_runway_last_update_v2';
const COOKIE_CONSENT_KEY = 'velvet_runway_cookie_consent';

type ViewState = 'runway' | 'trends' | 'agency';

export const AdSlot: React.FC<{ className?: string; type?: 'horizontal' | 'vertical' | 'square' }> = ({ className, type = 'square' }) => (
  <div className={`bg-neutral-900/40 border border-white/5 flex flex-col items-center justify-center p-4 overflow-hidden relative group rounded-xl ${className}`}>
    <div className="absolute inset-0 bg-gradient-to-br from-[#d4af37]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
    <span className="text-[9px] text-neutral-600 font-bold uppercase tracking-[0.3em] mb-3">Promoted Gallery</span>
    <div className="border border-dashed border-neutral-800 rounded-lg flex items-center justify-center w-full h-full text-neutral-700 text-[10px] text-center p-4 font-mono">
      ADSENSE_DYNAMIC_SLOT_{type.toUpperCase()}
    </div>
  </div>
);

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('runway');
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
          const allStages = await orchestrateModelStages(id, () => {});
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
          console.warn(`Model ${i+1} failed orchestration.`, err);
        }
        setProgress(Math.round(((i + 1) / identities.length) * 100));
      }
      setStatusMessage("Daily Runway Synchronized.");
    } catch (e) {
      setStatusMessage("System Overload. Retrying soon...");
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
      setStatusMessage("Agency Online: Collection Verified.");
    } else {
      startAgencyManager();
    }

    if (!hasConsented) {
      setTimeout(() => setShowCookieConsent(true), 1500);
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
                  {idx > 0 && idx % 8 === 0 && (
                    <div className="hidden lg:block">
                      <AdSlot className="h-full min-h-[450px]" type="vertical" />
                    </div>
                  )}
                  <ModelCard model={model} onUpdate={updateModel} />
                </React.Fragment>
              ))}
              
              {isOrchestrating && models.length < 20 && (
                <div className="w-full aspect-[3/4] bg-neutral-900/20 rounded-2xl border border-white/5 flex flex-col items-center justify-center p-8 text-center">
                    <div className="w-10 h-10 border-2 border-[#d4af37]/20 border-t-[#d4af37] rounded-full animate-spin mb-4"></div>
                    <p className="text-[10px] text-neutral-500 uppercase tracking-[0.2em] font-bold">Curating Showcase...</p>
                </div>
              )}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#020202] text-[#f0f0f0] flex flex-col selection:bg-[#d4af37] selection:text-black">
      {/* Top Banner Ad */}
      <AdSlot type="horizontal" className="h-24 w-full border-b border-white/5 bg-black rounded-none" />

      <header className="sticky top-0 z-50 bg-[#020202]/95 backdrop-blur-xl border-b border-[#d4af37]/20">
        <div className="max-w-[1800px] mx-auto px-6 py-5 flex flex-col md:flex-row justify-between items-center">
          <div 
            className="flex items-center gap-5 mb-6 md:mb-0 cursor-pointer group" 
            onClick={() => { setCurrentView('runway'); window.scrollTo({top: 0, behavior: 'smooth'}); }}
          >
            <div className="w-14 h-14 bg-gradient-to-tr from-[#d4af37] to-[#b8860b] rounded-full flex items-center justify-center shadow-[0_0_25px_rgba(212,175,55,0.3)] group-hover:scale-110 transition-transform duration-500">
              <span className="font-bold text-3xl serif text-black">V</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold serif leading-none gold-glow uppercase tracking-tighter">Velvet Runway</h1>
              <p className="text-[9px] text-neutral-500 tracking-[0.3em] font-bold uppercase mt-1.5">{statusMessage}</p>
            </div>
          </div>

          <nav className="flex items-center gap-10">
            {[
              { id: 'runway', label: 'The Runway' },
              { id: 'trends', label: 'Trend Report' },
              { id: 'agency', label: 'The Agency' }
            ].map((item) => (
              <button 
                key={item.id}
                onClick={() => { setCurrentView(item.id as ViewState); window.scrollTo({top: 0, behavior: 'smooth'}); }}
                className={`text-[11px] font-bold uppercase tracking-[0.25em] transition-all duration-300 relative py-2 ${
                  currentView === item.id ? 'text-[#d4af37]' : 'text-neutral-400 hover:text-white'
                }`}
              >
                {item.label}
                {currentView === item.id && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#d4af37] shadow-[0_0_8px_#d4af37]"></span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {isOrchestrating && (
        <div className="w-full h-[1px] bg-neutral-900">
          <div 
            className="h-full bg-gradient-to-r from-[#d4af37] via-white to-[#b8860b] shadow-[0_0_10px_#d4af37] transition-all duration-1000" 
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <main className="max-w-[1700px] mx-auto px-6 py-16 flex-grow w-full">
        {renderContent()}
      </main>

      {/* Persistent Bottom Monetization */}
      <div className="sticky bottom-0 z-40 w-full bg-[#050505]/95 backdrop-blur-md border-t border-white/5 p-2">
        <div className="max-w-5xl mx-auto h-24">
          <AdSlot type="horizontal" className="h-full border-none bg-transparent" />
        </div>
      </div>

      <footer className="bg-black py-20 px-8 border-t border-white/5">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-16 text-center md:text-left">
          <div className="space-y-6 col-span-1 md:col-span-1">
            <h4 className="serif text-[#d4af37] text-2xl font-bold">Velvet Runway</h4>
            <p className="text-neutral-500 text-xs leading-relaxed">
              The premier AI-curated digital fashion house. Revolutionizing haute couture through high-fidelity neural imagery and automated global trend analysis.
            </p>
          </div>
          
          <div className="flex flex-col gap-4">
            <h5 className="text-[10px] font-bold text-white uppercase tracking-widest mb-2 text-[#d4af37]">Explore</h5>
            <button onClick={() => setCurrentView('runway')} className="text-neutral-500 hover:text-white text-xs transition-colors text-left">Daily Collection</button>
            <button onClick={() => setCurrentView('trends')} className="text-neutral-500 hover:text-white text-xs transition-colors text-left">Trend Analysis</button>
            <button onClick={() => setLegalModal('about')} className="text-neutral-500 hover:text-white text-xs transition-colors text-left">Our Mission</button>
          </div>

          <div className="flex flex-col gap-4">
            <h5 className="text-[10px] font-bold text-white uppercase tracking-widest mb-2 text-[#d4af37]">Legal Documents</h5>
            <button onClick={() => setLegalModal('privacy')} className="text-neutral-500 hover:text-white text-xs transition-colors text-left">Privacy & Cookies</button>
            <button onClick={() => setLegalModal('terms')} className="text-neutral-500 hover:text-white text-xs transition-colors text-left">Terms of Service</button>
            <button onClick={() => setLegalModal('contact')} className="text-neutral-500 hover:text-white text-xs transition-colors text-left">DMCA & Compliance</button>
          </div>

          <div className="space-y-6">
            <h5 className="text-[10px] font-bold text-white uppercase tracking-widest mb-2 text-[#d4af37]">Verification</h5>
            <p className="text-neutral-600 text-[10px] leading-relaxed">
              Velvet Runway uses Google Gemini 2.5 series models. Content is generated for artistic and editorial purposes. 18+ Access Only.
            </p>
            <div className="flex justify-center md:justify-start gap-3">
               <div className="px-3 py-1.5 rounded border border-white/10 text-[9px] text-neutral-500 uppercase font-bold">Secure SSL</div>
               <div className="px-3 py-1.5 rounded border border-white/10 text-[9px] text-neutral-500 uppercase font-bold">AI Native</div>
            </div>
          </div>
        </div>
        
        <div className="mt-20 pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-neutral-700 text-[9px] tracking-[0.5em] uppercase font-bold">
            &copy; {new Date().getFullYear()} VELVET RUNWAY AGENCY &bull; GLOBAL DIGITAL HOUSE
          </p>
          <div className="flex gap-8">
            <span className="text-neutral-800 text-[9px] uppercase tracking-widest">Paris</span>
            <span className="text-neutral-800 text-[9px] uppercase tracking-widest">Milan</span>
            <span className="text-neutral-800 text-[9px] uppercase tracking-widest">Tokyo</span>
            <span className="text-neutral-800 text-[9px] uppercase tracking-widest">New York</span>
          </div>
        </div>
      </footer>

      {showCookieConsent && (
        <div className="fixed bottom-28 left-6 right-6 md:left-auto md:right-8 md:w-[400px] z-[60] bg-[#111] border border-[#d4af37]/30 rounded-2xl p-8 shadow-[0_20px_60px_rgba(0,0,0,0.8)] animate-in slide-in-from-bottom-full duration-500">
          <h4 className="text-[#d4af37] font-bold text-base mb-3 uppercase tracking-widest serif">Cookie Compliance</h4>
          <p className="text-neutral-400 text-xs mb-6 leading-relaxed">
            Velvet Runway uses cookies and similar technologies to personalize content and advertisements through Google AdSense. By continuing to browse, you agree to our data practices.
          </p>
          <div className="flex gap-4">
            <button 
              onClick={handleConsent}
              className="flex-1 bg-[#d4af37] text-black font-bold text-[10px] uppercase py-3 rounded-lg hover:bg-white transition-all shadow-lg"
            >
              Accept Selection
            </button>
            <button 
              onClick={handleConsent}
              className="px-6 text-neutral-500 text-[10px] uppercase font-bold hover:text-white transition-all"
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