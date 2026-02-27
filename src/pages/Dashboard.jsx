import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Activity, Plus, Minus, Sun, Droplets, ChevronLeft, ChevronRight, 
  Sparkles, TrendingUp, AlertCircle, RefreshCw, CheckCircle,
  Lock, Download, Crown 
} from 'lucide-react';
import { XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Area, AreaChart } from 'recharts';
import { ClinicalService } from '../lib/supabaseService';
import { PDFService } from '../lib/pdfService'; 

const Dashboard = ({ session }) => {
  const navigate = useNavigate();
  const user = session?.user;
  const getTodayStr = () => new Date().toLocaleDateString('en-CA'); 

  // --- 1. STABLE PREMIUM GATING ---
  const { isPremium, hasAIInsights, hasPDFReports } = useMemo(() => {
    const tier = user?.clinical_tier || user?.user_metadata?.clinical_tier;
    const premiumBool = user?.is_premium || user?.user_metadata?.is_premium;
    // Strictly forced boolean to prevent Hook size errors in React
    const premium = !!(tier === 'premium' || premiumBool === true); 
    return { isPremium: premium, hasAIInsights: premium, hasPDFReports: premium };
  }, [user]);

  const [selectedDate, setSelectedDate] = useState(getTodayStr());
  const [wellness, setWellness] = useState({ hydration: 0, goalCompleted: false, moodToday: null, isSyncing: false });
  const [moodHistory, setMoodHistory] = useState([]); 
  const [analytics, setAnalytics] = useState({ chatInteractions: 0, journal: 0 });
  const [symptoms, setSymptoms] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [isPatternsLoading, setIsPatternsLoading] = useState(false); // New state for AI card
  const [showChart, setShowChart] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [pdfError, setPdfError] = useState(null);

  const clinicalTrend = useMemo(() => {
    const valid = moodHistory.filter(v => v > 0);
    if (valid.length < 2) return { label: "Establishing Baseline", color: "text-stone-400" };
    const avg = valid.reduce((a, b) => a + b, 0) / valid.length;
    const latest = valid[valid.length - 1];
    if (latest > avg) return { label: "Trending Upward", color: "text-emerald-500", icon: Sparkles };
    if (latest < avg) return { label: "Extra Care Needed", color: "text-amber-500", icon: AlertCircle };
    return { label: "Emotional Stability", color: "text-blue-500", icon: TrendingUp };
  }, [moodHistory]);

  // --- 2. DATA SYNC LOGIC ---
  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user) return;
      setLoading(true);
      setShowChart(false);
      setSymptoms([]); 
      setIsPatternsLoading(isPremium); // Only show loading if they can actually see insights

      try {
        const [dailyStats, history, stats] = await Promise.all([
          ClinicalService.getDailyWellness(user.id, selectedDate),
          ClinicalService.getWellnessHistory(user.id, 7),
          ClinicalService.getDashboardAnalytics(user.id)
        ]);

        setWellness({
          hydration: dailyStats?.hydration_count || 0,
          goalCompleted: dailyStats?.goal_completed || false,
          moodToday: dailyStats?.mood_rating || null,
          isSyncing: false
        });

        setMoodHistory(history.map(h => h.mood_rating || 0));
        setAnalytics(stats);

        // Fetch patterns separately to update the UI faster
        if (isPremium) {
           const patterns = await ClinicalService.analyzeUserPatterns(user.id, selectedDate);
           setSymptoms(patterns);
        }
      } catch (err) {
        console.error("Dashboard Sync Error:", err);
      } finally {
        setLoading(false);
        setIsPatternsLoading(false);
        setTimeout(() => setShowChart(true), 400); // Wait for DOM to stabilize
      }
    };
    loadDashboardData();
  }, [selectedDate, user, isPremium]);

  const updateWellnessMetric = async (updates) => {
    if (!user) return;
    setWellness(prev => ({ ...prev, ...updates, isSyncing: true }));
    try {
      await ClinicalService.updateDailyWellness(user.id, selectedDate, {
        hydration_count: updates.hydration ?? wellness.hydration,
        goal_completed: updates.goalCompleted ?? wellness.goalCompleted,
        mood_rating: updates.moodToday ?? wellness.moodToday
      });
      if (updates.moodToday) {
        const freshHistory = await ClinicalService.getWellnessHistory(user.id, 7);
        setMoodHistory(freshHistory.map(h => h.mood_rating || 0));
      }
    } finally {
      setWellness(prev => ({ ...prev, isSyncing: false }));
    }
  };

  const handleDownloadPDF = async () => {
    if (!hasPDFReports) { navigate('/pricing'); return; }
    setPdfError(null);
    try {
      setIsGeneratingPDF(true);
      const userName = user?.user_metadata?.full_name || "Valued Member";
      await PDFService.generateClinicalReport(user.id, userName); 
    } catch (err) {
      setPdfError(err.message || "Failed to generate report.");
      setTimeout(() => setPdfError(null), 6000);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const chartData = useMemo(() => {
    if (!moodHistory.length) return [];
    return moodHistory.map((val, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (moodHistory.length - 1 - i));
      return { name: d.toLocaleDateString('en-US', { weekday: 'short' }), mood: val > 0 ? val : null };
    });
  }, [moodHistory]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-fade-in pb-24 transition-colors duration-500">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-stone-200 dark:border-zinc-800 pb-8">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <p className="text-stone-500 dark:text-zinc-400 font-medium text-sm">Sanctuary Analytics</p>
            {isPremium && (
              <span className="flex items-center gap-1.5 px-3 py-1 text-[10px] bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full font-black uppercase tracking-widest shadow-sm">
                <Crown className="w-3 h-3" /> SoulSpark Pro
              </span>
            )}
            {(wellness.isSyncing || loading) && (
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }}>
                <RefreshCw className="w-3 h-3 text-emerald-500" />
              </motion.div>
            )}
          </div>
          <h1 className="text-4xl sm:text-5xl font-serif text-stone-900 dark:text-zinc-100">
            How is your <span className="italic text-emerald-600 font-medium">Soul</span> {selectedDate === getTodayStr() ? "today" : "then"}?
          </h1>
        </div>

        <div className="flex items-center gap-3 bg-white dark:bg-zinc-900 p-1.5 rounded-2xl shadow-sm border border-stone-200 dark:border-zinc-800">
           <button onClick={() => {
              const d = new Date(selectedDate);
              d.setDate(d.getDate() - 1);
              setSelectedDate(d.toLocaleDateString('en-CA'));
           }} className="p-2 hover:bg-stone-50 dark:hover:bg-zinc-800 rounded-xl transition-all">
             <ChevronLeft className="w-5 h-5 text-stone-400" />
           </button>
           <span className="font-bold text-stone-700 dark:text-zinc-200 px-2 min-w-[100px] text-center uppercase tracking-tighter text-sm">
             {selectedDate === getTodayStr() ? "Today" : selectedDate}
           </span>
           <button 
             disabled={selectedDate === getTodayStr()}
             onClick={() => {
              const d = new Date(selectedDate);
              d.setDate(d.getDate() + 1);
              setSelectedDate(d.toLocaleDateString('en-CA'));
           }} className="p-2 hover:bg-stone-50 dark:hover:bg-zinc-800 rounded-xl transition-all disabled:opacity-20">
             <ChevronRight className="w-5 h-5 text-stone-400" />
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {/* MOOD */}
             <div className="p-8 rounded-[2.5rem] bg-white dark:bg-zinc-900 border border-stone-100 dark:border-zinc-800 shadow-sm transition-all hover:shadow-md">
                <h3 className="text-lg font-bold text-stone-800 dark:text-zinc-200 mb-6 flex items-center gap-2">
                  <Sun className="w-5 h-5 text-amber-400" /> Current Mood
                </h3>
                <div className="flex justify-between items-center bg-stone-50 dark:bg-zinc-950 p-4 rounded-3xl">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      onClick={() => updateWellnessMetric({ moodToday: rating })}
                      className={`w-12 h-12 rounded-full font-black transition-all duration-500 ${
                        wellness.moodToday === rating 
                        ? 'bg-emerald-500 text-white shadow-lg scale-110' 
                        : 'text-stone-400 hover:text-stone-600'
                      }`}
                    >
                      {rating}
                    </button>
                  ))}
                </div>
             </div>

             {/* HYDRATION */}
             <div className="p-8 rounded-[2.5rem] bg-white dark:bg-zinc-900 border border-stone-100 dark:border-zinc-800 shadow-sm flex items-center justify-between transition-all hover:shadow-md">
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-stone-800 dark:text-zinc-200 flex items-center gap-2">
                    <Droplets className="w-5 h-5 text-cyan-400" /> Hydration
                  </h3>
                  <p className="text-sm text-stone-400 italic">Target: 8 glasses</p>
                </div>
                <div className="flex items-center gap-4 bg-stone-50 dark:bg-zinc-950 p-2 rounded-2xl border border-stone-100 dark:border-zinc-800">
                  <button onClick={() => updateWellnessMetric({ hydration: Math.max(0, wellness.hydration - 1) })} className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-800 shadow-sm flex items-center justify-center"><Minus className="w-4 h-4" /></button>
                  <span className="text-2xl font-black text-stone-800 dark:text-zinc-100 w-8 text-center">{wellness.hydration}</span>
                  <button onClick={() => updateWellnessMetric({ hydration: wellness.hydration + 1 })} className="w-10 h-10 rounded-xl bg-cyan-500 text-white shadow-sm flex items-center justify-center"><Plus className="w-4 h-4" /></button>
                </div>
             </div>
          </div>

          {/* CHART */}
          <div className="p-8 rounded-[3rem] bg-white dark:bg-zinc-900 border border-stone-100 dark:border-zinc-800 shadow-sm relative overflow-hidden transition-colors">
            <h3 className="text-2xl font-serif text-stone-900 dark:text-zinc-100 mb-1">Wellness Trend</h3>
            <div className={`flex items-center gap-2 font-bold text-sm ${clinicalTrend.color} mb-6`}>
              {clinicalTrend.icon && <clinicalTrend.icon className="w-4 h-4" />}
              {clinicalTrend.label}
            </div>

            {/* --- FIXED: MEASURED CONTAINER --- */}
            <div className="w-full mt-4 h-[350px] min-h-[350px] relative">
              {showChart && !loading && chartData.some(d => d.mood !== null) ? (
                <ResponsiveContainer width="99%" height="100%" debounce={50}>
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorMood" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" strokeOpacity={0.05} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#a1a1aa', fontSize: 12}} dy={15} />
                    <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} axisLine={false} tickLine={false} tick={{fill: '#a1a1aa', fontSize: 12}} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '20px', border: 'none', backgroundColor: '#18181b', color: '#fff' }}
                      itemStyle={{ color: '#10b981', fontWeight: 'bold' }}
                    />
                    <Area type="monotone" dataKey="mood" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorMood)" connectNulls animationDuration={1500} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center border-2 border-dashed border-stone-100 dark:border-zinc-800 rounded-[2rem] text-stone-400 space-y-2 italic">
                  {!showChart ? <RefreshCw className="w-6 h-6 animate-spin opacity-20" /> : <Activity className="w-8 h-8 opacity-20" />}
                  <p>{!showChart ? "Generating visuals..." : "Log mood history to view your trend."}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* SIDEBAR */}
        <div className="lg:col-span-4 space-y-6">
          <motion.div 
            whileTap={{ scale: 0.98 }} 
            onClick={() => updateWellnessMetric({ goalCompleted: !wellness.goalCompleted })} 
            className={`p-8 rounded-[2.5rem] cursor-pointer border-2 transition-all duration-500 ${
              wellness.goalCompleted 
              ? 'bg-emerald-500 border-emerald-500 text-white shadow-xl shadow-emerald-500/20' 
              : 'bg-white dark:bg-zinc-900 border-stone-100 dark:border-zinc-800 hover:border-emerald-200'
            }`}
          >
            <div className="flex flex-col items-center text-center space-y-4">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center ${wellness.goalCompleted ? 'bg-white/20' : 'bg-emerald-100 text-emerald-600'}`}>
                <CheckCircle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-serif">Daily Intention</h3>
            </div>
          </motion.div>

          {/* AI INSIGHTS CARD */}
          <div className="p-8 rounded-[2.5rem] bg-zinc-900 text-white shadow-2xl relative overflow-hidden border border-white/5 min-h-[300px]">
             {!hasAIInsights && (
               <div className="absolute inset-0 z-30 backdrop-blur-md bg-black/40 flex flex-col items-center justify-center p-6 text-center animate-fade-in">
                 <Lock className="w-8 h-8 text-emerald-400 mb-3" />
                 <p className="text-sm font-bold text-white mb-4">Unlock AI Clinical Patterns with Pro</p>
                 <button onClick={() => navigate('/pricing')} className="bg-emerald-600 hover:bg-emerald-700 px-6 py-2 rounded-xl text-xs font-black transition-all">Upgrade Now</button>
               </div>
             )}
             <div className="absolute top-0 right-0 p-4 opacity-5"><Sparkles className="w-20 h-20" /></div>
             <h3 className="text-xl font-serif mb-6 flex items-center gap-2">
               <AlertCircle className="w-5 h-5 text-rose-400" /> AI Insights
             </h3>
             <div className="space-y-3 relative z-10">
               {isPatternsLoading ? (
                  <div className="space-y-3 animate-pulse">
                    <div className="h-10 bg-white/5 rounded-2xl w-full" />
                    <div className="h-10 bg-white/5 rounded-2xl w-4/5" />
                  </div>
               ) : symptoms.length > 0 ? symptoms.map((s, i) => (
                 <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} key={i} className="bg-white/5 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/5 text-sm font-medium text-stone-200">
                   {s}
                 </motion.div>
               )) : <p className="text-stone-500 italic text-sm text-center py-4">No patterns captured for this date.</p>}
             </div>
          </div>

          {/* ANALYTICS & PDF */}
          <div className="bg-emerald-50 dark:bg-emerald-950/20 p-8 rounded-[2.5rem] border border-emerald-100 dark:border-emerald-900/30 space-y-6 flex flex-col justify-between">
            <div>
              <h4 className="text-xs font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-400 mb-4">Journey Analytics</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white dark:bg-zinc-900 p-4 rounded-3xl shadow-sm border border-emerald-100/50 text-center">
                  <span className="text-2xl font-black text-stone-900 dark:text-zinc-100 block">{analytics.chatInteractions}</span>
                  <span className="text-[10px] text-stone-400 uppercase font-bold">Sessions</span>
                </div>
                <div className="bg-white dark:bg-zinc-900 p-4 rounded-3xl shadow-sm border border-emerald-100/50 text-center">
                  <span className="text-2xl font-black text-stone-900 dark:text-zinc-100 block">{analytics.journal}</span>
                  <span className="text-[10px] text-stone-400 uppercase font-bold">Entries</span>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <AnimatePresence>
                {pdfError && (
                  <motion.div initial={{ opacity: 0, height: 0, y: 10 }} animate={{ opacity: 1, height: 'auto', y: 0 }} exit={{ opacity: 0, height: 0, y: -10 }} className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 p-3 rounded-xl text-xs font-medium mb-4 flex items-start gap-2 overflow-hidden">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <p>{pdfError}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <button onClick={handleDownloadPDF} disabled={isGeneratingPDF} className={`w-full py-4 rounded-2xl flex items-center justify-center gap-3 font-bold transition-all ${hasPDFReports ? 'bg-white dark:bg-zinc-800 text-emerald-600 border border-emerald-200 hover:shadow-lg scale-[1.02]' : 'bg-stone-200/50 dark:bg-zinc-900 text-stone-400 border border-stone-200 dark:border-zinc-800'}`}>
                {isGeneratingPDF ? <RefreshCw className="w-5 h-5 animate-spin" /> : hasPDFReports ? <Download className="w-5 h-5" /> : <Lock className="w-4 h-4 opacity-50" />}
                <span className="text-sm">{isGeneratingPDF ? "Analyzing..." : "Clinical PDF Report"}</span>
                {!hasPDFReports && <Crown className="w-3.5 h-3.5 text-amber-500/60" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;