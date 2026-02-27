import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, Edit3, Save, Trash2, Smile, Meh, Frown, 
  AlertCircle, Clock, Loader2, Sparkles, ChevronRight, X, RefreshCw
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

const Journal = ({ session }) => {
  const [entries, setEntries] = useState([]);
  const [newEntry, setNewEntry] = useState('');
  const [mood, setMood] = useState('neutral');
  const [isWriting, setIsWriting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // --- NEW: STATE FOR VIEWING FULL ENTRY ---
  const [selectedEntry, setSelectedEntry] = useState(null);

  const user = session?.user;
  const displayName = user?.user_metadata?.full_name || "Shreya"; 

  const moods = [
    { id: 'happy', icon: Smile, label: 'Happy', color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { id: 'neutral', icon: Meh, label: 'Neutral', color: 'text-stone-400', bg: 'bg-stone-50' },
    { id: 'sad', icon: Frown, label: 'Sad', color: 'text-blue-500', bg: 'bg-blue-50' },
    { id: 'anxious', icon: AlertCircle, label: 'Anxious', color: 'text-orange-500', bg: 'bg-orange-50' }
  ];

  useEffect(() => { 
    if (user) fetchEntries(); 
    // Scroll lock when reading
    document.body.style.overflow = selectedEntry ? 'hidden' : 'unset';
  }, [user, selectedEntry]);

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setEntries(data || []);
    } catch (err) { console.error(err.message); } 
    finally { setLoading(false); }
  };

  const handleSave = async () => {
    if (!newEntry.trim() || !user) return;
    setIsSaving(true);
    try {
      const { error } = await supabase.from('journal_entries').insert([{ 
        content: newEntry, 
        mood_tag: mood,
        user_id: user.id,
        created_at: new Date().toISOString() 
      }]);
      if (error) throw error;
      setNewEntry('');
      setIsWriting(false);
      fetchEntries();
    } catch (err) { alert(err.message); } 
    finally { setIsSaving(false); }
  };

  const deleteEntry = async (id) => {
    const { error } = await supabase.from('journal_entries').delete().eq('id', id);
    if (!error) setEntries(entries.filter(e => e.id !== id));
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 pb-32 animate-fade-in">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12 border-b border-stone-100 pb-8">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs uppercase tracking-[0.2em]">
            <Sparkles className="w-3 h-3" /> Personal Sanctuary
          </div>
          <h1 className="text-4xl md:text-5xl font-serif text-stone-900">
            Spill your <span className="italic font-medium text-emerald-600">thoughts</span>, {displayName}.
          </h1>
        </div>
        
        {!isWriting && (
          <motion.button 
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => setIsWriting(true)}
            className="px-8 py-4 bg-stone-900 text-white rounded-2xl font-bold flex items-center gap-3 shadow-xl hover:bg-emerald-800 transition-all"
          >
            <Edit3 className="w-5 h-5" /> Start New Reflection
          </motion.button>
        )}
      </div>

      <AnimatePresence>
        {isWriting && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
            className="mb-12 bg-white rounded-[3rem] p-8 md:p-12 shadow-2xl border border-stone-100 relative overflow-hidden"
          >
            <button onClick={() => setIsWriting(false)} className="absolute top-8 right-8 p-2 hover:bg-stone-50 rounded-full text-stone-400"><X /></button>
            <div className="max-w-2xl mx-auto space-y-8">
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 block text-center">Emotional State</label>
                <div className="flex justify-center gap-3 flex-wrap">
                  {moods.map((m) => (
                    <button
                      key={m.id} onClick={() => setMood(m.id)}
                      className={`flex flex-col items-center gap-2 p-4 rounded-[2rem] transition-all min-w-[85px] border-2 ${
                        mood === m.id ? 'bg-stone-900 border-stone-900 text-white shadow-lg' : 'bg-stone-50 border-transparent text-stone-500 hover:bg-stone-100'
                      }`}
                    >
                      <m.icon className={`w-6 h-6 ${mood === m.id ? 'text-white' : m.color}`} />
                      <span className="text-[10px] font-black uppercase">{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <textarea autoFocus value={newEntry} onChange={(e) => setNewEntry(e.target.value)} className="w-full h-64 p-0 text-xl font-serif bg-transparent border-0 focus:ring-0 resize-none text-stone-800 placeholder:text-stone-200" placeholder="Once upon a time today..." />
              <div className="flex justify-center pt-6">
                <button onClick={handleSave} disabled={!newEntry.trim() || isSaving} className="px-12 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full font-black uppercase tracking-widest text-xs shadow-lg disabled:opacity-30 flex items-center gap-2">
                  {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Seal Reflection
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ENTRY FEED */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {loading ? (
          <div className="col-span-full py-24 flex flex-col items-center text-stone-300 gap-4">
            <Loader2 className="w-12 h-12 animate-spin" />
            <p className="font-serif italic tracking-widest">Gathering memories...</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="col-span-full text-center py-32 bg-white rounded-[3rem] border-2 border-dashed border-stone-100"><BookOpen className="w-16 h-16 text-stone-100 mx-auto mb-6" /><p className="text-stone-400 font-serif text-xl italic px-4">Your sanctuary is silent.</p></div>
        ) : (
          entries.map((entry, idx) => {
            const moodData = moods.find(m => m.id === entry.mood_tag) || moods[1];
            return (
              <motion.div 
                key={entry.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                className="group bg-white p-8 rounded-[2.5rem] shadow-sm hover:shadow-2xl border border-stone-50 transition-all relative overflow-hidden flex flex-col h-full"
              >
                <moodData.icon className={`absolute -right-4 -bottom-4 w-32 h-32 opacity-[0.04] ${moodData.color}`} />
                <div className="flex justify-between items-center mb-6">
                   <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-2xl ${moodData.bg} flex items-center justify-center`}><moodData.icon className={`w-5 h-5 ${moodData.color}`} /></div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">{new Date(entry.created_at).toLocaleDateString(undefined, { weekday: 'short' })}</p>
                        <p className="text-sm font-bold text-stone-700">{new Date(entry.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</p>
                      </div>
                   </div>
                   <button onClick={(e) => { e.stopPropagation(); deleteEntry(entry.id); }} className="p-2 text-stone-200 hover:text-rose-500 transition-all opacity-0 group-hover:opacity-100"><Trash2 className="w-4 h-4" /></button>
                </div>
                <p className="text-stone-700 font-serif text-lg leading-relaxed mb-8 line-clamp-3">"{entry.content || entry.text}"</p>
                
                {/* --- FIXED: ADDED ONCLICK HANDLER --- */}
                <div 
                  onClick={() => setSelectedEntry(entry)}
                  className="flex items-center gap-2 text-emerald-600 font-black text-[10px] uppercase tracking-[0.2em] cursor-pointer hover:underline mt-auto"
                >
                  Full Entry Details <ChevronRight className="w-3 h-3" />
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* --- NEW: READING MODAL UI --- */}
      <AnimatePresence>
        {selectedEntry && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-900/80 backdrop-blur-sm"
            onClick={() => setSelectedEntry(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white dark:bg-zinc-900 w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-[3rem] p-8 md:p-12 shadow-2xl border border-stone-100"
              onClick={(e) => e.stopPropagation()}
            >
              <button onClick={() => setSelectedEntry(null)} className="absolute top-8 right-8 p-2 bg-stone-50 rounded-full text-stone-400 hover:text-stone-800 transition-colors">
                <X className="w-6 h-6" />
              </button>

              <div className="flex flex-col items-center text-center mb-10">
                <div className={`w-16 h-16 rounded-[2rem] mb-4 flex items-center justify-center ${moods.find(m => m.id === selectedEntry.mood_tag)?.bg || 'bg-stone-50'}`}>
                  {React.createElement(moods.find(m => m.id === selectedEntry.mood_tag)?.icon || Meh, {
                    className: `w-8 h-8 ${moods.find(m => m.id === selectedEntry.mood_tag)?.color || 'text-stone-400'}`
                  })}
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-400">
                  {new Date(selectedEntry.created_at).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
              </div>

              <p className="text-xl md:text-2xl font-serif text-stone-800 dark:text-zinc-200 leading-loose italic text-center">
                "{selectedEntry.content || selectedEntry.text}"
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default Journal;