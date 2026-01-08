import React from 'react';
import { AdSlot } from '../App';

export const TrendsPage: React.FC = () => {
  const articles = [
    {
      category: "Runway Report",
      title: "The Neo-Classical Shift: Why AI Fashion is Embracing Silk and Sheer",
      excerpt: "This season, digital ateliers are moving away from sharp cyber-esthetics in favor of soft, fluid textiles. We explore how neural networks are learning the delicate fall of silk...",
      date: "May 12, 2025",
      readTime: "5 min read"
    },
    {
      category: "Market Insights",
      title: "The Rise of the Virtual Muse: High Fashion’s New Frontier",
      excerpt: "Top fashion houses are increasingly turning to AI personas to headline their summer campaigns. Velvet Runway analyzes the economic impact of virtual identity...",
      date: "May 11, 2025",
      readTime: "8 min read"
    },
    {
      category: "Style Guide",
      title: "Monochrome & Metallic: Curating the Perfect Digital Wardrobe",
      excerpt: "How to balance high-contrast lighting with sophisticated textures. Our lead stylists break down the essentials for this month's collection...",
      date: "May 10, 2025",
      readTime: "4 min read"
    }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-20 animate-fade-in">
      <header className="text-center space-y-4">
        <h2 className="text-5xl md:text-7xl font-bold serif gold-glow">The Trend Report</h2>
        <p className="text-neutral-500 tracking-[0.4em] uppercase text-xs font-bold">Daily Intelligence & Editorial Depth</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
        <div className="md:col-span-2 space-y-16">
          {articles.map((article, i) => (
            <article key={i} className="group border-b border-white/5 pb-12 hover:border-[#d4af37]/30 transition-colors cursor-pointer">
              <span className="text-[#d4af37] text-[10px] font-bold uppercase tracking-widest">{article.category}</span>
              <h3 className="text-3xl md:text-4xl font-bold serif mt-4 mb-4 group-hover:text-[#d4af37] transition-colors">{article.title}</h3>
              <p className="text-neutral-400 leading-relaxed mb-6 text-sm">{article.excerpt}</p>
              <div className="flex items-center gap-6 text-[10px] text-neutral-600 font-bold uppercase tracking-widest">
                <span>{article.date}</span>
                <span>{article.readTime}</span>
              </div>
            </article>
          ))}
        </div>

        <aside className="space-y-12">
          <div className="bg-[#111] p-8 rounded-2xl border border-white/5">
            <h4 className="serif text-xl mb-6 text-[#d4af37]">Editor's Note</h4>
            <p className="text-neutral-400 text-xs leading-relaxed italic">
              "Velvet Runway is not just about imagery; it's about the narrative of beauty in the age of intelligence. Every piece in our daily collection is a reflection of global cultural shifts."
            </p>
            <div className="mt-6 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#d4af37]/20 flex items-center justify-center text-[#d4af37] text-[10px] font-bold">V</div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-300">Runway Agent Alpha</span>
            </div>
          </div>
          
          <AdSlot type="square" className="h-[400px]" />
          
          <div className="space-y-6">
            <h4 className="text-[10px] font-bold text-white uppercase tracking-widest">Popular This Week</h4>
            {[1, 2, 3].map(n => (
              <div key={n} className="flex gap-4 items-center group cursor-pointer">
                <span className="text-2xl font-bold serif text-neutral-800 group-hover:text-[#d4af37]">0{n}</span>
                <p className="text-xs text-neutral-400 group-hover:text-white transition-colors">Decoding the algorithmic aesthetic of the Milanese summer.</p>
              </div>
            ))}
          </div>
        </aside>
      </div>
      
      <section className="bg-neutral-900/30 rounded-3xl p-12 text-center space-y-8 border border-white/5">
        <h3 className="text-3xl font-bold serif">Subscribe to Velvet Intelligence</h3>
        <p className="text-neutral-500 text-sm max-w-xl mx-auto">Get exclusive AI-generated styling tips and early access to the 4K Daily Collection directly in your inbox.</p>
        <div className="flex max-w-md mx-auto gap-4">
          <input type="email" placeholder="Your luxury email" className="flex-1 bg-black border border-white/10 rounded-lg px-6 py-4 text-sm focus:outline-none focus:border-[#d4af37]" />
          <button className="bg-[#d4af37] text-black font-bold uppercase text-[10px] tracking-widest px-8 rounded-lg hover:bg-white transition-colors">Join</button>
        </div>
      </section>
    </div>
  );
};