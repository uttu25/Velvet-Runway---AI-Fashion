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

    // Determine next stage
    let nextStage = model.stage;
    if (model.stage === RevealStage.FullyClothed) nextStage = RevealStage.SummerOutfit;
    else if (model.stage === RevealStage.SummerOutfit) nextStage = RevealStage.Bikini;
    else {
        // Reset cycle or do nothing? Let's cycle back to clothed if they want, 
        // but typically "undressing" is one way. Let's allow reset.
        nextStage = RevealStage.FullyClothed;
    }

    // Check if we already have this image cached
    if (model.stageImages[nextStage]) {
      onUpdate(model.id, { 
        stage: nextStage, 
        imageUrl: model.stageImages[nextStage] 
      });
      return;
    }

    // Start Loading
    onUpdate(model.id, { loading: true });

    try {
      // If we are resetting to 0 and have it (handled above), else we regenerate.
      // But actually, for the "undressing" logic, we transform the CURRENT image.
      // EXCEPT: If we transform a bikini image back to clothes, it might look weird.
      // Best path: Use the ORIGINAL image (Stage 0) as reference for intermediate steps 
      // if we want consistency, or the current one.
      // For "sequentially undressing":
      // Clothed -> Remove Upper (SummerOutfit) -> Remove Lower (Bikini).
      
      // We will use the current image to progress.
      const newImageUrl = await transformModelOutfit(model.imageUrl, nextStage);
      
      onUpdate(model.id, {
        loading: false,
        stage: nextStage,
        imageUrl: newImageUrl,
        stageImages: {
          ...model.stageImages,
          [nextStage]: newImageUrl
        }
      });
    } catch (error) {
      console.error("Failed to transform", error);
      onUpdate(model.id, { loading: false });
      alert("She's shy right now! (API Error or Safety Block)");
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
        // We don't cache custom edits in the stage map to preserve the "sequence" logic flow
      });
      setShowCustomInput(false);
      setCustomPrompt("");
    } catch (err) {
      onUpdate(model.id, { loading: false });
      alert("Could not process that edit.");
    }
  };

  return (
    <div 
      className="relative group w-full aspect-[3/4] rounded-xl overflow-hidden shadow-2xl transition-transform duration-300 hover:scale-[1.02] bg-neutral-900"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Layer */}
      <img 
        src={model.imageUrl} 
        alt={model.name}
        className={`w-full h-full object-cover transition-opacity duration-500 ${model.loading ? 'opacity-50 blur-sm' : 'opacity-100'}`}
      />

      {/* Loading Overlay */}
      {model.loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
          <div className="w-10 h-10 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mb-2"></div>
          <span className="text-pink-300 text-xs tracking-widest font-bold uppercase animate-pulse">Transforming...</span>
        </div>
      )}

      {/* Info Overlay (Visible on Hover or if Text Input open) */}
      <div className={`absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent transition-opacity duration-300 flex flex-col justify-end p-6 ${isHovered || showCustomInput ? 'opacity-100' : 'opacity-0'}`}>
        
        <h3 className="text-2xl font-bold text-white serif mb-1">{model.name}</h3>
        <p className="text-neutral-300 text-sm mb-4 line-clamp-2">{model.description}</p>
        
        {!showCustomInput ? (
          <div className="flex gap-2">
            <button 
              onClick={handleInteract}
              disabled={model.loading}
              className="flex-1 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-medium py-3 px-4 rounded-lg shadow-lg transform transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {model.stage === RevealStage.FullyClothed && "Summer Look"}
              {model.stage === RevealStage.SummerOutfit && "Beach Ready"}
              {model.stage === RevealStage.Bikini && "Reset Look"}
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); setShowCustomInput(true); }}
              className="bg-neutral-800 hover:bg-neutral-700 text-white p-3 rounded-lg transition"
              title="Custom Edit"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
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
              placeholder="E.g., Add a retro filter..."
              className="w-full bg-neutral-800/80 backdrop-blur border border-neutral-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-pink-500"
              autoFocus
            />
            <div className="flex gap-2">
              <button 
                type="submit"
                className="flex-1 bg-pink-600 text-white text-xs font-bold py-2 rounded uppercase tracking-wider hover:bg-pink-500"
              >
                Generate
              </button>
              <button 
                type="button"
                onClick={() => setShowCustomInput(false)}
                className="px-3 bg-neutral-700 text-white text-xs font-bold py-2 rounded hover:bg-neutral-600"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Stage Indicator */}
      <div className="absolute top-4 right-4 flex gap-1">
         {[0, 1, 2].map(s => (
           <div 
            key={s} 
            className={`w-2 h-2 rounded-full shadow-sm ${model.stage >= s ? 'bg-pink-500 box-shadow-glow' : 'bg-neutral-600'}`}
           />
         ))}
      </div>
    </div>
  );
};