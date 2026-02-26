import React from 'react';
import { Leaf, Shield, Globe } from 'lucide-react';

/**
 * Footer Component
 * Purpose: Provides clinical disclaimers, compliance badges, and branding.
 * Implementation: Fully supports Dark Mode and uses a highly compact layout.
 */
const Footer = () => {
  return (
    // Replaced hardcoded green with theme-aware stone backgrounds and tighter padding (py-6)
    <footer className="bg-stone-50 dark:bg-stone-900 border-t border-stone-200 dark:border-stone-800 py-6 transition-colors duration-300">
      <div className="max-w-4xl mx-auto px-4 text-center space-y-3">
        
        {/* Branding Section - Shrunk icon and text for a compact look */}
        <div className="flex flex-col items-center gap-1">
           <div className="w-6 h-6 bg-emerald-500 dark:bg-emerald-600 rounded-full flex items-center justify-center mb-1 shadow-sm transition-transform hover:scale-110">
             <Leaf className="text-white w-3 h-3" />
           </div>
           <span className="font-serif text-lg text-stone-800 dark:text-stone-100 tracking-tight font-semibold transition-colors">
             SoulSpark
           </span>
        </div>

        {/* Clinical Disclaimer */}
        <p className="text-stone-500 dark:text-stone-400 text-[10px] md:text-xs leading-relaxed max-w-xl mx-auto italic transition-colors">
          Designed with empathy and clinical insight. SoulSpark is a support tool, 
          not a medical device. In emergencies, always contact local authorities.
        </p>

        {/* Compliance Badges - Theme aware emerald text */}
        <div className="flex justify-center gap-4 text-[9px] uppercase tracking-widest font-bold text-emerald-600 dark:text-emerald-400 transition-colors">
          <span className="flex items-center gap-1">
            <Shield className="w-3 h-3" /> HIPAA Compliant
          </span>
          <span className="flex items-center gap-1">
            <Globe className="w-3 h-3" /> GDPR Ready
          </span>
        </div>

        {/* Copyright & Credits */}
        <div className="pt-3 border-t border-stone-200 dark:border-stone-800 transition-colors">
          <p className="text-stone-400 dark:text-stone-500 text-[10px] transition-colors">
            © 2026 SoulSpark Wellness. Developed by 
            <span className="text-emerald-600 dark:text-emerald-400 font-bold ml-1 transition-colors">Shweta Jadhav</span>.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;