import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Edit3, 
  Save, 
  Trash2, 
  Smile, 
  Meh, 
  Frown, 
  AlertCircle,
  Clock,
  Loader2
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import Card from '../components/common/Card';
import Button from '../components/common/Button';

/**
 * Integrated Journal Component
 * Combines Supabase persistence with reflective UI.
 */
const Journal = () => {
  const [entries, setEntries] = useState([]);
  const [newEntry, setNewEntry] = useState('');
  const [mood, setMood] = useState('neutral');
  const [isWriting, setIsWriting] = useState(false);
  const [loading, setLoading] = useState(true);

  const moods = [
    { id: 'happy', icon: Smile, label: 'Happy', color: 'text-green-500' },
    { id: 'neutral', icon: Meh, label: 'Neutral', color: 'text-stone-400' },
    { id: 'sad', icon: Frown, label: 'Sad', color: 'text-blue-500' },
    { id: 'anxious', icon: AlertCircle, label: 'Anxious', color: 'text-orange-500' }
  ];

  // Fetch entries when the component mounts
  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('journal_entries')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEntries(data || []);
    } catch (error) {
      console.error("Error fetching entries:", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!newEntry.trim()) return;

    try {
      // 1. Identify the current authenticated user
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        alert("Please log in to save your reflections.");
        return;
      }

      // 2. Insert entry with user association
      const { error } = await supabase
        .from('journal_entries')
        .insert([{ 
          text: newEntry, 
          mood: mood,
          user_id: user.id, // Mandatory for RLS policies
          created_at: new Date().toISOString() 
        }]);

      if (error) throw error;

      // 3. Reset UI and refresh list
      setNewEntry('');
      setIsWriting(false);
      fetchEntries(); 
    } catch (error) {
      console.error("Error saving entry:", error.message);
    }
  };

  const deleteEntry = async (id) => {
    try {
      const { error } = await supabase
        .from('journal_entries')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      // Update local state directly for immediate UI response
      setEntries(entries.filter(e => e.id !== id));
    } catch (error) {
      console.error("Error deleting entry:", error.message);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 animate-in fade-in duration-700">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="font-serif text-3xl text-stone-900">Reflective Journal</h2>
          <p className="text-stone-500">Document your journey to clarity and peace.</p>
        </div>
        {!isWriting && (
          <Button onClick={() => setIsWriting(true)} variant="sage">
            <Edit3 className="w-4 h-4" /> New Entry
          </Button>
        )}
      </div>

      {isWriting && (
        <Card className="mb-8 ring-2 ring-green-100 animate-in slide-in-from-top-4">
          <div className="mb-6">
            <label className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-3 block">
              How are you feeling?
            </label>
            <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
              {moods.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMood(m.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
                    mood === m.id ? 'bg-stone-800 text-white shadow-md' : 'bg-stone-50 text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  <m.icon className={`w-4 h-4 ${mood === m.id ? 'text-white' : m.color}`} />
                  <span className="text-sm font-medium">{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          <textarea
            value={newEntry}
            onChange={(e) => setNewEntry(e.target.value)}
            className="w-full h-48 p-4 rounded-2xl bg-stone-50 border-0 focus:ring-2 focus:ring-green-100 resize-none text-stone-700 placeholder:text-stone-400 mb-4 outline-none"
            placeholder="What's on your mind today? Let it flow..."
          />

          <div className="flex justify-end gap-3">
            <Button variant="text" onClick={() => setIsWriting(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSave}>
              <Save className="w-4 h-4" /> Save Entry
            </Button>
          </div>
        </Card>
      )}

      <div className="space-y-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-stone-400 gap-3">
            <Loader2 className="w-8 h-8 animate-spin" />
            <p>Gathering your reflections...</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-stone-100">
            <BookOpen className="w-12 h-12 text-stone-200 mx-auto mb-4" />
            <p className="text-stone-400">No entries yet. Start writing your story today.</p>
          </div>
        ) : (
          entries.map((entry) => (
            <Card key={entry.id} className="group hover:shadow-md transition-shadow relative overflow-hidden">
               {/* Aesthetic Mood Indicator Bar */}
              <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                moods.find(m => m.id === entry.mood)?.color.replace('text', 'bg') || 'bg-stone-200'
              }`} />
              
              <div className="flex justify-between items-start mb-4 pl-2">
                <div className="flex items-center gap-2 text-stone-400">
                  <Clock className="w-3 h-3" />
                  <span className="text-xs font-medium">
                    {new Date(entry.created_at).toLocaleDateString(undefined, { 
                      weekday: 'long', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest bg-stone-50 px-2 py-1 rounded">
                    {entry.mood}
                  </span>
                  <button 
                    onClick={() => deleteEntry(entry.id)}
                    className="text-stone-200 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p className="text-stone-700 leading-relaxed whitespace-pre-wrap pl-2">{entry.text}</p>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default Journal;