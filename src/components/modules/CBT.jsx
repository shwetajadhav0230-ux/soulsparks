import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// Notice 'ArrowRight' is now included in this list:
import { Brain, ArrowLeft, ArrowRight, Sparkles, BookOpen, Target, PenTool, CheckCircle, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { ClinicalService } from '../../lib/supabaseService';
import Button from '../../components/common/Button';

const CBTModule = () => {
  const [activeTab, setActiveTab] = useState('basics'); // 'basics', 'distortions', 'exercise'
  
  // Thought Record State
  const [step, setStep] = useState(1);
  const [situation, setSituation] = useState('');
  const [emotion, setEmotion] = useState(5);
  const [automaticThought, setAutomaticThought] = useState('');
  const [reframe, setReframe] = useState('');
  
  // AI & Save State
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  // Calls our simulated AI Reframe function
  const handleGenerateReframe = async () => {
    if (!automaticThought) return;
    setIsGenerating(true);
    try {
      const suggestions = await ClinicalService.generateAIReframe(automaticThought);
      setAiSuggestions(suggestions);
    } catch (error) {
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Saves the completed exercise to Supabase
  const handleSaveExercise = async () => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert("Please log in to save your progress.");
        return;
      }

      // Hardcoded Activity ID for "Thought Record" (You'd normally fetch this)
      const CBT_ACTIVITY_ID = 'cbt-thought-record-001'; 
      
      await ClinicalService.saveActivityLog(user.id, CBT_ACTIVITY_ID, {
        situation,
        emotion_intensity: emotion,
        automatic_thought: automaticThought,
        reframe,
        exercise: "Thought Record"
      });
      
      setIsComplete(true);
    } catch (error) {
      console.error("Failed to save:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { id: 'basics', label: 'The Basics', icon: BookOpen },
    { id: 'distortions', label: 'Cognitive Bugs', icon: Target },
    { id: 'exercise', label: 'Thought Record', icon: PenTool }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 min-h-screen">
      {/* --- HEADER --- */}
      <Link to="/modules" className="inline-flex items-center gap-2 text-stone-500 hover:text-stone-800 mb-8 transition-colors font-medium text-sm">
        <ArrowLeft className="w-4 h-4" /> Back to Pathways
      </Link>
      
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center shadow-sm">
          <Brain className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-4xl font-serif text-stone-900 mb-1">Cognitive Behavioral Therapy</h1>
          <p className="text-stone-500">Rewire your thought patterns to change how you feel.</p>
        </div>
      </div>

      {/* --- TAB NAVIGATION --- */}
      <div className="flex gap-2 mb-8 bg-stone-100/50 p-1.5 rounded-2xl">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === tab.id 
                ? 'bg-white text-stone-900 shadow-sm' 
                : 'text-stone-500 hover:text-stone-700 hover:bg-white/50'
            }`}
          >
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      {/* --- TAB CONTENT --- */}
      <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-stone-100 min-h-[500px]">
        <AnimatePresence mode="wait">
          
          {/* TAB 1: Basics */}
          {activeTab === 'basics' && (
            <motion.div key="basics" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <h2 className="text-2xl font-serif text-stone-800 mb-4">The Cognitive Triangle</h2>
              <p className="text-stone-600 mb-6 leading-relaxed">
                CBT is based on a simple but powerful concept: our thoughts, feelings, and behaviors are all connected. It's not the events in our lives that upset us, but the <em>meanings</em> we attach to them.
              </p>
              <div className="bg-blue-50/50 rounded-2xl p-6 border border-blue-100 flex flex-col items-center justify-center py-12">
                <div className="text-center max-w-sm">
                  <p className="font-bold text-blue-800 mb-2">Thoughts</p>
                  <p className="text-sm text-blue-600/80 mb-4">What we think affects how we act and feel.</p>
                  <div className="flex justify-between items-center w-full my-4 text-blue-300">
                    <span>↙</span><span>↘</span>
                  </div>
                  <div className="flex justify-between w-full">
                    <div className="text-center w-1/2 pr-2">
                      <p className="font-bold text-blue-800 mb-1">Behaviors</p>
                      <p className="text-xs text-blue-600/80">What we do affects how we think and feel.</p>
                    </div>
                    <div className="text-center w-1/2 pl-2 border-l border-blue-200">
                      <p className="font-bold text-blue-800 mb-1">Emotions</p>
                      <p className="text-xs text-blue-600/80">How we feel affects what we think and do.</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-8 flex justify-end">
                <Button variant="sage" onClick={() => setActiveTab('distortions')}>Next: Cognitive Bugs <ArrowRight className="w-4 h-4 ml-2" /></Button>
              </div>
            </motion.div>
          )}

          {/* TAB 2: Distortions */}
          {activeTab === 'distortions' && (
            <motion.div key="distortions" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <h2 className="text-2xl font-serif text-stone-800 mb-4">Common Cognitive Distortions</h2>
              <p className="text-stone-600 mb-8 leading-relaxed">
                Think of these as "software bugs" in your brain. They are irrational thought patterns that convince us of things that aren't true. Do any of these sound familiar?
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <div className="p-5 bg-stone-50 rounded-2xl border border-stone-100">
                  <h4 className="font-bold text-stone-800 mb-2">All-or-Nothing Thinking</h4>
                  <p className="text-sm text-stone-500 italic mb-2">"If I don't get an A, I'm a total failure."</p>
                  <p className="text-sm text-stone-600">Seeing things in black and white categories, with no middle ground.</p>
                </div>
                <div className="p-5 bg-stone-50 rounded-2xl border border-stone-100">
                  <h4 className="font-bold text-stone-800 mb-2">Catastrophizing</h4>
                  <p className="text-sm text-stone-500 italic mb-2">"I made a typo in that email. I'm going to get fired."</p>
                  <p className="text-sm text-stone-600">Expecting the absolute worst possible outcome to happen.</p>
                </div>
                <div className="p-5 bg-stone-50 rounded-2xl border border-stone-100">
                  <h4 className="font-bold text-stone-800 mb-2">Mind Reading</h4>
                  <p className="text-sm text-stone-500 italic mb-2">"They didn't text back, they must hate me."</p>
                  <p className="text-sm text-stone-600">Assuming you know what others are thinking without evidence.</p>
                </div>
                <div className="p-5 bg-stone-50 rounded-2xl border border-stone-100">
                  <h4 className="font-bold text-stone-800 mb-2">Should Statements</h4>
                  <p className="text-sm text-stone-500 italic mb-2">"I should be farther along in life by now."</p>
                  <p className="text-sm text-stone-600">Holding yourself to rigid rules, leading to guilt when broken.</p>
                </div>
              </div>
              <div className="mt-8 flex justify-end">
                <Button variant="sage" onClick={() => setActiveTab('exercise')}>Next: Interactive Exercise <ArrowRight className="w-4 h-4 ml-2" /></Button>
              </div>
            </motion.div>
          )}

          {/* TAB 3: Interactive Thought Record */}
          {activeTab === 'exercise' && (
            <motion.div key="exercise" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              
              {isComplete ? (
                <div className="flex flex-col items-center justify-center text-center py-16">
                  <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle className="w-10 h-10" />
                  </div>
                  <h2 className="text-3xl font-serif text-stone-900 mb-2">Excellent Work</h2>
                  <p className="text-stone-500 max-w-md mb-8">You've successfully challenged a negative thought and saved it to your journal. Rewiring takes practice.</p>
                  <Button variant="outline" onClick={() => { setIsComplete(false); setStep(1); setSituation(''); setAutomaticThought(''); setReframe(''); }}>Do Another Record</Button>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-end mb-8">
                    <div>
                      <h2 className="text-2xl font-serif text-stone-800 mb-2">The Thought Record</h2>
                      <p className="text-stone-500 text-sm">Catch it, check it, change it.</p>
                    </div>
                    <span className="text-sm font-bold text-stone-400">Step {step} of 4</span>
                  </div>

                  {/* STEP 1: Situation */}
                  {step === 1 && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                      <label className="block text-stone-800 font-bold mb-3">1. The Situation</label>
                      <p className="text-sm text-stone-500 mb-4">Briefly describe the event that triggered your distress. Who, what, when, where?</p>
                      <textarea 
                        value={situation} onChange={(e) => setSituation(e.target.value)}
                        className="w-full p-4 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:ring-2 focus:ring-green-500 transition-all min-h-[120px]"
                        placeholder="e.g., I was asked to give a presentation at work next Tuesday."
                      />
                      <div className="mt-6 flex justify-end">
                        <Button variant="sage" disabled={!situation} onClick={() => setStep(2)}>Next Step</Button>
                      </div>
                    </motion.div>
                  )}

                  {/* STEP 2: Emotion & Thought */}
                  {step === 2 && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                      <label className="block text-stone-800 font-bold mb-3">2. The Automatic Thought</label>
                      <p className="text-sm text-stone-500 mb-4">What was the exact negative thought that flashed through your mind?</p>
                      <textarea 
                        value={automaticThought} onChange={(e) => setAutomaticThought(e.target.value)}
                        className="w-full p-4 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:ring-2 focus:ring-green-500 transition-all min-h-[100px] mb-6"
                        placeholder="e.g., I'm going to mess up and everyone will think I'm incompetent."
                      />
                      
                      <label className="block text-stone-800 font-bold mb-3">Emotion Intensity (1-10)</label>
                      <input 
                        type="range" min="1" max="10" value={emotion} onChange={(e) => setEmotion(e.target.value)}
                        className="w-full accent-green-600 mb-2"
                      />
                      <div className="flex justify-between text-xs text-stone-400 font-bold mb-8">
                        <span>Mild (1)</span><span>Overwhelming (10)</span>
                      </div>

                      <div className="flex justify-between">
                        <Button variant="secondary" onClick={() => setStep(1)}>Back</Button>
                        <Button variant="sage" disabled={!automaticThought} onClick={() => setStep(3)}>Next Step</Button>
                      </div>
                    </motion.div>
                  )}

                  {/* STEP 3: AI Challenge */}
                  {step === 3 && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                      <label className="block text-stone-800 font-bold mb-3">3. Challenge the Thought</label>
                      <p className="text-sm text-stone-500 mb-6">Let's look at this objectively. If you're stuck, use SoulSpark AI to generate alternative perspectives.</p>
                      
                      <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100 mb-8">
                        <p className="text-sm text-stone-500 mb-1">Your original thought:</p>
                        <p className="font-serif text-lg text-stone-800 italic">"{automaticThought}"</p>
                      </div>

                      {aiSuggestions.length === 0 ? (
                        <div className="flex justify-center py-6">
                          <Button 
                            variant="outline" 
                            onClick={handleGenerateReframe} 
                            disabled={isGenerating}
                            className="flex items-center gap-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                          >
                            {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                            {isGenerating ? "Analyzing thought..." : "Ask AI for Perspectives"}
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-3 mb-8">
                          <p className="text-sm font-bold text-indigo-800 flex items-center gap-2 mb-4">
                            <Sparkles className="w-4 h-4" /> AI Reframes (Select one to copy)
                          </p>
                          {aiSuggestions.map((sug, idx) => (
                            <button 
                              key={idx} onClick={() => setReframe(sug)}
                              className="w-full text-left p-4 rounded-xl border border-indigo-100 bg-white hover:border-indigo-300 hover:shadow-md transition-all text-sm text-stone-700"
                            >
                              {sug}
                            </button>
                          ))}
                        </div>
                      )}

                      <div className="flex justify-between mt-8">
                        <Button variant="secondary" onClick={() => setStep(2)}>Back</Button>
                        <Button variant="sage" onClick={() => setStep(4)}>Next Step</Button>
                      </div>
                    </motion.div>
                  )}

                  {/* STEP 4: The Reframe */}
                  {step === 4 && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                      <label className="block text-stone-800 font-bold mb-3">4. The Balanced Reframe</label>
                      <p className="text-sm text-stone-500 mb-4">Write a new, balanced thought. It doesn't have to be overly positive, just more realistic and fact-based than the automatic thought.</p>
                      <textarea 
                        value={reframe} onChange={(e) => setReframe(e.target.value)}
                        className="w-full p-4 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:ring-2 focus:ring-green-500 transition-all min-h-[120px]"
                        placeholder="Write your new thought here..."
                      />
                      
                      <div className="flex justify-between mt-8">
                        <Button variant="secondary" onClick={() => setStep(3)}>Back</Button>
                        <Button 
                          variant="sage" 
                          disabled={!reframe || isSaving} 
                          onClick={handleSaveExercise}
                          className="flex items-center gap-2"
                        >
                          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                          Save to Journal
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CBTModule;