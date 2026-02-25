import React from 'react';
import { motion } from 'framer-motion';
import { Leaf, Shield, Globe } from 'lucide-react';

/**
 * Footer Component
 * Purpose: Provides clinical disclaimers, compliance badges, and branding.
 * Implementation: Uses standard green theme with reduced padding for a compact layout.
 */
const Footer = () => {
  return (
    // Reduced padding from py-16 to py-8 for a smaller footer size
    <footer className="bg-green-50 border-t border-green-200 py-8">
      <div className="max-w-4xl mx-auto px-4 text-center space-y-4">
        
        {/* Branding Section - Compact spacing */}
        <div className="flex flex-col items-center gap-1">
           <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mb-1 shadow-sm transition-transform hover:scale-110">
             <Leaf className="text-white w-4 h-4" />
           </div>
           <span className="font-serif text-xl text-stone-800 tracking-tight font-semibold">
             SoulSpark
           </span>
        </div>

        {/* Clinical Disclaimer */}
        <p className="text-stone-600 text-xs leading-relaxed max-w-xl mx-auto italic">
          Designed with empathy and clinical insight. SoulSpark is a support tool, 
          not a medical device. In emergencies, always contact local authorities.
        </p>

        {/* Compliance Badges - Standard Green Text */}
        <div className="flex justify-center gap-4 text-[9px] uppercase tracking-widest font-bold text-green-600">
          <span className="flex items-center gap-1">
            <Shield className="w-3 h-3" /> HIPAA Compliant
          </span>
          <span className="flex items-center gap-1">
            <Globe className="w-3 h-3" /> GDPR Ready
          </span>
        </div>

        {/* Copyright & Credits - Standard Green accent */}
        <div className="pt-4 border-t border-green-200/60">
          <p className="text-stone-400 text-[10px]">
            © 2026 SoulSpark Wellness. Developed by 
            <span className="text-green-600 font-bold ml-1">Shweta Jadhav</span>.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;