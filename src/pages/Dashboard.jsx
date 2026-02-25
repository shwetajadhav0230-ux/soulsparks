import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, CheckCircle, Plus, Minus, Sun, Droplets, 
  Download, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Sparkles
} from 'lucide-react';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import { ClinicalService, supabase } from '../lib/supabaseService';

const Dashboard = () => {
  // --- STATE ---
  const getTodayStr = () => new Date().toLocaleDateString('en-CA'); 
  
  const [selectedDate, setSelectedDate] = useState(getTodayStr());
  const [hydration, setHydration] = useState(0);
  const [goalChecked, setGoalChecked] = useState(false);
  const [moodToday, setMoodToday] = useState(null);
  const [moodHistory, setMoodHistory] = useState([0,0,0,0,0,0,0]); 
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');

  // --- INITIAL LOAD & DATE CHANGE EFFECT ---
  useEffect(() => {
    loadDataForDate(selectedDate);
    fetchUserProfile();
  }, [selectedDate]);

  const fetchUserProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // Get the first name from metadata if it exists, or default to "there"
      const name = user.user_metadata?.full_name?.split(' ')[0] || 'there';
      setUserName(name);
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
        // Create and trigger download
        const blob = new Blob([result.data], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `soulspark_wellness_log_${new Date().toISOString().slice(0,10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        // Alert the user if there is no data or an error occurred
        alert(`Export skipped: ${result.error}`);
        console.warn("Export skipped:", result.error);
      }
    } catch (error) {
      console.error("Export Handler Error:", error);
      alert("An unexpected error occurred during export.");
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

  // --- UI HELPERS ---
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

  const formatDateDisplay = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const getMoodColor = (rating, isChart = false) => {
    if (!rating || rating === 0) return isChart ? 'bg-stone-100' : 'bg-stone-100 text-stone-400';
    if (rating >= 4) return 'bg-emerald-400 text-white';
    if (rating === 3) return 'bg-amber-400 text-white';
    return 'bg-indigo-400 text-white';
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8 animate-fade-in">
      
      {/* --- HEADER SECTION --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-stone-200 pb-6">
        <div className="space-y-2">
          <p className="text-stone-500 font-medium flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" /> 
            {getGreeting()}, {userName}
          </p>
          <h1 className="text-3xl md:text-4xl font-serif text-stone-800 tracking-tight">Your Wellness Space</h1>
          
          {/* Refined Date Controller */}
          <div className="flex items-center gap-1 mt-4 bg-white p-1 rounded-2xl shadow-sm border border-stone-200 w-fit">
            <button onClick={() => changeDate(-1)} className="p-2 hover:bg-stone-100 rounded-xl transition-colors">
              <ChevronLeft className="w-4 h-4 text-stone-600" />
            </button>
            
            <div className="relative flex items-center gap-2 px-3 py-1 font-medium text-stone-700">
              <CalendarIcon className="w-4 h-4 text-emerald-600" />
              <span>{isToday ? 'Today' : formatDateDisplay(selectedDate)}</span>
              {/* Invisible native date picker placed over the text for mobile/click support */}
              <input 
                type="date" 
                value={selectedDate}
                max={getTodayStr()}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
            </div>

            <button 
              onClick={() => changeDate(1)} 
              disabled={isToday}
              className={`p-2 rounded-xl transition-colors ${isToday ? 'opacity-30 cursor-not-allowed' : 'hover:bg-stone-100'}`}
            >
              <ChevronRight className="w-4 h-4 text-stone-600" />
            </button>
          </div>
        </div>

        <Button 
          onClick={handleExport}
          variant="outline" 
          className="flex items-center gap-2 text-stone-600 bg-white shadow-sm hover:bg-stone-50 rounded-xl px-4 py-2 border-stone-200"
        >
          <Download className="w-4 h-4" /> Export Data
        </Button>
      </div>

      {/* --- MAIN DASHBOARD GRID --- */}
      <div className={`transition-opacity duration-300 ${loading ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

          {/* 1. MOOD TRACKER */}
          <Card className="p-6 md:p-8 rounded-3xl border-0 shadow-sm bg-white hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-stone-800">
                <Sun className="w-5 h-5 text-amber-500" /> Daily Mood
              </h3>
              {moodToday && <span className="text-[10px] font-bold tracking-wider text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md uppercase">Logged</span>}
            </div>
            
            <div className="flex justify-between gap-2">
              {[1, 2, 3, 4, 5].map((rating) => (
                <motion.button
                  key={rating}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleMoodSelect(rating)}
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold transition-all duration-300 shadow-sm
                    ${moodToday === rating 
                      ? `${getMoodColor(rating)} shadow-md ring-4 ring-stone-50` 
                      : 'bg-stone-50 text-stone-400 hover:bg-stone-100'}
                  `}
                >
                  {rating}
                </motion.button>
              ))}
            </div>
            
            <div className="mt-8 pt-6 border-t border-stone-100">
              <p className="text-xs font-medium text-stone-400 mb-3 uppercase tracking-wider">Past 7 Days</p>
              <div className="flex items-end justify-between h-14 gap-1.5">
                {moodHistory.map((val, i) => (
                  <div key={i} className="w-full bg-stone-50 rounded-t-md relative h-full flex items-end group">
                    <motion.div 
                      initial={{ height: 0 }}
                      animate={{ height: `${(val / 5) * 100}%` }}
                      className={`w-full rounded-t-md ${getMoodColor(val, true)} transition-all duration-500`}
                    />
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* 2. HYDRATION TRACKER */}
          <Card className="p-6 md:p-8 rounded-3xl border-0 shadow-sm bg-white hover:shadow-md transition-shadow flex flex-col justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2 text-stone-800">
              <Droplets className="w-5 h-5 text-cyan-500" /> Hydration
            </h3>
            
            <div className="flex flex-col items-center py-6">
              <span className="text-6xl font-bold text-cyan-600 tracking-tight">{hydration}</span>
              <span className="text-sm text-stone-400 font-medium mt-2">glasses tracked</span>
            </div>
            
            <div className="flex justify-center gap-6 mt-auto">
              <button 
                onClick={() => updateWater(-1)} 
                className="w-14 h-14 rounded-full bg-stone-50 text-stone-500 hover:bg-stone-100 flex items-center justify-center transition-colors border border-stone-200"
              >
                <Minus className="w-6 h-6" />
              </button>
              <button 
                onClick={() => updateWater(1)} 
                className="w-14 h-14 rounded-full bg-cyan-500 text-white hover:bg-cyan-600 shadow-md hover:shadow-lg hover:-translate-y-0.5 flex items-center justify-center transition-all"
              >
                <Plus className="w-6 h-6" />
              </button>
            </div>
          </Card>

          {/* 3. DAILY GOAL */}
          <Card className="p-6 md:p-8 rounded-3xl border-0 shadow-sm bg-white hover:shadow-md transition-shadow flex flex-col">
            <div className="mb-6">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-stone-800">
                <Activity className="w-5 h-5 text-emerald-500" /> Daily Focus
              </h3>
              <p className="text-stone-500 mt-2 leading-relaxed">"Complete one therapy module session"</p>
            </div>
            
            <div className="mt-auto">
              <motion.div 
                whileTap={{ scale: 0.98 }}
                onClick={toggleGoal}
                className={`cursor-pointer border-2 rounded-2xl p-5 flex items-center gap-4 transition-all duration-300
                  ${goalChecked 
                    ? 'border-emerald-500 bg-emerald-50 shadow-inner' 
                    : 'border-stone-200 hover:border-emerald-300 hover:bg-stone-50'}
                `}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-300 shadow-sm
                  ${goalChecked ? 'bg-emerald-500 text-white' : 'bg-stone-100 text-stone-300'}`}>
                  <CheckCircle className={`w-6 h-6 ${goalChecked ? 'opacity-100' : 'opacity-50'}`} />
                </div>
                <div className="flex flex-col">
                  <span className={`font-semibold text-lg ${goalChecked ? 'text-emerald-800' : 'text-stone-600'}`}>
                    {goalChecked ? 'Goal Achieved!' : 'Mark as Done'}
                  </span>
                  {goalChecked && <span className="text-xs text-emerald-600 font-medium">Great job today.</span>}
                </div>
              </motion.div>
            </div>
          </Card>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;