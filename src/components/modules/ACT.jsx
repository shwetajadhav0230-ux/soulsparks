import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Compass, Cloud, Eye, ArrowLeft, ArrowRight, CheckCircle, 
  Loader2, BookOpen, Leaf, ShieldAlert, Sparkles, Map
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { ClinicalService } from '../../lib/supabaseService';
import Button from '../../components/common/Button';

const ACTModule = () => {
  const [activeTab, setActiveTab] = useState('basics');

  // --- 1. VALUES CLARIFICATION STATE ---
  const [selectedValues, setSelectedValues] = useState([]);
  const [isSavingValues, setIsSavingValues] = useState(false);
  const [valuesSaved, setValuesSaved] = useState(false);

  const coreValues = [
    "Compassion", "Creativity", "Family", "Health", 
    "Adventure", "Growth", "Authenticity", "Courage", 
    "Connection", "Knowledge", "Justice", "Peace"
  ];

  // --- 2. COGNITIVE DEFUSION STATE ---
  const [defusionStep, setDefusionStep] = useState(1);
  const [stickyThought, setStickyThought] = useState('');
  const [defusionReflection, setDefusionReflection] = useState('');
  const [isSavingDefusion, setIsSavingDefusion] = useState(false);
  const [defusionSaved, setDefusionSaved] = useState(false);

  // --- HANDLERS ---
  const toggleValue = (value) => {
    if (selectedValues.includes(value)) {
      setSelectedValues(prev => prev.filter(v => v !== value));
    } else if (selectedValues.length < 3) {
      setSelectedValues(prev => [...prev, value]);
    }
  };

  const handleSaveValues = async () => {
    setIsSavingValues(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // 1. Save detailed clinical record
        await ClinicalService.saveActivityLog(user.id, 'b0000000-0000-0000-0000-000000000001', {
          core_values: selectedValues,
          exercise: "Values Clarification"
        });

        // 2. Ping the "Daily Goal" tracker for the Dashboard
        await ClinicalService.saveActivityLog(user.id, 'a0000000-0000-0000-0000-000000000002', { 
          completed: true, 
          activity_type: 'Values Clarification' 
        });
      }
      
      setValuesSaved(true);
      // 👉 AUTOMATICALLY JUMP TO THE NEXT PAGE AFTER RECORDING
      setActiveTab('defusion');
      
    } catch (error) {
      console.error("Failed to save values:", error);
      setValuesSaved(true);
      // Fallback: Still move to the next page even if testing without a DB
      setActiveTab('defusion');
    } finally {
      setIsSavingValues(false);
    }
  };

  const handleSaveDefusion = async () => {
    setIsSavingDefusion(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // 1. Save detailed clinical record
        await ClinicalService.saveActivityLog(user.id, 'b0000000-0000-0000-0000-000000000002', {
          original_thought: stickyThought,
          defused_thought: `I am having the thought that ${stickyThought}`,
          reflection: defusionReflection,
          exercise: "Cognitive Defusion"
        });

        // 2. Ping the "Daily Goal" tracker
        await ClinicalService.saveActivityLog(user.id, 'a0000000-0000-0000-0000-000000000002', { 
          completed: true, 
          activity_type: 'Cognitive Defusion' 
        });
      }
      
      setDefusionSaved(true);
      // 👉 AUTOMATICALLY JUMP TO THE NEXT PAGE AFTER RECORDING
      setActiveTab('observing');
      
    } catch (error) {
      console.error("Failed to save defusion practice:", error);
      setDefusionSaved(true);
      // Fallback: Still move to the next page even if testing without a DB
      setActiveTab('observing');
    } finally {
      setIsSavingDefusion(false);
    }
  };

  const tabs = [
    { id: 'basics', label: 'The Basics', icon: BookOpen },
    { id: 'values', label: 'Values', icon: Map },
    { id: 'defusion', label: 'Defusion', icon: Cloud },
    { id: 'observing', label: 'Observing Self', icon: Eye }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 min-h-screen">
      {/* --- HEADER --- */}
      <Link to="/modules" className="inline-flex items-center gap-2 text-stone-500 hover:text-stone-800 mb-8 transition-colors font-medium text-sm">
        <ArrowLeft className="w-4 h-4" /> Back to Pathways
      </Link>
      
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center shadow-sm">
          <Compass className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-4xl font-serif text-stone-900 mb-1">Acceptance & Commitment</h1>
          <p className="text-stone-500">Accept what you cannot control, and commit to actions that enrich your life.</p>
        </div>
      </div>

      {/* --- TAB NAVIGATION --- */}
      <div className="flex flex-wrap gap-2 mb-8 bg-stone-100/50 p-1.5 rounded-2xl">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 min-w-[140px] py-3 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all relative ${
              activeTab === tab.id ? 'text-teal-900' : 'text-stone-500 hover:text-stone-700 hover:bg-white/50'
            }`}
          >
            {activeTab === tab.id && (
              <motion.div layoutId="activeActTabIndicator" className="absolute inset-0 bg-white rounded-xl shadow-sm" />
            )}
            <span className="relative z-10 flex items-center gap-2">
              <tab.icon className="w-4 h-4" /> {tab.label}
            </span>
          </button>
        ))}
      </div>

      {/* --- TAB CONTENT --- */}
      <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-stone-100 min-h-[500px] overflow-hidden">
        <AnimatePresence mode="wait">
          
          {/* ========================================== */}
          {/* TAB 1: THE BASICS (Psychoeducation)          */}
          {/* ========================================== */}
          {activeTab === 'basics' && (
            <motion.div key="basics" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <h2 className="text-2xl font-serif text-stone-800 mb-4">Psychological Flexibility</h2>
              <p className="text-stone-600 mb-8 leading-relaxed">
                ACT is not about eliminating negative thoughts or feelings. It's about changing your <em>relationship</em> to them. When we stop struggling against our internal experiences, we free up energy to move toward what truly matters.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 bg-stone-50 rounded-2xl border border-stone-200">
                  <div className="flex items-center gap-3 mb-4 text-stone-700">
                    <ShieldAlert className="w-6 h-6" />
                    <h4 className="font-bold text-lg">Struggle & Avoidance</h4>
                  </div>
                  <ul className="space-y-3 text-sm text-stone-600">
                    <li className="flex gap-2"><span>×</span> Getting tangled up in negative thoughts.</li>
                    <li className="flex gap-2"><span>×</span> Trying to push away or numb painful emotions.</li>
                    <li className="flex gap-2"><span>×</span> Letting fear dictate your daily choices.</li>
                  </ul>
                </div>

                <div className="p-6 bg-teal-50 rounded-2xl border border-teal-200">
                  <div className="flex items-center gap-3 mb-4 text-teal-800">
                    <Sparkles className="w-6 h-6" />
                    <h4 className="font-bold text-lg">Acceptance & Commitment</h4>
                  </div>
                  <ul className="space-y-3 text-sm text-teal-700">
                    <li className="flex gap-2"><span>✓</span> Observing thoughts without taking them as absolute truth.</li>
                    <li className="flex gap-2"><span>✓</span> Making room for difficult emotions to exist.</li>
                    <li className="flex gap-2"><span>✓</span> Taking action aligned with your core values anyway.</li>
                  </ul>
                </div>
              </div>

              <div className="mt-10 pt-6 border-t border-stone-100 flex justify-end">
                <Button onClick={() => setActiveTab('values')} className="bg-teal-700 hover:bg-teal-800 text-white flex items-center gap-2">
                  Next: Discover Your Values <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* ========================================== */}
          {/* TAB 2: VALUES CLARIFICATION                  */}
          {/* ========================================== */}
          {activeTab === 'values' && (
            <motion.div key="values" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              {valuesSaved ? (
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-10 h-10" />
                  </div>
                  <h2 className="text-3xl font-serif text-stone-900 mb-2">Values Committed</h2>
                  <p className="text-stone-500 max-w-md mx-auto mb-10">You have chosen your compass. Let these values guide your actions, even when thoughts and feelings make it difficult.</p>
                  <div className="flex gap-2 justify-center mb-10">
                    {selectedValues.map(v => <span key={v} className="bg-teal-50 text-teal-800 px-4 py-2 rounded-full font-bold text-sm">{v}</span>)}
                  </div>
                  <Button onClick={() => setActiveTab('defusion')} className="bg-teal-700 hover:bg-teal-800 text-white flex items-center gap-2">
                    Continue to Defusion <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <h2 className="text-2xl font-serif text-stone-800 mb-2">Values Clarification</h2>
                  <p className="text-stone-600 mb-6">Values are not goals; they are directions on a compass. Select your <strong>Top 3 Core Values</strong> to guide your therapeutic journey.</p>
                  
                  <div className="flex justify-between items-center mb-6 bg-stone-50 p-4 rounded-xl border border-stone-200">
                    <span className="text-stone-700 font-bold">Selected: {selectedValues.length} / 3</span>
                    <Button 
                      onClick={handleSaveValues} 
                      disabled={selectedValues.length !== 3 || isSavingValues}
                      className="bg-teal-700 hover:bg-teal-800 text-white disabled:bg-stone-300 disabled:text-stone-500"
                    >
                      {isSavingValues ? <Loader2 className="w-4 h-4 animate-spin" /> : "Commit to Values"}
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-8">
                    {coreValues.map((val) => {
                      const isSelected = selectedValues.includes(val);
                      const isDisabled = !isSelected && selectedValues.length >= 3;
                      return (
                        <button
                          key={val}
                          onClick={() => toggleValue(val)}
                          disabled={isDisabled}
                          className={`p-4 rounded-xl font-bold transition-all border-2 text-sm ${
                            isSelected 
                              ? 'bg-teal-50 border-teal-500 text-teal-800 shadow-sm' 
                              : isDisabled 
                                ? 'bg-stone-50 border-stone-100 text-stone-300 cursor-not-allowed'
                                : 'bg-white border-stone-200 text-stone-600 hover:border-teal-300 hover:bg-teal-50/30'
                          }`}
                        >
                          {val}
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-10 pt-6 border-t border-stone-100 flex justify-between">
                    <Button variant="secondary" onClick={() => setActiveTab('basics')}>Back</Button>
                    <Button variant="secondary" onClick={() => setActiveTab('defusion')} className="flex items-center gap-2 text-stone-500">
                      Skip for now <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </>
              )}
            </motion.div>
          )}

          {/* ========================================== */}
          {/* TAB 3: COGNITIVE DEFUSION                  */}
          {/* ========================================== */}
          {activeTab === 'defusion' && (
            <motion.div key="defusion" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              {defusionSaved ? (
                 <div className="text-center py-16">
                  <div className="w-20 h-20 bg-stone-100 text-stone-800 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-10 h-10" />
                  </div>
                  <h2 className="text-3xl font-serif text-stone-900 mb-2">Distance Created</h2>
                  <p className="text-stone-500 max-w-md mx-auto mb-10">You have successfully stepped back from your thought. It is just a sentence in your mind, not a command you must obey.</p>
                  
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Button variant="outline" onClick={() => { setDefusionSaved(false); setDefusionStep(1); setStickyThought(''); setDefusionReflection(''); }}>Practice Again</Button>
                    <Button onClick={() => setActiveTab('observing')} className="bg-teal-700 hover:bg-teal-800 text-white flex items-center gap-2">
                      Continue to Observing Self <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-end mb-8">
                    <div>
                      <h2 className="text-2xl font-serif text-stone-800 mb-2">Cognitive Defusion</h2>
                      <p className="text-stone-500 text-sm">Recognizing that thoughts are just words and pictures, not absolute truths.</p>
                    </div>
                    <span className="text-sm font-bold text-teal-600 bg-teal-50 px-3 py-1 rounded-full">Step {defusionStep} of 2</span>
                  </div>

                  {defusionStep === 1 && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                      <label className="block text-stone-800 font-bold mb-3">1. The Sticky Thought</label>
                      <p className="text-sm text-stone-500 mb-4">What is a harsh, repetitive, or unhelpful thought your mind has been offering you recently?</p>
                      <textarea 
                        value={stickyThought} onChange={(e) => setStickyThought(e.target.value)}
                        className="w-full p-4 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:ring-2 focus:ring-teal-500 transition-all min-h-[120px]"
                        placeholder="e.g., I am a complete failure and I'm letting everyone down."
                      />
                      <div className="mt-6 flex justify-between">
                        <Button variant="secondary" onClick={() => setActiveTab('values')}>Back to Values</Button>
                        <Button onClick={() => setDefusionStep(2)} disabled={!stickyThought} className="bg-teal-700 hover:bg-teal-800 text-white">Defuse Thought</Button>
                      </div>
                    </motion.div>
                  )}

                  {defusionStep === 2 && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                      <label className="block text-stone-800 font-bold mb-3">2. Create Distance</label>
                      <p className="text-sm text-stone-500 mb-6">Read the defused version of your thought below. Notice how adding that simple prefix creates a gap between you and the words.</p>
                      
                      <div className="bg-teal-50 border border-teal-200 p-6 rounded-2xl mb-8 italic text-teal-900 font-serif text-xl text-center shadow-inner">
                        "I am having the thought that... <span className="font-bold underline decoration-teal-300 decoration-2 underline-offset-4">{stickyThought}</span>."
                      </div>

                      <label className="block text-stone-800 font-bold mb-3">Reflection (Optional)</label>
                      <textarea 
                        value={defusionReflection} onChange={(e) => setDefusionReflection(e.target.value)}
                        className="w-full p-4 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:ring-2 focus:ring-teal-500 transition-all min-h-[100px]"
                        placeholder="How does the weight of the thought feel now? Does it feel less like a fact?"
                      />

                      <div className="mt-8 flex justify-between items-center">
                        <Button variant="secondary" onClick={() => setDefusionStep(1)}>Back</Button>
                        <Button 
                          onClick={handleSaveDefusion} disabled={isSavingDefusion}
                          className="bg-teal-700 hover:bg-teal-800 text-white flex items-center gap-2"
                        >
                          {isSavingDefusion ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save Practice"}
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </>
              )}
            </motion.div>
          )}

          {/* ========================================== */}
          {/* TAB 4: THE OBSERVING SELF (Visualization)    */}
          {/* ========================================== */}
          {activeTab === 'observing' && (
            <motion.div key="observing" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <div className="text-center mb-8">
                <h2 className="text-2xl font-serif text-stone-800 mb-2">Leaves on a Stream</h2>
                <p className="text-stone-500 text-sm max-w-lg mx-auto">
                  You are not your thoughts. You are the sky, and your thoughts are the weather. Watch them pass by without trying to stop or change them.
                </p>
              </div>

              {/* Animation Container */}
              <div className="relative w-full h-64 bg-teal-50/50 border border-teal-100 rounded-3xl overflow-hidden mb-12 flex items-center justify-center">
                {/* Background Stream Line */}
                <div className="absolute left-0 right-0 h-16 bg-teal-100/50 skew-y-3 transform -translate-y-2"></div>
                
                {/* Animated Leaves */}
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute left-[-10%]"
                    initial={{ x: '-10vw', y: (i % 2 === 0 ? -20 : 20) }}
                    animate={{ x: '110vw' }}
                    transition={{ 
                      repeat: Infinity, 
                      duration: 12 + (i * 2), // Vary speed
                      delay: i * 3,          // Stagger starts
                      ease: "linear" 
                    }}
                  >
                    <div className="relative">
                      <Leaf className={`w-8 h-8 ${i % 2 === 0 ? 'text-teal-400' : 'text-emerald-500'} transform rotate-${i * 45}`} />
                      {/* Abstract thought representation */}
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-1 bg-white/50 rounded-full"></div>
                    </div>
                  </motion.div>
                ))}

                <div className="z-10 bg-white/80 backdrop-blur-sm px-6 py-3 rounded-full border border-teal-100 shadow-sm">
                  <p className="text-teal-800 font-serif italic">Observe the thought. Let it float by.</p>
                </div>
              </div>
              
              <div className="flex justify-between items-center border-t border-stone-100 pt-6">
                <Button variant="secondary" onClick={() => setActiveTab('defusion')}>Back to Defusion</Button>
                <Link to="/modules">
                  <Button className="bg-teal-700 hover:bg-teal-800 text-white flex items-center gap-2 px-8">
                    <CheckCircle className="w-5 h-5" /> Complete Workshop
                  </Button>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ACTModule;