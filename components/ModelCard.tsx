import React, { useState, useCallback } from 'react';
import { ModelProfile, RevealStage } from '../types';
import { transformModelOutfit } from '../services/geminiService';

interface ModelCardProps {
  model: ModelProfile;
  onUpdate: (id: string, updates: Partial<ModelProfile>) => void;
}

export const ModelCard: React.FC<ModelCardProps> = ({ model, onUpdate }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);

  const handleInteract = useCallback(async () => {
    if (model.loading) return;

    let nextStage = model.stage;
    if (model.stage === RevealStage.FullyClothed) nextStage = RevealStage.SummerOutfit;
    else if (model.stage === RevealStage.SummerOutfit) nextStage = RevealStage.Bikini;
    else {
        nextStage = RevealStage.FullyClothed;
    }

    if (model.stageImages[nextStage]) {
      onUpdate(model.id, { 
        stage: nextStage, 
        imageUrl: model.stageImages[nextStage] 
      });
      return;
    }

    onUpdate(model.id, { loading: true });

    try {
      const referenceImage = nextStage === RevealStage.FullyClothed 
        ? model.stageImages[RevealStage.FullyClothed]! 
        : model.imageUrl;

      const newImageUrl = await transformModelOutfit(referenceImage, nextStage);
      
      onUpdate(model.id, {
        loading: false,
        stage: nextStage,
        imageUrl: newImageUrl,
        stageImages: {
          ...model.stageImages,
          [nextStage]: newImageUrl
        }
      });
    } catch (error: any) {
      console.error("Failed to transform:", error);
      onUpdate(model.id, { loading: false });
      
      if (error.message?.includes("429") || error.message?.includes("quota")) {
        alert("The Agency is currently busy with other VIP clients (Quota Limit). Please wait a minute before requesting a new look.");
      } else {
        alert("Our stylists hit a roadblock with this specific look. Let's try something else!");
      }
    }
  }, [model, onUpdate]);

  const handleCustomEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customPrompt.trim() || model.loading) return;

    onUpdate(model.id, { loading: true });
    try {
      const newImageUrl = await transformModelOutfit(model.imageUrl, model.stage, customPrompt);
       onUpdate(model.id, {
        loading: false,
        imageUrl: newImageUrl,
      });
      setShowCustomInput(false);
      setCustomPrompt("");
    } catch (err: any) {
      onUpdate(model.id, { loading: false });
      if (err.message?.includes("429") || err.message?.includes("quota")) {
        alert("Style queue is full. Please try again in a few moments.");
      } else {
        alert("Could not process that specific edit. Our stylists might be finding it too complex.");
      }
    }
  };

  return (
    <div 
      className="relative group w-full aspect-[3/4] rounded-xl overflow-hidden shadow-2xl transition-transform duration-300 hover:scale-[1.02] bg-neutral-900 border border-white/5"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Layer */}
      <img 
        src={model.imageUrl} 
        alt={model.name}
        key={model.imageUrl}
        className={`w-full h-full object-cover transition-opacity duration-500 ${model.loading ? 'opacity-40 blur-sm' : 'opacity-100'}`}
      />

      {/* Loading Overlay */}
      {model.loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-black/40">
          <div className="w-12 h-12 border-4 border-[#d4af37] border-t-transparent rounded-full animate-spin mb-3 shadow-[0_0_15px_rgba(212,175,55,0.5)]"></div>
          <span className="text-[#d4af37] text-[10px] tracking-[0.2em] font-bold uppercase animate-pulse gold-glow">Styling...</span>
        </div>
      )}

      {/* Info Overlay */}
      <div className={`absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent transition-opacity duration-300 flex flex-col justify-end p-6 ${isHovered || showCustomInput ? 'opacity-100' : 'opacity-0'}`}>
        
        <h3 className="text-2xl font-bold text-white serif mb-1 gold-glow">{model.name}</h3>
        <p className="text-neutral-400 text-xs mb-4 line-clamp-2 leading-relaxed">{model.description}</p>
        
        {!showCustomInput ? (
          <div className="flex gap-2">
            <button 
              onClick={handleInteract}
              disabled={model.loading}
              className="flex-1 bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-black text-xs font-bold uppercase tracking-wider py-3.5 px-4 rounded-lg shadow-lg transform transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {model.stage === RevealStage.FullyClothed && "Summer Look"}
              {model.stage === RevealStage.SummerOutfit && "Beach Ready"}
              {model.stage === RevealStage.Bikini && "Reset Style"}
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); setShowCustomInput(true); }}
              className="bg-neutral-800/80 backdrop-blur-sm border border-white/10 hover:bg-neutral-700 text-white p-3 rounded-lg transition"
              title="Custom Stylist"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l2.846-.813a11.121 11.121 0 0 0 3.58-1.059l5.056-5.056a1.125 1.125 0 0 0 0-1.59l-2.06-2.06a1.125 1.125 0 0 0-1.59 0l-5.056 5.056a11.123 11.123 0 0 0-1.06 3.58Z" />
              </svg>
            </button>
          </div>
        ) : (
          <form onSubmit={handleCustomEdit} className="flex flex-col gap-2">
            <input 
              type="text" 
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="e.g., leather jacket, silk scarf..."
              className="w-full bg-neutral-900/90 backdrop-blur border border-white/10 text-white text-xs rounded-lg px-3 py-2.5 focus:outline-none focus:border-[#d4af37]"
              autoFocus
            />
            <div className="flex gap-2">
              <button 
                type="submit"
                className="flex-1 bg-[#d4af37] text-black text-[10px] font-bold py-2.5 rounded uppercase tracking-wider hover:bg-[#f9e29f]"
              >
                Apply
              </button>
              <button 
                type="button"
                onClick={() => setShowCustomInput(false)}
                className="px-4 bg-neutral-800 text-white text-[10px] font-bold py-2.5 rounded uppercase tracking-wider hover:bg-neutral-700"
              >
                X
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Stage Indicator Dots */}
      <div className="absolute top-4 right-4 flex gap-1.5">
         {[0, 1, 2].map(s => (
           <div 
            key={s} 
            className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${model.stage >= s ? 'bg-[#d4af37] shadow-[0_0_8px_rgba(212,175,55,0.8)]' : 'bg-white/20'}`}
           />
         ))}
      </div>
    </div>
  );
};