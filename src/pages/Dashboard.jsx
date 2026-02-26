import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Activity, CheckCircle, Plus, Minus, Sun, Droplets, 
  Download, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Sparkles,
  Brain, Users, Leaf, MessageSquare, BookOpen, BarChart3, TrendingUp, AlertCircle
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid 
} from 'recharts';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import { supabase } from '../lib/supabaseClient';
import { ClinicalService } from '../lib/supabaseService';

const Dashboard = () => {
  const getTodayStr = () => new Date().toLocaleDateString('en-CA'); 
  
  // --- STATE ---
  const [selectedDate, setSelectedDate] = useState(getTodayStr());
  const [hydration, setHydration] = useState(0);
  const [goalChecked, setGoalChecked] = useState(false);
  const [moodToday, setMoodToday] = useState(null);
  const [moodHistory, setMoodHistory] = useState([0,0,0,0,0,0,0]); 
  
  const [analytics, setAnalytics] = useState({ cbt: 0, dbt: 0, act: 0, chatInteractions: 0, journal: 0 });
  const [symptoms, setSymptoms] = useState(["Analyzing..."]); // New State for Symptoms
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');

  // --- INITIAL LOAD ---
  useEffect(() => {
    loadDataForDate(selectedDate);
    fetchUserProfile();
  }, [selectedDate]);

  const fetchUserProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const name = user.user_metadata?.full_name?.split(' ')[0] || 'there';
      setUserName(name);
      
      // Load long-term analytics
      const stats = await ClinicalService.getDashboardAnalytics(user.id);
      setAnalytics(stats);

      // Load AI Symptom Detection
      const detectedSymptoms = await ClinicalService.analyzeUserPatterns(user.id);
      setSymptoms(detectedSymptoms);
    }
  };

  const loadDataForDate = async (dateStr) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const dailyStats = await ClinicalService.getDailyWellness(user.id, dateStr);
      setHydration(dailyStats.hydration_count || 0);
      setGoalChecked(dailyStats.goal_completed || false);
      setMoodToday(dailyStats.mood_rating || null);

      const history = await ClinicalService.getWellnessHistory(user.id, 7);
      const ratings = history.map(h => h.mood_rating || 0);
      const paddedRatings = [...Array(Math.max(0, 7 - ratings.length)).fill(0), ...ratings];
      setMoodHistory(paddedRatings.slice(-7));

    } catch (err) {
      console.error("Load Error:", err);
    } finally {
      setLoading(false);
    }
  };

  // --- HANDLERS ---
  const handleExport = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const result = await ClinicalService.exportUserData(user.id);
      if (result.success) {
        const blob = new Blob([result.data], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `soulspark_wellness_log_${new Date().toISOString().slice(0,10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        alert(`Export skipped: ${result.error}`);
      }
    } catch (error) {
      console.error("Export Error:", error);
    }
  };

  const handleMoodSelect = async (rating) => {
    setMoodToday(rating);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await ClinicalService.updateDailyWellness(user.id, selectedDate, { mood_rating: rating });
      loadDataForDate(selectedDate); 
    }
  };

  const toggleGoal = async () => {
    const newStatus = !goalChecked;
    setGoalChecked(newStatus);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await ClinicalService.updateDailyWellness(user.id, selectedDate, { goal_completed: newStatus });
    }
  };

  const updateWater = async (change) => {
    const newCount = Math.max(0, hydration + change);
    setHydration(newCount);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await ClinicalService.updateDailyWellness(user.id, selectedDate, { hydration_count: newCount });
    }
  };

  const changeDate = (days) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toLocaleDateString('en-CA'));
  };

  const isToday = selectedDate === getTodayStr();
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };
  const formatDateDisplay = (dateStr) => new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const getMoodColor = (rating) => {
    if (!rating || rating === 0) return 'bg-stone-50 text-stone-400 hover:bg-stone-100';
    if (rating >= 4) return 'bg-emerald-400 text-white shadow-md ring-4 ring-stone-50';
    if (rating === 3) return 'bg-amber-400 text-white shadow-md ring-4 ring-stone-50';
    return 'bg-indigo-400 text-white shadow-md ring-4 ring-stone-50';
  };

  const maxModule = Math.max(analytics.cbt, analytics.dbt, analytics.act, 1);

  // --- HAALAT CHART DATA FORMATTING ---
  const chartData = moodHistory.map((val, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return {
      name: d.toLocaleDateString('en-US', { weekday: 'short' }),
      mood: val > 0 ? val : null 
    };
  });

  const validPoints = moodHistory.filter(v => v > 0);
  const averageMood = validPoints.length > 0 
    ? (validPoints.reduce((a, b) => a + b, 0) / validPoints.length).toFixed(1) 
    : '-';

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8 animate-fade-in pb-20">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-stone-200 pb-6">
        <div className="space-y-2">
          <p className="text-stone-500 font-medium flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" /> {getGreeting()}, {userName}
          </p>
          <h1 className="text-3xl md:text-4xl font-serif text-stone-800 tracking-tight">Your Wellness Space</h1>
          
          <div className="flex items-center gap-1 mt-4 bg-white p-1 rounded-2xl shadow-sm border border-stone-200 w-fit">
            <button onClick={() => changeDate(-1)} className="p-2 hover:bg-stone-100 rounded-xl transition-colors">
              <ChevronLeft className="w-4 h-4 text-stone-600" />
            </button>
            <div className="relative flex items-center gap-2 px-3 py-1 font-medium text-stone-700">
              <CalendarIcon className="w-4 h-4 text-emerald-600" />
              <span>{isToday ? 'Today' : formatDateDisplay(selectedDate)}</span>
              <input type="date" value={selectedDate} max={getTodayStr()} onChange={(e) => setSelectedDate(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
            </div>
            <button onClick={() => changeDate(1)} disabled={isToday} className={`p-2 rounded-xl transition-colors ${isToday ? 'opacity-30 cursor-not-allowed' : 'hover:bg-stone-100'}`}>
              <ChevronRight className="w-4 h-4 text-stone-600" />
            </button>
          </div>
        </div>

        <Button onClick={handleExport} variant="outline" className="flex items-center gap-2 text-stone-600 bg-white shadow-sm hover:bg-stone-50 rounded-xl px-4 py-2 border-stone-200">
          <Download className="w-4 h-4" /> Export Data
        </Button>
      </div>

      <div className={`transition-opacity duration-300 ${loading ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
        
        {/* ROW 1: DAILY TRACKERS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card className="p-6 rounded-3xl border-0 shadow-sm bg-white hover:shadow-md transition-shadow">
            <h3 className="text-lg font-semibold flex items-center gap-2 text-stone-800 mb-6">
              <Sun className="w-5 h-5 text-amber-500" /> Daily Mood
            </h3>
            <div className="flex justify-between gap-2">
              {[1, 2, 3, 4, 5].map((rating) => (
                <motion.button key={rating} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => handleMoodSelect(rating)}
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold transition-all duration-300 ${getMoodColor(moodToday === rating ? rating : 0)}`}
                >
                  {rating}
                </motion.button>
              ))}
            </div>
          </Card>

          <Card className="p-6 rounded-3xl border-0 shadow-sm bg-white hover:shadow-md transition-shadow flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2 text-stone-800 mb-1">
                <Droplets className="w-5 h-5 text-cyan-500" /> Hydration
              </h3>
              <p className="text-sm text-stone-400">Glasses today</p>
            </div>
            <div className="flex items-center gap-4 bg-stone-50 p-2 rounded-2xl border border-stone-100">
              <button onClick={() => updateWater(-1)} className="w-10 h-10 rounded-xl bg-white text-stone-500 hover:text-stone-800 shadow-sm flex items-center justify-center transition-colors"><Minus className="w-5 h-5" /></button>
              <span className="text-2xl font-bold text-cyan-600 w-6 text-center">{hydration}</span>
              <button onClick={() => updateWater(1)} className="w-10 h-10 rounded-xl bg-cyan-500 text-white shadow-sm hover:bg-cyan-600 flex items-center justify-center transition-colors"><Plus className="w-5 h-5" /></button>
            </div>
          </Card>

          <Card className="p-6 rounded-3xl border-0 shadow-sm bg-white hover:shadow-md transition-shadow flex flex-col justify-center">
            <h3 className="text-lg font-semibold flex items-center gap-2 text-stone-800 mb-4">
              <Activity className="w-5 h-5 text-emerald-500" /> Daily Focus
            </h3>
            <motion.div whileTap={{ scale: 0.98 }} onClick={toggleGoal} className={`cursor-pointer border-2 rounded-2xl p-4 flex items-center gap-4 transition-all duration-300 ${goalChecked ? 'border-emerald-500 bg-emerald-50 shadow-inner' : 'border-stone-200 hover:bg-stone-50'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-300 ${goalChecked ? 'bg-emerald-500 text-white' : 'bg-stone-100 text-stone-300'}`}>
                <CheckCircle className={`w-5 h-5 ${goalChecked ? 'opacity-100' : 'opacity-50'}`} />
              </div>
              <span className={`font-semibold ${goalChecked ? 'text-emerald-800' : 'text-stone-600'}`}>{goalChecked ? 'Goal Achieved!' : 'Mark as Done'}</span>
            </motion.div>
          </Card>
        </div>

        {/* ROW 2: HAALAT (WELLBEING TREND) & AI SYMPTOMS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <Card className="lg:col-span-2 p-8 rounded-3xl border-0 shadow-sm bg-white hover:shadow-md transition-shadow relative overflow-hidden">
            <div className="flex justify-between items-end mb-6">
              <div>
                <h3 className="text-xl font-serif text-stone-900 mb-1 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-500" /> Haalat (Wellbeing Trend)
                </h3>
                <p className="text-stone-500 text-sm">Your emotional state over the last 7 days.</p>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-stone-400 uppercase tracking-widest">7-Day Avg</span>
                <p className="text-2xl font-serif text-blue-600">
                  {averageMood} <span className="text-sm text-stone-400">/5</span>
                </p>
              </div>
            </div>

            <div style={{ width: '100%', height: 250, minHeight: 250 }} className="mt-4">
              {validPoints.length === 0 ? (
                <div className="w-full h-full flex items-center justify-center bg-stone-50 rounded-2xl border-2 border-dashed border-stone-200">
                  <p className="text-stone-400 text-sm font-medium">Log your mood to see your trend here.</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f4" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#a8a29e', fontSize: 12, fontWeight: 500 }} dy={10} />
                    <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} axisLine={false} tickLine={false} tick={{ fill: '#a8a29e', fontSize: 12, fontWeight: 500 }} />
                    <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} itemStyle={{ color: '#3b82f6', fontWeight: 'bold' }} />
                    <Line type="monotone" dataKey="mood" name="Mood Rating" stroke="#3b82f6" strokeWidth={4} dot={{ fill: '#fff', stroke: '#3b82f6', strokeWidth: 3, r: 5 }} activeDot={{ r: 8, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }} connectNulls />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>

          {/* AI Symptom Detection Card */}
          <Card className="p-6 rounded-3xl border-0 shadow-sm bg-white hover:shadow-md transition-shadow flex flex-col">
            <h3 className="text-lg font-serif text-stone-900 mb-1 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-500" /> Clinical Patterns
            </h3>
            <p className="text-stone-500 text-sm mb-6">AI analysis of your recent journal entries and interactions.</p>
            
            <div className="flex flex-wrap gap-2 mt-auto">
              {symptoms.map((sym, i) => (
                <span key={i} className="px-3 py-1.5 bg-rose-50 text-rose-700 rounded-xl text-sm font-medium border border-rose-100 shadow-sm">
                  {sym}
                </span>
              ))}
            </div>
          </Card>
        </div>

        {/* ROW 3: JOURNEY ANALYTICS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-8 rounded-3xl border-0 shadow-sm bg-white relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
              <BarChart3 className="w-32 h-32 text-emerald-900" />
            </div>
            <h3 className="text-xl font-serif text-stone-900 mb-1 relative z-10">Therapeutic Progress</h3>
            <p className="text-stone-500 text-sm mb-8 relative z-10">Modules and exercises completed over time.</p>
            
            <div className="space-y-6 relative z-10">
              <div>
                <div className="flex justify-between items-end mb-2">
                  <span className="text-sm font-bold text-blue-800 flex items-center gap-2"><Brain className="w-4 h-4"/> CBT</span>
                  <span className="text-xs font-medium text-stone-500">{analytics.cbt} completed</span>
                </div>
                <div className="h-3 w-full bg-blue-50 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${(analytics.cbt / maxModule) * 100}%` }} transition={{ duration: 1, ease: "easeOut" }} className="h-full bg-blue-500 rounded-full" />
                </div>
              </div>
              <div>
                <div className="flex justify-between items-end mb-2">
                  <span className="text-sm font-bold text-purple-800 flex items-center gap-2"><Users className="w-4 h-4"/> DBT</span>
                  <span className="text-xs font-medium text-stone-500">{analytics.dbt} completed</span>
                </div>
                <div className="h-3 w-full bg-purple-50 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${(analytics.dbt / maxModule) * 100}%` }} transition={{ duration: 1, delay: 0.2, ease: "easeOut" }} className="h-full bg-purple-500 rounded-full" />
                </div>
              </div>
              <div>
                <div className="flex justify-between items-end mb-2">
                  <span className="text-sm font-bold text-emerald-800 flex items-center gap-2"><Leaf className="w-4 h-4"/> ACT</span>
                  <span className="text-xs font-medium text-stone-500">{analytics.act} completed</span>
                </div>
                <div className="h-3 w-full bg-emerald-50 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${(analytics.act / maxModule) * 100}%` }} transition={{ duration: 1, delay: 0.4, ease: "easeOut" }} className="h-full bg-emerald-500 rounded-full" />
                </div>
              </div>
            </div>
          </Card>

          <div className="grid grid-rows-2 gap-6">
            <Card className="p-6 rounded-3xl border-0 shadow-sm bg-gradient-to-br from-stone-800 to-stone-900 text-white flex items-center justify-between">
              <div>
                <p className="text-stone-400 text-sm font-medium mb-1 uppercase tracking-widest">Journal Entries</p>
                <h3 className="text-4xl font-serif">{analytics.journal}</h3>
                <p className="text-stone-400 text-xs mt-2">Reflections captured</p>
              </div>
              <div className="w-16 h-16 rounded-2xl bg-stone-700/50 flex items-center justify-center border border-stone-600">
                <BookOpen className="w-8 h-8 text-stone-300" />
              </div>
            </Card>

            <Card className="p-6 rounded-3xl border-0 shadow-sm bg-gradient-to-br from-teal-50 to-teal-100 flex items-center justify-between border-teal-200">
              <div>
                <p className="text-teal-700 text-sm font-medium mb-1 uppercase tracking-widest">SoulSpark AI</p>
                <h3 className="text-4xl font-serif text-teal-900">{analytics.chatInteractions}</h3>
                <p className="text-teal-600 text-xs mt-2">Therapy chat interactions</p>
              </div>
              <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center shadow-sm border border-teal-200">
                <MessageSquare className="w-8 h-8 text-teal-600" />
              </div>
            </Card>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;