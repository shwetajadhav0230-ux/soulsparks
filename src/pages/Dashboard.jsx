import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Activity, CheckCircle, Plus, Minus, Sun, Droplets, 
  Download, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Sparkles,
  Brain, Users, Leaf, MessageSquare, BookOpen, BarChart3
} from 'lucide-react';
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
  
  // New Analytics State
  const [analytics, setAnalytics] = useState({ cbt: 0, dbt: 0, act: 0, chatInteractions: 0, journal: 0 });
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
  const getMoodColor = (rating, isChart = false) => {
    if (!rating || rating === 0) return isChart ? 'bg-stone-100' : 'bg-stone-100 text-stone-400';
    if (rating >= 4) return 'bg-emerald-400 text-white';
    if (rating === 3) return 'bg-amber-400 text-white';
    return 'bg-indigo-400 text-white';
  };

  // Calculate max value for module charts
  const maxModule = Math.max(analytics.cbt, analytics.dbt, analytics.act, 1);

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
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-stone-800">
                <Sun className="w-5 h-5 text-amber-500" /> Daily Mood
              </h3>
            </div>
            <div className="flex justify-between gap-2">
              {[1, 2, 3, 4, 5].map((rating) => (
                <motion.button key={rating} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => handleMoodSelect(rating)}
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold transition-all duration-300 shadow-sm
                    ${moodToday === rating ? `${getMoodColor(rating)} shadow-md ring-4 ring-stone-50` : 'bg-stone-50 text-stone-400 hover:bg-stone-100'}`}
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
              <button onClick={() => updateWater(-1)} className="w-10 h-10 rounded-xl bg-white text-stone-500 hover:text-stone-800 shadow-sm flex items-center justify-center transition-colors">
                <Minus className="w-5 h-5" />
              </button>
              <span className="text-2xl font-bold text-cyan-600 w-6 text-center">{hydration}</span>
              <button onClick={() => updateWater(1)} className="w-10 h-10 rounded-xl bg-cyan-500 text-white shadow-sm hover:bg-cyan-600 flex items-center justify-center transition-colors">
                <Plus className="w-5 h-5" />
              </button>
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
              <span className={`font-semibold ${goalChecked ? 'text-emerald-800' : 'text-stone-600'}`}>
                {goalChecked ? 'Goal Achieved!' : 'Mark as Done'}
              </span>
            </motion.div>
          </Card>
        </div>

        {/* ROW 2: JOURNEY ANALYTICS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Module Engagement Chart */}
          <Card className="p-8 rounded-3xl border-0 shadow-sm bg-white relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
              <BarChart3 className="w-32 h-32 text-emerald-900" />
            </div>
            <h3 className="text-xl font-serif text-stone-900 mb-1 relative z-10">Therapeutic Progress</h3>
            <p className="text-stone-500 text-sm mb-8 relative z-10">Modules and exercises completed over time.</p>
            
            <div className="space-y-6 relative z-10">
              {/* CBT */}
              <div>
                <div className="flex justify-between items-end mb-2">
                  <span className="text-sm font-bold text-blue-800 flex items-center gap-2"><Brain className="w-4 h-4"/> CBT</span>
                  <span className="text-xs font-medium text-stone-500">{analytics.cbt} completed</span>
                </div>
                <div className="h-3 w-full bg-blue-50 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${(analytics.cbt / maxModule) * 100}%` }} transition={{ duration: 1, ease: "easeOut" }} className="h-full bg-blue-500 rounded-full" />
                </div>
              </div>
              
              {/* DBT */}
              <div>
                <div className="flex justify-between items-end mb-2">
                  <span className="text-sm font-bold text-purple-800 flex items-center gap-2"><Users className="w-4 h-4"/> DBT</span>
                  <span className="text-xs font-medium text-stone-500">{analytics.dbt} completed</span>
                </div>
                <div className="h-3 w-full bg-purple-50 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${(analytics.dbt / maxModule) * 100}%` }} transition={{ duration: 1, delay: 0.2, ease: "easeOut" }} className="h-full bg-purple-500 rounded-full" />
                </div>
              </div>

              {/* ACT */}
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

          {/* Interaction & Expression Stats */}
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