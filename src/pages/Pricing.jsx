import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Sparkles, Crown, ArrowLeft, Shield, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/common/Button';
import { supabase } from '../lib/supabaseClient';
import { RazorpayService } from '../lib/razorpayService';

const Pricing = ({ session: propSession }) => {
  const navigate = useNavigate();
  const [isAnnual, setIsAnnual] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [session, setSession] = useState(propSession);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  // SESSION STABILIZATION: Ensures we have a valid user identity before payment
  useEffect(() => {
    const syncSession = async () => {
      if (!propSession) {
        const { data } = await supabase.auth.getSession();
        setSession(data.session);
      } else {
        setSession(propSession);
      }
      setIsCheckingSession(false);
    };
    syncSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      setIsCheckingSession(false);
    });
    return () => subscription.unsubscribe();
  }, [propSession]);

  /**
   * THE MASTER SUCCESS HANDLER
   * Combined logic to update Database and Auth Metadata for instant unlocking.
   */
  const handlePaymentSuccess = async (paymentId) => {
    try {
      if (!session?.user?.id) throw new Error("No active session found");
      setIsProcessing(true);

      // 1. UPDATE DATABASE (Permanent Record)
      const { error: dbError } = await supabase
        .from('profiles')
        .update({ 
          clinical_tier: 'premium',   // Matches your database schema
          is_premium: true,           // Used for rapid frontend gating
          last_payment_id: paymentId, // Fixes 'column not found' errors
          last_activity_at: new Date().toISOString()
        })
        .eq('id', session.user.id);

      if (dbError) throw dbError;

      // 2. UPDATE AUTH METADATA (Unlocks React Session immediately)
      const { error: authError } = await supabase.auth.updateUser({
        data: { 
          is_premium: true, 
          clinical_tier: 'premium' 
        }
      });

      if (authError) throw authError;

      // 3. USER FEEDBACK
      alert("Mubarak ho! SoulSpark Pro active ho gaya hai.");

      // 4. THE MAGIC RELOAD
      // window.location.href forces the browser to grab fresh 'premium' metadata
      window.location.href = '/dashboard?upgrade=success'; 
      
    } catch (err) {
      console.error("Critical Sync Error:", err.message);
      alert("Payment successful! But we couldn't update your access. Please refresh.");
      setIsProcessing(false);
    }
  };

  const handleUpgrade = async () => {
    if (isCheckingSession || !session) {
      navigate('/auth');
      return;
    }

    setIsProcessing(true);
    
    try {
      const scriptLoaded = await RazorpayService.loadScript();
      if (!scriptLoaded) {
        alert("Payment gateway connection failed. Please check your network.");
        setIsProcessing(false);
        return;
      }

      // Calculation: ₹399/mo (4788 total) billed annually OR ₹499 monthly
      const amount = isAnnual ? 4788 : 499;

      await RazorpayService.openCheckout({
        user: session.user,
        amount: amount,
        isAnnual,
        onSuccess: (res) => handlePaymentSuccess(res.razorpay_payment_id),
        onCancel: () => setIsProcessing(false)
      });
    } catch (error) {
      console.error("Razorpay Logic Error:", error);
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 md:py-16 animate-fade-in transition-all overflow-x-hidden">
      
      <button 
        onClick={() => navigate(-1)} 
        className="mb-8 w-12 h-12 flex items-center justify-center rounded-full bg-white dark:bg-zinc-900 border border-stone-200 text-stone-600 dark:text-zinc-400 hover:text-emerald-600 transition-all shadow-sm active:scale-95"
      >
        <ArrowLeft className="w-6 h-6" />
      </button>

      <div className="text-center mb-12 md:mb-20">
        <h1 className="font-serif text-4xl md:text-6xl text-stone-900 dark:text-zinc-100 mb-6 leading-tight">
          Invest in your <span className="italic text-emerald-600 font-medium">inner sanctuary.</span>
        </h1>
        
        <div className="inline-flex items-center p-1.5 bg-stone-100 dark:bg-zinc-900 rounded-2xl border border-stone-200 dark:border-zinc-800">
          <button onClick={() => setIsAnnual(false)} className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${!isAnnual ? 'bg-white dark:bg-zinc-800 text-stone-900 dark:text-zinc-100 shadow-md' : 'text-stone-500'}`}>Monthly</button>
          <button onClick={() => setIsAnnual(true)} className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${isAnnual ? 'bg-white dark:bg-zinc-800 text-stone-900 dark:text-zinc-100 shadow-md' : 'text-stone-500'}`}>
            Annually <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 text-[10px] rounded-md font-black">SAVE 20%</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto items-stretch">
        
        {/* BASIC PLAN */}
        <div className="bg-white dark:bg-zinc-900/50 rounded-[2.5rem] p-8 md:p-12 border border-stone-200 dark:border-zinc-800 flex flex-col group transition-all hover:border-stone-300">
          <div className="mb-8">
            <h3 className="text-2xl font-serif text-stone-900 dark:text-zinc-100 mb-2">SoulSpark Basic</h3>
            <span className="text-5xl font-serif text-stone-900 dark:text-zinc-100 tracking-tight">Free</span>
          </div>
          <div className="space-y-4 mb-10 flex-grow">
            {["Mood & hydration tracking", "Private text journaling", "CBT Fundamentals Module", "Limited AI Therapy messages"].map((f, i) => (
              <div key={i} className="flex items-center gap-3 text-sm text-stone-600 dark:text-zinc-400">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                <span>{f}</span>
              </div>
            ))}
          </div>
          <button className="w-full py-4 rounded-2xl bg-stone-50 dark:bg-zinc-800/50 text-stone-400 font-bold cursor-default border border-dashed border-stone-200 dark:border-zinc-800">Your Current Plan</button>
        </div>

        {/* PRO PLAN */}
        <div className="bg-zinc-900 dark:bg-black rounded-[2.5rem] p-8 md:p-12 border border-emerald-500/30 shadow-2xl relative flex flex-col overflow-hidden ring-4 ring-emerald-500/5 transition-all hover:scale-[1.01]">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />
          <div className="mb-8 relative z-10">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-2xl font-serif text-white flex items-center gap-2"> SoulSpark Pro <Crown className="w-5 h-5 text-amber-400 fill-amber-400" /></h3>
              <span className="px-3 py-1 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] font-black uppercase tracking-widest rounded-lg">RECOMMENDED</span>
            </div>
            <div className="mt-6 flex items-baseline gap-1 text-white">
              <span className="text-xl opacity-50">₹</span>
              <span className="text-6xl font-serif tracking-tighter">{isAnnual ? '399' : '499'}</span>
              <span className="opacity-50">/mo</span>
            </div>
          </div>

          <div className="space-y-4 mb-10 flex-grow relative z-10 text-zinc-300 text-sm">
            {["Unlimited SoulSpark AI Sessions", "Full Clinical Suite (DBT, ACT)", "Premium Wellness Video Library", "AI Clinical Pattern Detection", "PDF Reports for your therapist"].map((f, i) => (
              <div key={i} className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>{f}</span>
              </div>
            ))}
          </div>

          <Button 
            variant="sage" 
            className="w-full py-5 text-lg relative z-10 shadow-lg font-black active:scale-95 transition-transform"
            onClick={handleUpgrade}
            disabled={isProcessing || isCheckingSession}
          >
            {isProcessing ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" /> Securing Session...
              </div>
            ) : "Unlock SoulSpark Pro"}
          </Button>
          
          <div className="mt-5 flex items-center justify-center gap-2 text-[10px] text-zinc-500 uppercase tracking-widest font-bold">
            <Shield className="w-3.5 h-3.5 text-emerald-600" /> Secure 256-Bit SSL Checkout
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;