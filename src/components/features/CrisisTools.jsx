import React, { useState, useEffect } from 'react';
import { Wind, ShieldAlert, Phone, MessageSquare, HeartHandshake } from 'lucide-react';
import Card from '../common/Card';
import Button from '../common/Button';

/**
 * CrisisTools Component
 * Purpose: Implements robust crisis detection de-escalation protocols.
 * Features: 4-7-8 Breathing and 5-4-3-2-1 Grounding modalities.
 */
const CrisisTools = () => {
  const [breathingStep, setBreathingStep] = useState('Inhale');
  const [scale, setScale] = useState(1);

  // DBT-inspired 4-7-8 Breathing Cycle Logic [cite: 119, 120]
  useEffect(() => {
    const cycle = setInterval(() => {
      setBreathingStep('Inhale (4s)');
      setScale(1.5);
      setTimeout(() => {
        setBreathingStep('Hold (7s)');
        // Scale remains constant
        setTimeout(() => {
          setBreathingStep('Exhale (8s)');
          setScale(1);
        }, 7000);
      }, 4000);
    }, 19000);

    return () => clearInterval(cycle);
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* 1. Breathing Tool - Mindfulness Intervention [cite: 120] */}
      <Card className="flex flex-col items-center justify-center text-center p-12 border-2 border-green-50">
        <h3 className="font-serif text-2xl text-stone-800 mb-8 flex items-center gap-2">
          <Wind className="text-green-600 w-6 h-6" /> Breath Sync
        </h3>
        
        <div 
          className="w-40 h-40 rounded-full bg-green-100 flex items-center justify-center mb-8 transition-all duration-[4000ms] ease-in-out shadow-inner"
          style={{ transform: `scale(${scale})` }}
        >
          <div className="w-24 h-24 rounded-full bg-white/80 flex items-center justify-center">
            <div className="w-8 h-8 bg-green-400 rounded-full animate-pulse"></div>
          </div>
        </div>
        
        <p className="text-3xl font-serif text-stone-700 h-10">{breathingStep}</p>
        <p className="text-xs text-stone-400 mt-4 uppercase tracking-[0.2em]">Regulating Nervous System</p>
      </Card>

      {/* 2. Grounding Tool - DBT Distress Tolerance [cite: 119] */}
      <Card className="p-8">
        <h3 className="font-serif text-xl text-stone-800 mb-6 flex items-center gap-2">
          <HeartHandshake className="w-5 h-5 text-orange-400" /> Grounding: 5-4-3-2-1
        </h3>
        <div className="space-y-4">
          {[
            { n: 5, t: 'Things you can see' },
            { n: 4, t: 'Things you can touch' },
            { n: 3, t: 'Things you can hear' },
            { n: 2, t: 'Things you can smell' },
            { n: 1, t: 'Thing you can taste' },
          ].map((item) => (
            <div key={item.n} className="flex items-center gap-4 group cursor-default">
              <div className="w-10 h-10 rounded-full bg-stone-50 group-hover:bg-orange-100 text-stone-400 group-hover:text-orange-600 flex items-center justify-center font-bold transition-all">
                {item.n}
              </div>
              <span className="text-stone-600 group-hover:text-stone-900 transition-colors">{item.t}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* 3. Immediate Intervention Access [cite: 322, 68] */}
      <div className="bg-orange-50 rounded-3xl p-6 border border-orange-100">
        <div className="flex items-center gap-3 mb-4">
          <ShieldAlert className="text-orange-600 w-5 h-5" />
          <span className="font-bold text-orange-900 text-sm">Emergency Protocols Active</span>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <a href="tel:988" className="flex items-center justify-center gap-2 bg-white text-stone-800 py-3 rounded-xl text-sm font-bold shadow-sm hover:bg-stone-50 transition-all">
            <Phone className="w-4 h-4" /> Call 988
          </a>
          <button className="flex items-center justify-center gap-2 bg-white text-stone-800 py-3 rounded-xl text-sm font-bold shadow-sm hover:bg-stone-50 transition-all">
            <MessageSquare className="w-4 h-4" /> Text Support
          </button>
        </div>
      </div>
    </div>
  );
};

export default CrisisTools;