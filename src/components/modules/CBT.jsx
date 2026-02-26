import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, ArrowLeft, ArrowRight, Sparkles, BookOpen, Target, PenTool, CheckCircle, Loader2, Award } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { ClinicalService } from '../../lib/supabaseService';
import Button from '../../components/common/Button';

const CBTModule = () => {
  const [activeTab, setActiveTab] = useState('basics'); 
  
  // Thought Record State
  const [step, setStep] = useState(1);
  const [situation, setSituation] = useState('');
  const [emotion, setEmotion] = useState(5);
  const [automaticThought, setAutomaticThought] = useState('');
  const [reframe, setReframe] = useState('');
  
  // UI & Save State
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  // Workshop Completion State
  const [isWorkshopCompleting, setIsWorkshopCompleting] = useState(false);
  const [workshopCompleted, setWorkshopCompleted] = useState(false);

  // AI Reframe Handler
  const handleGenerateReframe = async () => {
    if (!automaticThought) return;
    setIsGenerating(true);
    try {
      const suggestions = await ClinicalService.generateAIReframe(automaticThought);
      setAiSuggestions(suggestions);
    } catch (error) {
      console.error("AI Error:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Save Thought Record Exercise
  const handleSaveExercise = async () => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert("Please log in to save your progress.");
        return;
      }

      const CBT_EXERCISE_UUID = '76654924-1101-4433-8901-000000000001'; 
      
      await ClinicalService.saveActivityLog(user.id, CBT_EXERCISE_UUID, {
        situation,
        emotion_intensity: emotion,
        automatic_thought: automaticThought,
        reframe,
        type: "CBT_THOUGHT_RECORD"
      });

      await ClinicalService.saveJournalEntry(
        user.id, 
        `**CBT Reframe**\nSituation: ${situation}\nOriginal Thought: ${automaticThought}\nBalanced Reframe: ${reframe}`, 
        'Determined'
      );
      
      setIsComplete(true);
    } catch (error) {
      console.error("Failed to save exercise:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // NEW: Complete Entire Workshop Handler
  const handleCompleteWorkshop = async () => {
    setIsWorkshopCompleting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // A distinct UUID for completing the whole module
      const CBT_WORKSHOP_UUID = '76654924-1101-4433-8901-000000000002';

      await ClinicalService.saveActivityLog(user.id, CBT_WORKSHOP_UUID, {
        type: "CBT_WORKSHOP_COMPLETE",
        completed_at: new Date().toISOString()
      });

      await ClinicalService.saveJournalEntry(
        user.id, 
        `🏆 **Workshop Completed: Cognitive Behavioral Therapy**\nI successfully completed the CBT foundations module today. I am taking active steps to rewire my thought patterns.`, 
        'Empowered'
      );

      setWorkshopCompleted(true);
    } catch (error) {
      console.error("Failed to complete workshop:", error);
    } finally {
      setIsWorkshopCompleting(false);
    }
  };

  const tabs = [
    { id: 'basics', label: 'The Basics', icon: BookOpen },
    { id: 'distortions', label: 'Cognitive Bugs', icon: Target },
    { id: 'exercise', label: 'Thought Record', icon: PenTool },
    { id: 'workshop', label: 'Wrap Up', icon: Award } // NEW TAB
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 md:py-12 min-h-screen animate-fade-in">
      
      <Link to="/modules" className="inline-flex items-center gap-2 text-stone-500 dark:text-zinc-400 hover:text-stone-800 dark:hover:text-zinc-100 mb-6 md:mb-8 transition-colors font-medium text-sm">
        <ArrowLeft className="w-4 h-4" /> Back to Pathways
      </Link>
      
      <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-8">
        <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 flex items-center justify-center shadow-sm border border-blue-100 dark:border-blue-800">
          <Brain className="w-7 h-7 md:w-8 md:h-8" />
        </div>
        <div>
          <h1 className="text-3xl md:text-4xl font-serif text-stone-900 dark:text-zinc-100 mb-1">Cognitive Behavioral Therapy</h1>
          <p className="text-stone-500 dark:text-zinc-400 text-sm md:text-base">Rewire your thought patterns to change how you feel.</p>
        </div>
      </div>

      <div className="flex overflow-x-auto no-scrollbar gap-2 mb-8 bg-stone-100/50 dark:bg-zinc-900/50 p-1.5 rounded-2xl border border-stone-200/50 dark:border-zinc-800">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 min-w-fit whitespace-nowrap py-3 px-4 md:px-6 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === tab.id 
                ? 'bg-white dark:bg-zinc-800 text-stone-900 dark:text-zinc-100 shadow-sm' 
                : 'text-stone-500 dark:text-zinc-500 hover:text-stone-700 dark:hover:text-zinc-300'
            }`}
          >
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-[2rem] p-6 md:p-8 shadow-sm border border-stone-100 dark:border-zinc-800 min-h-[450px] transition-colors duration-300">
        <AnimatePresence mode="wait">
          
          {/* ... (Keep your existing 'basics' and 'distortions' code exactly the same here) ... */}
          {activeTab === 'basics' && (
            <motion.div key="basics" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <h2 className="text-2xl font-serif text-stone-800 dark:text-zinc-100 mb-4">The Cognitive Triangle</h2>
              <p className="text-stone-600 dark:text-zinc-400 mb-6 leading-relaxed">
                CBT is built on the fact that your <strong>thoughts</strong>, <strong>feelings</strong>, and <strong>behaviors</strong> create a loop.
              </p>
              
              <div className="bg-blue-50/50 dark:bg-blue-900/10 rounded-2xl p-8 border border-blue-100 dark:border-blue-900/50 flex flex-col items-center">
                <div className="grid grid-cols-1 gap-8 text-center max-w-xs">
                  <div className="space-y-1">
                    <p className="font-bold text-blue-800 dark:text-blue-400">Thoughts</p>
                    <p className="text-xs text-blue-600/70 dark:text-blue-500/70">What you think affects how you feel.</p>
                  </div>
                  <div className="flex justify-between gap-12">
                    <div className="space-y-1">
                      <p className="font-bold text-blue-800 dark:text-blue-400">Feelings</p>
                      <p className="text-xs text-blue-600/70 dark:text-blue-500/70">How you feel affects what you do.</p>
                    </div>
                    <div className="space-y-1">
                      <p className="font-bold text-blue-800 dark:text-blue-400">Actions</p>
                      <p className="text-xs text-blue-600/70 dark:text-blue-500/70">What you do affects how you think.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <Button onClick={() => setActiveTab('distortions')} className="flex items-center gap-2">Next: Cognitive Bugs <ArrowRight className="w-4 h-4"/></Button>
              </div>
            </motion.div>
          )}

          {activeTab === 'distortions' && (
            <motion.div key="distortions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <h2 className="text-2xl font-serif text-stone-800 dark:text-zinc-100 mb-4">Cognitive Bugs</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {[
                  { title: "All-or-Nothing", desc: "Seeing things in black and white." },
                  { title: "Catastrophizing", desc: "Assuming the worst will happen." },
                  { title: "Mind Reading", desc: "Assuming you know what others think." },
                  { title: "Should Statements", desc: "Rigid rules that create guilt." }
                ].map((bug, i) => (
                  <div key={i} className="p-4 rounded-2xl bg-stone-50 dark:bg-zinc-800 border border-stone-100 dark:border-zinc-700">
                    <h4 className="font-bold text-stone-800 dark:text-zinc-100 text-sm mb-1">{bug.title}</h4>
                    <p className="text-xs text-stone-500 dark:text-zinc-400">{bug.desc}</p>
                  </div>
                ))}
              </div>
              <div className="mt-8 flex justify-end">
                <Button onClick={() => setActiveTab('exercise')} className="flex items-center gap-2">Next: Start Exercise <ArrowRight className="w-4 h-4"/></Button>
              </div>
            </motion.div>
          )}

          {/* ... (Keep your existing 'exercise' code exactly the same here) ... */}
          {activeTab === 'exercise' && (
            <motion.div key="exercise" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {isComplete ? (
                <div className="flex flex-col items-center justify-center text-center py-12">
                  <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle className="w-8 h-8" />
                  </div>
                  <h2 className="text-2xl font-serif text-stone-900 dark:text-zinc-100 mb-2">Reframed Successfully</h2>
                  <p className="text-stone-500 dark:text-zinc-400 text-sm mb-8">This thought has been recorded in your journey logs.</p>
                  <div className="flex gap-4">
                    <Button variant="outline" onClick={() => { setIsComplete(false); setStep(1); }}>Another Record</Button>
                    <Button variant="sage" onClick={() => setActiveTab('workshop')}>Finish Workshop <ArrowRight className="w-4 h-4 ml-2"/></Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Keep the 4-step exercise logic here */}
                  <div className="flex justify-between items-center">
                    <h3 className="font-serif text-xl text-stone-800 dark:text-zinc-100">Step {step} of 4</h3>
                    <div className="h-1.5 w-24 bg-stone-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${(step / 4) * 100}%` }} />
                    </div>
                  </div>

                  {step === 1 && (
                    <div className="space-y-4">
                      <label className="block text-sm font-bold text-stone-700 dark:text-zinc-300">The Situation</label>
                      <textarea value={situation} onChange={(e) => setSituation(e.target.value)} className="w-full p-4 rounded-xl border border-stone-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 outline-none transition-all min-h-[100px]" placeholder="What happened?" />
                      <div className="flex justify-end"><Button disabled={!situation} onClick={() => setStep(2)}>Continue</Button></div>
                    </div>
                  )}

                  {step === 2 && (
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-bold text-stone-700 dark:text-zinc-300 mb-2">Automatic Thought</label>
                        <textarea value={automaticThought} onChange={(e) => setAutomaticThought(e.target.value)} className="w-full p-4 rounded-xl border border-stone-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800 dark:text-zinc-100 outline-none min-h-[100px]" placeholder="What did your brain tell you?" />
                      </div>
                      <div className="flex justify-between items-center"><Button variant="secondary" onClick={() => setStep(1)}>Back</Button><Button disabled={!automaticThought} onClick={() => setStep(3)}>Next Step</Button></div>
                    </div>
                  )}

                  {step === 3 && (
                    <div className="space-y-6">
                      <div className="p-5 rounded-2xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/50">
                        <p className="text-xs text-blue-600 dark:text-blue-400 font-bold uppercase mb-2">Original Thought</p>
                        <p className="text-stone-800 dark:text-zinc-200 italic">"{automaticThought}"</p>
                      </div>
                      {aiSuggestions.length > 0 ? (
                        <div className="space-y-2">
                          <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-2"><Sparkles className="w-3 h-3"/> AI Alternative Perspectives</p>
                          {aiSuggestions.map((s, i) => (
                            <button key={i} onClick={() => setReframe(s)} className="w-full text-left p-3 rounded-xl border border-indigo-100 dark:border-indigo-900/30 bg-white dark:bg-zinc-800 text-sm hover:border-indigo-400 transition-all">{s}</button>
                          ))}
                        </div>
                      ) : (
                        <div className="flex justify-center"><Button variant="outline" onClick={handleGenerateReframe} disabled={isGenerating} className="flex items-center gap-2">{isGenerating ? <Loader2 className="animate-spin w-4 h-4"/> : <Sparkles className="w-4 h-4"/>} Challenge with AI</Button></div>
                      )}
                      <div className="flex justify-between pt-4"><Button variant="secondary" onClick={() => setStep(2)}>Back</Button><Button onClick={() => setStep(4)}>Next Step</Button></div>
                    </div>
                  )}

                  {step === 4 && (
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-bold text-stone-700 dark:text-zinc-300 mb-2">Balanced Thought</label>
                        <textarea value={reframe} onChange={(e) => setReframe(e.target.value)} className="w-full p-4 rounded-xl border border-stone-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800 dark:text-zinc-100 min-h-[100px]" placeholder="Write a more realistic, evidence-based thought..." />
                      </div>
                      <div className="flex justify-between items-center"><Button variant="secondary" onClick={() => setStep(3)}>Back</Button><Button variant="sage" disabled={!reframe || isSaving} onClick={handleSaveExercise} className="flex items-center gap-2">{isSaving ? <Loader2 className="animate-spin w-4 h-4"/> : <CheckCircle className="w-4 h-4"/>} Save to Journal</Button></div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {/* NEW: Workshop Completion Tab */}
          {activeTab === 'workshop' && (
            <motion.div key="workshop" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center text-center py-10 md:py-16">
              
              {workshopCompleted ? (
                <>
                  <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mb-6 shadow-sm border border-blue-200 dark:border-blue-800">
                    <Award className="w-10 h-10" />
                  </div>
                  <h2 className="text-3xl font-serif text-stone-900 dark:text-zinc-100 mb-4">Workshop Completed!</h2>
                  <p className="text-stone-500 dark:text-zinc-400 max-w-md mb-8 leading-relaxed">
                    You have officially mastered the foundations of Cognitive Behavioral Therapy. Your progress has been updated on your dashboard.
                  </p>
                  <Link to="/dashboard">
                    <Button variant="sage">Return to Dashboard</Button>
                  </Link>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 bg-stone-100 dark:bg-zinc-800 text-stone-600 dark:text-zinc-400 rounded-full flex items-center justify-center mb-6">
                    <BookOpen className="w-8 h-8" />
                  </div>
                  <h2 className="text-2xl font-serif text-stone-900 dark:text-zinc-100 mb-4">Ready to wrap up?</h2>
                  <p className="text-stone-500 dark:text-zinc-400 max-w-md mb-10 leading-relaxed">
                    By completing this workshop, you acknowledge your understanding of the Cognitive Triangle and the process of challenging automatic negative thoughts.
                  </p>
                  <Button 
                    onClick={handleCompleteWorkshop} 
                    disabled={isWorkshopCompleting}
                    className="flex items-center gap-2 bg-stone-900 hover:bg-stone-800 text-white dark:bg-white dark:text-zinc-900 px-8 py-3 text-lg"
                  >
                    {isWorkshopCompleting ? <Loader2 className="animate-spin w-5 h-5" /> : <Award className="w-5 h-5" />}
                    Mark Workshop as Complete
                  </Button>
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