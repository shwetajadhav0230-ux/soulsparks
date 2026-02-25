import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, ArrowLeft, ArrowRight, Wind, CheckCircle, Loader2, Brain, 
  Heart, Activity, Droplets, MessageCircle, Leaf, Zap, Thermometer, Play, Pause
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { ClinicalService } from '../../lib/supabaseService';
import Button from '../../components/common/Button';

const DBTModule = () => {
  const [activeTab, setActiveTab] = useState('basics');

  // --- 1. BASICS STATE ---
  const [activePillar, setActivePillar] = useState(null);

  // --- 2. T.I.P.P. SKILLS STATE ---
  const [tippStep, setTippStep] = useState(1);
  const [distressBefore, setDistressBefore] = useState(8);
  const [selectedTipp, setSelectedTipp] = useState(null);
  const [distressAfter, setDistressAfter] = useState(5);
  const [isSavingTipp, setIsSavingTipp] = useState(false);
  
  const [actionTimer, setActionTimer] = useState(0);
  const [isActionActive, setIsActionActive] = useState(false);
  const [actionPhase, setActionPhase] = useState('ready');

  // --- 3. RADICAL ACCEPTANCE STATE ---
  const [radStep, setRadStep] = useState(1);
  const [situation, setSituation] = useState('');
  const [cost, setCost] = useState('');
  const [statement, setStatement] = useState('');
  const [acceptanceLevel, setAcceptanceLevel] = useState(0); 
  const [isSavingRad, setIsSavingRad] = useState(false);
  const [isRadComplete, setIsRadComplete] = useState(false);

  // --- 4. MINDFULNESS STATE ---
  const [isBreathing, setIsBreathing] = useState(false);
  const [breathPattern, setBreathPattern] = useState('box'); 
  const [breathPhase, setBreathPhase] = useState(0);
  const [phaseTimeLeft, setPhaseTimeLeft] = useState(0);

  const patterns = {
    box: [
      { text: "Breathe In", duration: 4, scale: 1.5, opacity: 1 },
      { text: "Hold", duration: 4, scale: 1.5, opacity: 0.7 },
      { text: "Breathe Out", duration: 4, scale: 1, opacity: 1 },
      { text: "Hold", duration: 4, scale: 1, opacity: 0.7 }
    ],
    relax: [
      { text: "Breathe In", duration: 4, scale: 1.5, opacity: 1 },
      { text: "Hold", duration: 7, scale: 1.5, opacity: 0.7 },
      { text: "Exhale Slowly", duration: 8, scale: 0.8, opacity: 1 }
    ]
  };

  // --- TIMERS ---
  useEffect(() => {
    let interval = null;
    if (isActionActive && actionTimer > 0) {
      interval = setInterval(() => setActionTimer((prev) => prev - 1), 1000);
    } else if (isActionActive && actionTimer === 0) {
      setIsActionActive(false);
      setActionPhase('done');
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isActionActive, actionTimer]);

  useEffect(() => {
    let timer;
    if (isBreathing) {
      const currentPattern = patterns[breathPattern];
      setPhaseTimeLeft(currentPattern[breathPhase].duration);

      timer = setInterval(() => {
        setPhaseTimeLeft((prev) => {
          if (prev <= 1) {
            setBreathPhase((p) => (p + 1) % currentPattern.length);
            return currentPattern[(breathPhase + 1) % currentPattern.length].duration;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setBreathPhase(0);
      setPhaseTimeLeft(0);
    }
    return () => clearInterval(timer);
  }, [isBreathing, breathPhase, breathPattern]);


  // --- DATABASE CONNECTION HANDLERS ---
  
  const startTippAction = (duration) => {
    setActionTimer(duration);
    setIsActionActive(true);
    setActionPhase('active');
  };

  const handleSaveTIPP = async () => {
    setIsSavingTipp(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // 1. Save detailed clinical record
        await ClinicalService.saveActivityLog(user.id, 'dbt-tipp-log-001', {
          skill_used: selectedTipp.title,
          distress_before: distressBefore,
          distress_after: distressAfter,
          improvement: distressBefore - distressAfter
        });

        // 2. Ping the "Daily Goal" tracker so the My Wellness Dashboard updates immediately
        await ClinicalService.saveActivityLog(user.id, 'a0000000-0000-0000-0000-000000000002', { 
          completed: true, 
          activity_type: 'TIPP Skill' 
        });
      }
      setTippStep(5);
    } catch (e) { 
      console.error("Database Save Error:", e); 
    } finally { 
      setIsSavingTipp(false); 
    }
  };

  const handleSaveRadical = async () => {
    setIsSavingRad(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // 1. Save detailed clinical record
        await ClinicalService.saveActivityLog(user.id, 'dbt-radical-acceptance-001', {
          situation, 
          cost, 
          statement, 
          final_acceptance_level: acceptanceLevel
        });

        // 2. Ping the "Daily Goal" tracker for the Wellness Dashboard
        await ClinicalService.saveActivityLog(user.id, 'a0000000-0000-0000-0000-000000000002', { 
          completed: true, 
          activity_type: 'Radical Acceptance' 
        });
      }
      setIsRadComplete(true);
    } catch (e) { 
      console.error("Database Save Error:", e); 
    } finally { 
      setIsSavingRad(false); 
    }
  };

  const tabs = [
    { id: 'basics', label: 'DBT Pillars', icon: Brain },
    { id: 'tipp', label: 'T.I.P.P. Skills', icon: Activity },
    { id: 'radical', label: 'Radical Acceptance', icon: Heart },
    { id: 'mindfulness', label: 'Mindfulness', icon: Wind }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 min-h-screen">
      <Link to="/modules" className="inline-flex items-center gap-2 text-stone-500 hover:text-stone-800 mb-8 transition-colors font-medium text-sm">
        <ArrowLeft className="w-4 h-4" /> Back to Pathways
      </Link>
      
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center shadow-sm">
          <Users className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-4xl font-serif text-stone-900 mb-1">Dialectical Behavior Therapy</h1>
          <p className="text-stone-500">Regulate your nervous system, tolerate distress, and build resilience.</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-8 bg-stone-100/50 p-1.5 rounded-2xl">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 min-w-[140px] py-3 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all relative ${
              activeTab === tab.id ? 'text-purple-900' : 'text-stone-500 hover:text-stone-700 hover:bg-white/50'
            }`}
          >
            {activeTab === tab.id && (
              <motion.div layoutId="activeTabIndicator" className="absolute inset-0 bg-white rounded-xl shadow-sm" />
            )}
            <span className="relative z-10 flex items-center gap-2">
              <tab.icon className="w-4 h-4" /> {tab.label}
            </span>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-stone-100 min-h-[500px] overflow-hidden">
        <AnimatePresence mode="wait">
          
          {/* ========================================== */}
          {/* TAB 1: INTERACTIVE PILLARS                   */}
          {/* ========================================== */}
          {activeTab === 'basics' && (
            <motion.div key="basics" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <h2 className="text-2xl font-serif text-stone-800 mb-2">The Four Pillars</h2>
              <p className="text-stone-600 mb-8">Click a pillar to explore its core question and try a quick grounding technique.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { id: 'mind', title: 'Mindfulness', icon: Leaf, q: "Am I fully in the present moment?", action: "Notice 3 things you can see right now." },
                  { id: 'tolerate', title: 'Distress Tolerance', icon: Zap, q: "How can I survive this without making it worse?", action: "Hold an ice cube for 30 seconds." },
                  { id: 'regulate', title: 'Emotion Regulation', icon: Heart, q: "What is this emotion telling me to do?", action: "Name the emotion out loud without judging it." },
                  { id: 'interpersonal', title: 'Interpersonal Effectiveness', icon: MessageCircle, q: "How can I respect myself while maintaining this relationship?", action: "Practice saying 'No' to a small request today." }
                ].map((pillar) => (
                  <motion.div 
                    key={pillar.id} layout
                    onClick={() => setActivePillar(activePillar === pillar.id ? null : pillar.id)}
                    className={`p-6 rounded-2xl border cursor-pointer transition-all ${
                      activePillar === pillar.id ? 'bg-purple-900 text-white border-purple-900 shadow-xl' : 'bg-stone-50 border-stone-100 hover:bg-purple-50 hover:border-purple-200 text-stone-800'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl ${activePillar === pillar.id ? 'bg-white/20' : 'bg-purple-100 text-purple-700'}`}>
                        <pillar.icon className="w-6 h-6" />
                      </div>
                      <h4 className="font-bold text-lg">{pillar.title}</h4>
                    </div>
                    
                    <AnimatePresence>
                      {activePillar === pillar.id && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-6 overflow-hidden">
                          <p className="text-purple-200 text-sm font-bold uppercase tracking-wider mb-1">Core Question</p>
                          <p className="text-white text-lg font-serif italic mb-4">"{pillar.q}"</p>
                          <div className="bg-white/10 p-4 rounded-xl border border-white/20">
                            <p className="text-purple-100 text-xs font-bold uppercase mb-1">Quick Action</p>
                            <p className="text-white text-sm">{pillar.action}</p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>
              
              <div className="mt-8 pt-6 border-t border-stone-100 flex justify-end">
                <Button variant="sage" onClick={() => setActiveTab('tipp')} className="flex items-center gap-2">
                  Next: T.I.P.P. Skills <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* ========================================== */}
          {/* TAB 2: T.I.P.P. SKILLS (Interactive Engine)  */}
          {/* ========================================== */}
          {activeTab === 'tipp' && (
            <motion.div key="tipp" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              
              {tippStep === 1 && (
                <div className="text-center py-8">
                  <h2 className="text-3xl font-serif text-stone-900 mb-4">Check Your Distress Level</h2>
                  <p className="text-stone-500 mb-12 max-w-md mx-auto">Before using a crisis survival skill, rate how overwhelmed you feel right now.</p>
                  
                  <div className="max-w-md mx-auto bg-stone-50 p-8 rounded-3xl border border-stone-200">
                    <span className="text-6xl font-serif text-purple-600 block mb-6">{distressBefore}</span>
                    <input 
                      type="range" min="1" max="10" value={distressBefore} onChange={(e) => setDistressBefore(parseInt(e.target.value))}
                      className="w-full accent-purple-600 h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer mb-4"
                    />
                    <div className="flex justify-between text-xs font-bold text-stone-400 uppercase tracking-widest mb-8">
                      <span>Mild (1)</span><span>Severe (10)</span>
                    </div>
                    <Button variant="sage" className="w-full py-4 text-lg" onClick={() => setTippStep(2)}>Choose a Skill</Button>
                  </div>
                </div>
              )}

              {tippStep === 2 && (
                <div>
                  <h2 className="text-2xl font-serif text-stone-800 mb-2">Select a T.I.P.P. Skill</h2>
                  <p className="text-stone-500 mb-8">Your distress is at a <strong>{distressBefore}/10</strong>. Pick a skill to immediately alter your body chemistry.</p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { id: 't', title: 'Temperature', duration: 30, icon: Thermometer, desc: 'Hold ice cubes or splash cold water on your face. Triggers the dive reflex to slow heart rate.', instruct: 'Get a bowl of cold water or an ice pack. Apply it to your eyes and cheeks. Hold your breath, lean forward, and press play.' },
                      { id: 'i', title: 'Intense Exercise', duration: 60, icon: Activity, desc: 'Do jumping jacks or sprint in place for 60 seconds to burn off adrenaline.', instruct: 'Stand up. Get ready to do jumping jacks, burpees, or run in place as fast as you can to burn off the anxious energy.' },
                      { id: 'p1', title: 'Paced Breathing', duration: 0, icon: Wind, desc: 'Breathe deeply into your stomach. Exhale longer than you inhale.', instruct: 'Jump directly to the Mindfulness tab to use the Box Breathing visualizer.' },
                      { id: 'p2', title: 'Paired Muscle Relaxation', duration: 45, icon: Brain, desc: 'Tense a muscle group tightly, then completely relax it while breathing out.', instruct: 'Tense every muscle in your body as hard as you can (fists, arms, legs, face) for 5 seconds, then let it all go completely.' }
                    ].map(skill => (
                      <button 
                        key={skill.id} onClick={() => { 
                          setSelectedTipp(skill); 
                          if (skill.id === 'p1') {
                            setActiveTab('mindfulness');
                          } else {
                            setTippStep(3); 
                            setActionPhase('ready');
                          }
                        }}
                        className="text-left p-6 bg-white border-2 border-stone-100 hover:border-purple-300 hover:shadow-md rounded-2xl transition-all group"
                      >
                        <skill.icon className="w-8 h-8 text-purple-400 group-hover:text-purple-600 mb-4 transition-colors" />
                        <h4 className="font-bold text-stone-800 text-lg mb-2">{skill.title}</h4>
                        <p className="text-sm text-stone-500 leading-relaxed">{skill.desc}</p>
                      </button>
                    ))}
                  </div>
                  <button onClick={() => setTippStep(1)} className="mt-8 text-sm font-bold text-stone-400 hover:text-stone-600 flex items-center gap-2"><ArrowLeft className="w-4 h-4" /> Change Distress Rating</button>
                </div>
              )}

              {tippStep === 3 && selectedTipp && (
                <div className="text-center py-8">
                  <div className="w-20 h-20 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <selectedTipp.icon className="w-10 h-10" />
                  </div>
                  <h2 className="text-3xl font-serif text-stone-900 mb-4">{selectedTipp.title}</h2>
                  
                  {actionPhase === 'ready' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <p className="text-stone-600 mb-8 max-w-md mx-auto text-lg">{selectedTipp.instruct}</p>
                      <Button variant="sage" className="px-8 py-4 text-lg" onClick={() => startTippAction(selectedTipp.duration)}>
                        <Play className="w-5 h-5 inline-block mr-2" /> Start {selectedTipp.duration}s Timer
                      </Button>
                      <button onClick={() => setTippStep(2)} className="block mx-auto mt-6 text-sm text-stone-400 font-bold hover:text-stone-600">Pick a different skill</button>
                    </motion.div>
                  )}

                  {actionPhase === 'active' && (
                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="py-12">
                      <div className="relative w-48 h-48 mx-auto flex items-center justify-center">
                         <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                           <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-stone-100" />
                           <circle 
                             cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="8" fill="transparent" 
                             className="text-purple-500 transition-all duration-1000 ease-linear"
                             strokeDasharray={2 * Math.PI * 88}
                             strokeDashoffset={2 * Math.PI * 88 * (1 - (actionTimer / selectedTipp.duration))}
                           />
                         </svg>
                         <span className="text-6xl font-serif text-purple-800">{actionTimer}</span>
                      </div>
                      
                      {selectedTipp.id === 'p2' && (
                        <p className="mt-8 text-xl font-bold text-stone-600 animate-pulse">
                          {actionTimer % 15 > 10 ? "TENSE HARD!" : "RELAX COMPLETELY..."}
                        </p>
                      )}

                      <Button variant="outline" className="mt-12" onClick={() => { setIsActionActive(false); setActionPhase('ready'); }}>
                        <Pause className="w-4 h-4 inline-block mr-2" /> Stop Early
                      </Button>
                    </motion.div>
                  )}

                  {actionPhase === 'done' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                      <p className="text-stone-600 mb-8 text-xl max-w-md mx-auto">Great job. Take a deep breath.</p>
                      <Button variant="sage" className="px-8 py-4 text-lg" onClick={() => setTippStep(4)}>
                        Continue to Evaluation <ArrowRight className="w-5 h-5 inline-block ml-2" />
                      </Button>
                    </motion.div>
                  )}
                </div>
              )}

              {tippStep === 4 && (
                <div className="text-center py-8">
                  <h2 className="text-3xl font-serif text-stone-900 mb-4">Re-evaluate Distress</h2>
                  <p className="text-stone-500 mb-12 max-w-md mx-auto">You used <strong>{selectedTipp?.title}</strong>. Check in with your body. Rate your distress level now.</p>
                  
                  <div className="max-w-md mx-auto bg-purple-50 p-8 rounded-3xl border border-purple-100">
                    <span className="text-6xl font-serif text-purple-600 block mb-6">{distressAfter}</span>
                    <input 
                      type="range" min="1" max="10" value={distressAfter} onChange={(e) => setDistressAfter(parseInt(e.target.value))}
                      className="w-full accent-purple-600 h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer mb-4"
                    />
                    <div className="flex justify-between text-xs font-bold text-purple-400 uppercase tracking-widest mb-8">
                      <span>Calm (1)</span><span>Severe (10)</span>
                    </div>
                    
                    <div className="bg-white p-4 rounded-xl mb-6 flex justify-between items-center shadow-sm">
                      <span className="text-stone-500 text-sm font-bold uppercase">Improvement:</span>
                      <span className={`text-xl font-bold ${distressBefore - distressAfter > 0 ? 'text-green-500' : 'text-stone-400'}`}>
                        {distressBefore - distressAfter > 0 ? `-${distressBefore - distressAfter} Points` : 'No Change'}
                      </span>
                    </div>

                    <Button variant="sage" className="w-full py-4 text-lg" onClick={handleSaveTIPP} disabled={isSavingTipp}>
                      {isSavingTipp ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : "Log & Update Dashboard"}
                    </Button>
                  </div>
                </div>
              )}

              {tippStep === 5 && (
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-10 h-10" />
                  </div>
                  <h2 className="text-3xl font-serif text-stone-900 mb-2">Saved to Dashboard!</h2>
                  <p className="text-stone-500 max-w-md mx-auto mb-10">Your clinical data is logged, and your Daily Goal has been marked as complete on your Wellness dashboard.</p>
                  
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Button variant="outline" onClick={() => { setTippStep(1); setDistressBefore(8); setDistressAfter(5); setActionPhase('ready'); }}>Log Another Skill</Button>
                    <Button variant="sage" onClick={() => { setActiveTab('radical'); setTippStep(1); }} className="flex items-center gap-2">
                      Next: Radical Acceptance <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}

              {tippStep !== 5 && (
                <div className="mt-12 pt-6 border-t border-stone-100 flex justify-end">
                  <Button variant="secondary" onClick={() => { setActiveTab('radical'); setTippStep(1); }} className="flex items-center gap-2">
                    Skip to Radical Acceptance <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </motion.div>
          )}

          {/* ========================================== */}
          {/* TAB 3: RADICAL ACCEPTANCE                  */}
          {/* ========================================== */}
          {activeTab === 'radical' && (
            <motion.div key="radical" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              {isRadComplete ? (
                 <div className="text-center py-16">
                  <div className="w-20 h-20 bg-stone-100 text-stone-800 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-10 h-10" />
                  </div>
                  <h2 className="text-3xl font-serif text-stone-900 mb-2">Saved to Dashboard!</h2>
                  <p className="text-stone-500 max-w-md mx-auto mb-10">Your acceptance statement is safely stored, and your Daily Goal tracker has been updated.</p>
                  
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Button variant="outline" onClick={() => { setIsRadComplete(false); setRadStep(1); setSituation(''); setCost(''); setStatement(''); setAcceptanceLevel(0); }}>Start Over</Button>
                    <Button variant="sage" onClick={() => { setActiveTab('mindfulness'); setIsRadComplete(false); }} className="flex items-center gap-2">
                      Next: Mindfulness <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-end mb-8">
                    <div>
                      <h2 className="text-2xl font-serif text-stone-800 mb-2">Radical Acceptance</h2>
                      <p className="text-stone-500 text-sm">Pain is inevitable, but suffering is optional.</p>
                    </div>
                    <span className="text-sm font-bold text-stone-400">Phase {radStep} of 4</span>
                  </div>

                  {radStep === 1 && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                      <label className="block text-stone-800 font-bold mb-3">1. Name the Reality</label>
                      <p className="text-sm text-stone-500 mb-4">What exact fact or situation are you fighting, refusing to accept, or wishing were different?</p>
                      <textarea 
                        value={situation} onChange={(e) => setSituation(e.target.value)}
                        className="w-full p-4 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:ring-2 focus:ring-purple-500 transition-all min-h-[120px]"
                        placeholder="e.g., I was passed over for the promotion I worked hard for."
                      />
                      <div className="mt-6 flex justify-end">
                        <Button variant="sage" disabled={!situation} onClick={() => setRadStep(2)}>Next</Button>
                      </div>
                    </motion.div>
                  )}

                  {radStep === 2 && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                      <label className="block text-stone-800 font-bold mb-3">2. The Cost of Non-Acceptance</label>
                      <p className="text-sm text-stone-500 mb-4">What is fighting this reality doing to your body and mind right now?</p>
                      <textarea 
                        value={cost} onChange={(e) => setCost(e.target.value)}
                        className="w-full p-4 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:ring-2 focus:ring-purple-500 transition-all min-h-[120px]"
                        placeholder="e.g., I'm resentful, tense in my shoulders, and avoiding my coworkers."
                      />
                      <div className="mt-6 flex justify-between">
                        <Button variant="secondary" onClick={() => setRadStep(1)}>Back</Button>
                        <Button variant="sage" disabled={!cost} onClick={() => setRadStep(3)}>Next</Button>
                      </div>
                    </motion.div>
                  )}

                  {radStep === 3 && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                      <label className="block text-stone-800 font-bold mb-3">3. The Turning Point</label>
                      <p className="text-sm text-stone-500 mb-4">Write a statement that acknowledges reality without approving of it. "I don't like it, but it is what it is."</p>
                      <textarea 
                        value={statement} onChange={(e) => setStatement(e.target.value)}
                        className="w-full p-4 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:ring-2 focus:ring-purple-500 transition-all min-h-[120px]"
                        placeholder="e.g., It is unfair that I didn't get the promotion. It hurts. But it is the reality of the situation right now."
                      />
                      <div className="mt-6 flex justify-between">
                        <Button variant="secondary" onClick={() => setRadStep(2)}>Back</Button>
                        <Button variant="sage" disabled={!statement} onClick={() => setRadStep(4)}>Finalize Commitment</Button>
                      </div>
                    </motion.div>
                  )}

                  {radStep === 4 && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="text-center py-8">
                      <h3 className="font-serif text-2xl text-stone-800 mb-6">Commit to Reality</h3>
                      <div className="bg-purple-50 border border-purple-100 p-6 rounded-2xl mb-8 max-w-lg mx-auto italic text-purple-900 font-serif text-lg">
                        "{statement}"
                      </div>
                      
                      <p className="text-stone-500 text-sm mb-4">Drag the slider to physically commit to letting go of the struggle.</p>
                      
                      <div className="max-w-md mx-auto mb-10">
                        <input 
                          type="range" min="0" max="100" value={acceptanceLevel} onChange={(e) => setAcceptanceLevel(parseInt(e.target.value))}
                          className="w-full accent-green-600 h-4 bg-stone-200 rounded-full appearance-none cursor-ew-resize"
                        />
                        <div className="mt-4 text-center font-bold text-stone-800 text-xl">{acceptanceLevel}% Accepted</div>
                      </div>

                      <div className="flex justify-between items-center mt-8">
                        <Button variant="secondary" onClick={() => setRadStep(3)}>Back</Button>
                        <Button 
                          variant={acceptanceLevel > 80 ? "sage" : "outline"} 
                          disabled={acceptanceLevel < 80 || isSavingRad} 
                          onClick={handleSaveRadical}
                        >
                          {isSavingRad ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Log & Update Dashboard"}
                        </Button>
                      </div>
                    </motion.div>
                  )}
                  
                  <div className="mt-12 pt-6 border-t border-stone-100 flex justify-end">
                    <Button variant="secondary" onClick={() => setActiveTab('mindfulness')} className="flex items-center gap-2">
                      Skip to Mindfulness <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </>
              )}
            </motion.div>
          )}

          {/* ========================================== */}
          {/* TAB 4: MINDFULNESS                         */}
          {/* ========================================== */}
          {activeTab === 'mindfulness' && (
            <motion.div key="mindfulness" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <div className="flex flex-col md:flex-row gap-12 items-center justify-center py-8">
                
                {/* Visualizer */}
                <div className="relative w-72 h-72 flex items-center justify-center">
                  <div className="absolute inset-0 border-[3px] border-dashed border-stone-200 rounded-full animate-[spin_60s_linear_infinite]" />
                  
                  <motion.div
                    className="w-32 h-32 bg-gradient-to-tr from-purple-200 to-blue-200 rounded-full flex items-center justify-center shadow-xl shadow-purple-900/10"
                    animate={isBreathing ? { 
                      scale: patterns[breathPattern][breathPhase].scale,
                      opacity: patterns[breathPattern][breathPhase].opacity,
                    } : { scale: 1, opacity: 1 }}
                    transition={{ duration: patterns[breathPattern][breathPhase]?.duration || 1, ease: "easeInOut" }}
                  >
                    {isBreathing && (
                      <span className="text-white font-bold text-3xl font-serif drop-shadow-md">
                        {phaseTimeLeft}
                      </span>
                    )}
                  </motion.div>

                  <div className="absolute inset-x-0 -bottom-16 text-center">
                    <h3 className="text-2xl font-serif text-stone-800 transition-all duration-500">
                      {isBreathing ? patterns[breathPattern][breathPhase].text : "Ready to focus?"}
                    </h3>
                  </div>
                </div>

                {/* Controls */}
                <div className="w-full max-w-xs space-y-6">
                  <div className="bg-stone-50 p-2 rounded-2xl flex border border-stone-100">
                    <button 
                      onClick={() => !isBreathing && setBreathPattern('box')}
                      disabled={isBreathing}
                      className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all ${breathPattern === 'box' ? 'bg-white shadow-sm text-stone-800' : 'text-stone-400'}`}
                    >
                      Box (4-4-4-4)
                    </button>
                    <button 
                      onClick={() => !isBreathing && setBreathPattern('relax')}
                      disabled={isBreathing}
                      className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all ${breathPattern === 'relax' ? 'bg-white shadow-sm text-stone-800' : 'text-stone-400'}`}
                    >
                      Relax (4-7-8)
                    </button>
                  </div>

                  <div className="text-sm text-stone-500 px-2 leading-relaxed h-20">
                    {breathPattern === 'box' 
                      ? "Best for regaining focus and centering your mind when feeling scattered." 
                      : "A natural tranquilizer for the nervous system, excellent for reducing severe anxiety or preparing for sleep."}
                  </div>

                  <Button 
                    onClick={() => setIsBreathing(!isBreathing)} 
                    variant={isBreathing ? "secondary" : "sage"}
                    className="w-full py-4 text-lg font-bold shadow-md"
                  >
                    {isBreathing ? "Stop Exercise" : "Begin Breathing"}
                  </Button>
                </div>
              </div>
              
              <div className="mt-12 pt-6 border-t border-stone-100 flex justify-center">
                <Link to="/modules">
                  <Button variant="sage" className="flex items-center gap-2 px-8">
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

export default DBTModule;
