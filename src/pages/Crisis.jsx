import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldAlert, ArrowLeft, Phone, MessageCircle, 
  Wind, Eye, Heart, Volume2, Fingerprint, RefreshCw, X 
} from 'lucide-react';

const CrisisSupport = ({ setView }) => {
  // --- BREATHING ENGINE ---
  const [step, setStep] = useState(0); // 0: Inhale, 1: Hold, 2: Exhale
  const steps = [
    { text: 'Inhale', duration: 4, color: 'bg-emerald-400', scale: 1.5 },
    { text: 'Hold', duration: 7, color: 'bg-teal-500', scale: 1.5 },
    { text: 'Exhale', duration: 8, color: 'bg-blue-400', scale: 1 },
  ];

  useEffect(() => {
    const timer = setTimeout(() => {
      setStep((prev) => (prev + 1) % steps.length);
    }, steps[step].duration * 1000);
    return () => clearTimeout(timer);
  }, [step]);

  // --- GROUNDING STATE ---
  const [groundingIndex, setGroundingIndex] = useState(0);
  const groundingSteps = [
    { icon: Eye, label: '5 things you see', color: 'text-blue-500' },
    { icon: Fingerprint, label: '4 things you can touch', color: 'text-emerald-500' },
    { icon: Volume2, label: '3 things you hear', color: 'text-amber-500' },
    { icon: Heart, label: '2 things you smell', color: 'text-rose-500' },
    { icon: RefreshCw, label: '1 thing you can taste', color: 'text-purple-500' },
  ];

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-zinc-950 transition-colors duration-500">
      
      {/* QUICK ESCAPE HEADER */}
      <div className="max-w-4xl mx-auto px-4 pt-8 flex justify-between items-center">
        <button 
          onClick={() => setView('home')} 
          className="flex items-center gap-2 text-stone-400 hover:text-stone-800 dark:hover:text-white transition-all group font-bold text-sm uppercase tracking-widest"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" /> 
          Back to Safety
        </button>
        <button 
          onClick={() => window.location.href = 'https://www.google.com'} 
          className="px-4 py-2 bg-stone-200 dark:bg-zinc-800 text-stone-600 dark:text-stone-400 rounded-full text-[10px] font-black uppercase tracking-tighter hover:bg-rose-500 hover:text-white transition-all"
        >
          Quick Exit (ESC)
        </button>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
        
        {/* HERO: IMMEDIATE ACTION */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-zinc-900 rounded-[3rem] p-8 md:p-12 shadow-2xl shadow-rose-500/5 border border-stone-100 dark:border-zinc-800 relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-2 h-full bg-rose-500" />
          
          <div className="flex flex-col md:flex-row gap-8 items-center">
            <div className="bg-rose-50 dark:bg-rose-950/30 p-6 rounded-3xl">
              <ShieldAlert className="w-12 h-12 text-rose-600" />
            </div>
            
            <div className="flex-1 text-center md:text-left space-y-4">
              <h1 className="text-3xl md:text-4xl font-serif text-stone-900 dark:text-zinc-100">You are safe here.</h1>
              <p className="text-lg text-stone-500 dark:text-zinc-400 leading-relaxed">
                If you are in immediate danger or feeling like you might hurt yourself, please reach out now. <b>Humans are ready to listen.</b>
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                <a 
                  href="tel:988" 
                  className="bg-rose-600 hover:bg-rose-700 text-white p-5 rounded-2xl font-black text-center shadow-lg shadow-rose-600/20 transition-all flex flex-col items-center justify-center gap-1 group"
                >
                  <span className="text-[10px] uppercase tracking-widest opacity-80">USA / Canada</span>
                  <div className="flex items-center gap-2 text-xl">
                    <Phone className="w-6 h-6 group-hover:animate-bounce" /> Call 988
                  </div>
                </a>
                <a 
                  href="tel:9152987821" 
                  className="bg-stone-900 dark:bg-zinc-100 dark:text-zinc-900 text-white p-5 rounded-2xl font-black text-center shadow-lg transition-all flex flex-col items-center justify-center gap-1"
                >
                  <span className="text-[10px] uppercase tracking-widest opacity-60">India (iCall)</span>
                  <div className="flex items-center gap-2 text-xl">
                    <Phone className="w-6 h-6" /> 9152987821
                  </div>
                </a>
                <button className="sm:col-span-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 p-4 rounded-2xl font-bold flex items-center justify-center gap-3 border border-emerald-100 dark:border-emerald-800/50">
                  <MessageCircle className="w-5 h-5" /> Text "HOME" to 741741 (Crisis Text Line)
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* INTERACTIVE BREATHING */}
          <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-10 flex flex-col items-center text-center shadow-sm border border-stone-100 dark:border-zinc-800">
            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-stone-400 mb-8">Breathe with SoulSpark</h3>
            
            <div className="relative w-48 h-48 mb-8">
               <motion.div 
                 animate={{ scale: steps[step].scale }}
                 transition={{ duration: steps[step].duration, ease: "easeInOut" }}
                 className={`absolute inset-0 rounded-full ${steps[step].color} opacity-20`}
               />
               <div className="absolute inset-4 rounded-full border-2 border-dashed border-stone-200 dark:border-zinc-700 animate-spin-slow" />
               <div className="absolute inset-0 flex items-center justify-center">
                  <Wind className={`w-12 h-12 transition-colors duration-1000 ${steps[step].color.replace('bg-', 'text-')}`} />
               </div>
            </div>
            
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                className="space-y-1"
              >
                <p className="text-3xl font-serif text-stone-800 dark:text-zinc-100">{steps[step].text}</p>
                <p className="text-sm font-bold text-stone-400 uppercase tracking-widest">{steps[step].duration} Seconds</p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* INTERACTIVE GROUNDING */}
          <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-10 shadow-sm border border-stone-100 dark:border-zinc-800">
            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-stone-400 mb-6">The 5-4-3-2-1 Rule</h3>
            <p className="text-sm text-stone-500 mb-8 italic">Engage your senses to come back to the present.</p>
            
            <div className="space-y-4">
              {groundingSteps.map((item, idx) => {
                const Icon = item.icon;
                const isActive = groundingIndex === idx;
                const isPast = groundingIndex > idx;

                return (
                  <button 
                    key={idx}
                    onClick={() => setGroundingIndex(idx + 1)}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all border ${
                      isActive 
                        ? 'bg-stone-900 text-white border-stone-900 shadow-xl scale-[1.02]' 
                        : isPast ? 'opacity-40 border-transparent bg-stone-50' : 'bg-stone-50 border-stone-100 dark:bg-zinc-800 dark:border-zinc-700'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isActive ? 'bg-white/20' : 'bg-white'}`}>
                      <Icon className={`w-5 h-5 ${isActive ? 'text-white' : item.color}`} />
                    </div>
                    <span className="font-bold text-sm">{item.label}</span>
                    {isPast && <X className="ml-auto w-4 h-4" />}
                  </button>
                );
              })}
              
              {groundingIndex >= 5 && (
                <motion.button 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  onClick={() => setGroundingIndex(0)}
                  className="w-full py-3 text-emerald-600 font-bold text-xs uppercase tracking-widest hover:underline"
                >
                  Restart Grounding
                </motion.button>
              )}
            </div>
          </div>

        </div>

        {/* DISTRACTION / SAFE SPACE CTA */}
        <div className="text-center pt-8">
           <p className="text-stone-400 text-sm mb-4 italic">Need a moment of peace without talking?</p>
           <button 
             onClick={() => setView('modules')}
             className="px-8 py-4 bg-emerald-700 text-white rounded-2xl font-bold hover:bg-emerald-800 transition-all shadow-lg shadow-emerald-700/20"
           >
             Enter Wellness Gallery
           </button>
        </div>

      </div>
    </div>
  );
};

export default CrisisSupport;