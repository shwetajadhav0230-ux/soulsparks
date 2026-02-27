import React, { useMemo } from 'react';
import { Lock, Crown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from './Button';

// Notice we changed 'isPremium' to 'session' in the props!
const LockedModule = ({ session, children, moduleName }) => {
  const navigate = useNavigate();

  // --- THE BULLETPROOF PREMIUM CHECK ---
  const isPremium = useMemo(() => {
    const user = session?.user;
    // Check both clinical_tier and is_premium across the object and metadata
    const tier = user?.clinical_tier || user?.user_metadata?.clinical_tier;
    const premiumBool = user?.is_premium || user?.user_metadata?.is_premium;
    
    return tier === 'premium' || premiumBool === true;
  }, [session]);

  // If they are Pro, immediately show the actual Module content
  if (isPremium) {
    return <>{children}</>;
  }

  // Otherwise, show the Locked UI
  return (
    <div className="relative group overflow-hidden rounded-[2.5rem] border border-stone-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm p-8 md:p-12 text-center min-h-[400px] flex flex-col items-center justify-center animate-fade-in">
      <div className="absolute top-0 right-0 p-8 opacity-5">
        <Crown className="w-32 h-32 text-emerald-500" />
      </div>

      <div className="relative z-10 max-w-sm">
        <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Lock className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
        </div>
        
        <h3 className="text-2xl font-serif text-stone-900 dark:text-zinc-100 mb-3">
          Unlock {moduleName}
        </h3>
        
        <p className="text-stone-500 dark:text-zinc-400 text-sm mb-8 leading-relaxed">
          The Full Clinical Suite, including DBT and ACT mastery modules, is available exclusively for 
          <span className="text-emerald-600 dark:text-emerald-400 font-bold"> SoulSpark Pro </span> members.
        </p>

        <Button 
          variant="sage" 
          className="w-full py-4 text-base shadow-xl shadow-emerald-500/10"
          onClick={() => navigate('/pricing')}
        >
          Upgrade to SoulSpark Pro
        </Button>
        
        <button 
          onClick={() => navigate('/modules')}
          className="mt-4 text-xs font-bold text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors uppercase tracking-widest"
        >
          Back to Free Modules
        </button>
      </div>
    </div>
  );
};

export default LockedModule;