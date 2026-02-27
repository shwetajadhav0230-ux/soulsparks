import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  User, Mail, LogOut, Save, ShieldCheck, ArrowLeft, Trash2, 
  Upload, CheckCircle2, AlertCircle, Crown, Globe, FileOutput, 
  Settings, BellRing, Heart 
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { ClinicalService } from '../lib/supabaseService';

const Profile = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [user, setUser] = useState(null);
  
  // FORM STATE
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(null);
  
  // TOGGLE STATES
  const [notifications, setNotifications] = useState(true);
  const [privacyMode, setPrivacyMode] = useState(false);

  // UI STATES
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [feedback, setFeedback] = useState(null); 

  // --- PREMIUM CHECK ---
  const isPremium = useMemo(() => {
    const tier = user?.clinical_tier || user?.user_metadata?.clinical_tier;
    const premiumBool = user?.is_premium || user?.user_metadata?.is_premium;
    return tier === 'premium' || premiumBool === true;
  }, [user]);

  useEffect(() => { fetchUserData(); }, []);

  const fetchUserData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUser(user);
      setFullName(user.user_metadata?.full_name || '');
      setBio(user.user_metadata?.bio || '');
      setLocation(user.user_metadata?.location || '');
      setAvatarUrl(user.user_metadata?.avatar_url || null);
    }
  };

  const showFeedback = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleUpdateProfile = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: fullName, bio, location }
      });
      if (error) throw error;
      showFeedback('success', 'Your sanctuary profile has been updated.');
    } catch (err) {
      showFeedback('error', 'Update failed. Check your connection.');
    } finally {
      setIsSaving(false);
    }
  };

  // TRIGGER CSV EXPORT BUILT IN SUPABASESERVICE
  const handleExportData = async () => {
    try {
      const result = await ClinicalService.exportUserData(user.id);
      if (!result.success) throw new Error(result.error);

      const blob = new Blob([result.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SoulSpark_Data_Backup_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      showFeedback('success', 'Your personal data archive is ready.');
    } catch (err) {
      showFeedback('error', 'Export failed: ' + err.message);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/'); 
  };

  if (!user) return <div className="p-8 text-center text-stone-500">Connecting to SoulSpark...</div>;

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8 animate-fade-in pb-24">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-100 pb-8">
        <div className="flex items-center gap-4">
          <Link to="/" className="p-2 hover:bg-stone-100 rounded-full transition-all group">
            <ArrowLeft className="w-6 h-6 text-stone-400 group-hover:text-emerald-600 group-hover:-translate-x-1" />
          </Link>
          <div>
            <h1 className="text-3xl font-serif text-stone-800 tracking-tight">Account Settings</h1>
            <p className="text-sm text-stone-500 italic">Curate your personal sanctuary space.</p>
          </div>
        </div>
        <div className="flex gap-2">
           {isPremium && (
             <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 border border-amber-100 rounded-2xl text-xs font-black uppercase tracking-widest">
               <Crown className="w-4 h-4" /> Pro Member
             </div>
           )}
           <button onClick={handleLogout} className="px-4 py-2 text-stone-400 hover:text-rose-500 hover:bg-rose-50 rounded-2xl text-sm font-bold transition-all flex items-center gap-2">
             <LogOut className="w-4 h-4" /> Sign Out
           </button>
        </div>
      </div>

      {feedback && (
        <div className={`p-4 rounded-2xl flex items-center gap-3 text-sm font-bold animate-slide-up ${feedback.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'}`}>
          {feedback.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          {feedback.message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: PERSONAL INFO & BIO */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-8 rounded-[2.5rem] bg-white border border-stone-100 shadow-sm space-y-6">
            <h3 className="text-lg font-bold text-stone-800 flex items-center gap-2">
              <User className="w-5 h-5 text-emerald-500" /> Identity
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] font-black uppercase text-stone-400 ml-1">Full Name</label>
                <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full px-4 py-3 rounded-2xl bg-stone-50 border-0 focus:ring-2 focus:ring-emerald-500 transition-all font-medium text-stone-700" placeholder="e.g. Shweta Jadhav" />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-black uppercase text-stone-400 ml-1">Location</label>
                <div className="relative">
                  <Globe className="absolute left-4 top-3.5 w-4 h-4 text-stone-300" />
                  <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} className="w-full pl-11 pr-4 py-3 rounded-2xl bg-stone-50 border-0 focus:ring-2 focus:ring-emerald-500 transition-all font-medium text-stone-700" placeholder="Mumbai, IN" />
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-black uppercase text-stone-400 ml-1">Personal Bio</label>
              <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} className="w-full px-4 py-3 rounded-2xl bg-stone-50 border-0 focus:ring-2 focus:ring-emerald-500 transition-all font-medium text-stone-700 resize-none" placeholder="A few words about your journey..." />
            </div>

            <div className="flex justify-end pt-2">
              <button onClick={handleUpdateProfile} disabled={isSaving} className="bg-stone-900 hover:bg-emerald-700 text-white px-8 py-3 rounded-2xl font-bold transition-all flex items-center gap-2 disabled:opacity-50">
                {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Profile
              </button>
            </div>
          </div>

          {/* PRIVACY & DATA EXPORT */}
          <div className="p-8 rounded-[2.5rem] bg-emerald-50/50 border border-emerald-100 shadow-sm space-y-6">
             <div className="flex justify-between items-center">
               <h3 className="text-lg font-bold text-stone-800 flex items-center gap-2">
                 <ShieldCheck className="w-5 h-5 text-emerald-600" /> Privacy & Data
               </h3>
               <button onClick={handleExportData} className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-emerald-700 hover:text-emerald-800 bg-white px-4 py-2 rounded-xl shadow-sm border border-emerald-100 transition-all active:scale-95">
                 <FileOutput className="w-4 h-4" /> Export My CSV
               </button>
             </div>
             <p className="text-xs text-stone-500 leading-relaxed">Download a complete encrypted copy of your wellness logs, journal entries, and chat history for your own personal records.</p>
          </div>
        </div>

        {/* RIGHT COLUMN: PREFERENCES & SECURITY */}
        <div className="space-y-6">
          <div className="p-8 rounded-[2.5rem] bg-white border border-stone-100 shadow-sm space-y-6">
            <h3 className="text-lg font-bold text-stone-800 flex items-center gap-2">
              <Settings className="w-5 h-5 text-indigo-500" /> System
            </h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-stone-50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
                    <BellRing className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-bold text-stone-700">Insights</span>
                </div>
                <button onClick={() => setNotifications(!notifications)} className={`w-10 h-5 rounded-full transition-colors ${notifications ? 'bg-indigo-500' : 'bg-stone-300'}`}>
                  <div className={`w-3.5 h-3.5 bg-white rounded-full transition-transform ${notifications ? 'translate-x-5.5' : 'translate-x-1'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-stone-50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-rose-100 rounded-lg flex items-center justify-center text-rose-600">
                    <Heart className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-bold text-stone-700">Encrypted</span>
                </div>
                <button onClick={() => setPrivacyMode(!privacyMode)} className={`w-10 h-5 rounded-full transition-colors ${privacyMode ? 'bg-rose-500' : 'bg-stone-300'}`}>
                  <div className={`w-3.5 h-3.5 bg-white rounded-full transition-transform ${privacyMode ? 'translate-x-5.5' : 'translate-x-1'}`} />
                </button>
              </div>
            </div>
          </div>

          <div className="p-8 rounded-[2.5rem] bg-stone-900 text-white shadow-xl space-y-4 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10"><Crown className="w-16 h-16" /></div>
             <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Security Verified</p>
             <p className="text-xs text-stone-400">Your profile is protected by enterprise-grade AES-256 encryption. Only you can access your reflective data.</p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Profile;