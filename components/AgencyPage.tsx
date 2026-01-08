import React from 'react';

export const AgencyPage: React.FC = () => {
  const stats = [
    { label: "Daily Curations", value: "20+" },
    { label: "Global Presence", value: "48 Cities" },
    { label: "AI Fidelity", value: "8K Ultra" },
    { label: "Neural Training", value: "Real-time" }
  ];

  return (
    <div className="max-w-5xl mx-auto animate-fade-in space-y-24">
      <section className="text-center space-y-8 py-10">
        <h2 className="text-5xl md:text-7xl font-bold serif gold-glow">Beyond Human. <br/> Beyond Boundaries.</h2>
        <p className="text-neutral-500 text-sm max-w-2xl mx-auto leading-relaxed">
          Velvet Runway is the world’s first autonomous digital fashion agency. Founded in 2024, our mission is to redefine the creative landscape by merging advanced neural synthesis with high-fashion sensibilities.
        </p>
      </section>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
        {stats.map((stat, i) => (
          <div key={i} className="text-center space-y-2 p-8 border border-white/5 rounded-2xl bg-[#080808]">
            <span className="text-3xl font-bold serif text-[#d4af37]">{stat.value}</span>
            <p className="text-[9px] text-neutral-600 font-bold uppercase tracking-[0.2em]">{stat.label}</p>
          </div>
        ))}
      </div>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
        <div className="space-y-8">
          <h3 className="text-4xl font-bold serif">Our Philosophy</h3>
          <p className="text-neutral-400 text-sm leading-relaxed">
            We believe that beauty is an algorithmic symphony. Our AI models are not just pixels—they are meticulously crafted identities with unique traits, personas, and fashion journeys. 
          </p>
          <p className="text-neutral-400 text-sm leading-relaxed">
            By leveraging the Gemini Nano series, Velvet Runway generates 60+ high-fidelity assets daily, ensuring that the fashion world never stops evolving, 24 hours a day, 7 days a week.
          </p>
          <ul className="space-y-4">
            {['Ethical AI Generation', 'Sustainable Digital Fashion', 'Global Diversity Standards', 'High-Fidelity Rendering'].map(item => (
              <li key={item} className="flex items-center gap-3 text-xs text-[#d4af37]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37]"></span>
                <span className="uppercase tracking-widest font-bold">{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="aspect-square bg-neutral-900 rounded-3xl overflow-hidden relative border border-[#d4af37]/20 shadow-[0_0_40px_rgba(212,175,55,0.1)]">
          <div className="absolute inset-0 flex items-center justify-center p-12">
            <div className="text-center space-y-4">
                <div className="w-24 h-24 bg-gradient-to-tr from-[#d4af37] to-white rounded-full mx-auto animate-pulse opacity-50"></div>
                <h4 className="serif text-2xl">The Neural Core</h4>
                <p className="text-[10px] text-neutral-500 uppercase tracking-widest">Running Live in 14 Regions</p>
            </div>
          </div>
        </div>
      </section>

      <section className="text-center py-20 border-t border-white/5">
        <h3 className="serif text-3xl mb-8">Ready to join the digital revolution?</h3>
        <div className="flex justify-center gap-6">
          <button className="px-10 py-4 bg-[#d4af37] text-black font-bold uppercase text-[10px] tracking-widest rounded-full hover:scale-105 transition-transform">Apply for Casting</button>
          <button className="px-10 py-4 bg-white text-black font-bold uppercase text-[10px] tracking-widest rounded-full hover:scale-105 transition-transform">Partner with us</button>
        </div>
      </section>
    </div>
  );
};